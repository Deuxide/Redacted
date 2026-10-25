import { RoleBadge } from '../components/RoleBadge';
import { Button } from '../components/Primitives';
import { Scoreboard } from '../components/Scoreboard';
import { ScreenShell } from '../components/ScreenShell';
import { tallyVotes } from '../game/results';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './ResultsScreen.module.css';

export function ResultsScreen() {
  const { game, session, roundPoints, playAgain, continueSession, newGame, leaveGame } = useGame();
  const { t } = useI18n();

  if (!game || game.phase !== 'results') {
    return (
      <ScreenShell title={t('gameOver')} subtitle={t('resultsLocked')} onBack={leaveGame}>
        <p>{t('roundUnfinished')}</p>
      </ScreenShell>
    );
  }

  const tally = tallyVotes(game);
  const hasUndercover = game.players.some((player) => player.role === 'undercover');
  const hasBlank = game.players.some((player) => player.role === 'doesntKnow');
  const title = tally.outcome === 'draw' ? t('drawResult')
    : tally.outcome === 'civilianWin' ? t('civiliansWin')
      : tally.outcome === 'doesntKnowWin' ? t('doesntKnowWin')
        : tally.outcome === 'continue' && !hasUndercover ? t('noFactionWin')
          : t('undercoverWin');
  const why = tally.outcome === 'draw' ? t('drawReason')
    : tally.outcome === 'civilianWin' ? t(hasUndercover ? 'whyCivilians' : 'whyCiviliansNoUndercover')
      : tally.outcome === 'doesntKnowWin' ? t('whyDoesntKnow')
        : tally.outcome === 'continue' && !hasUndercover ? t('whyNoFactionWin')
          : t('whyUndercover');

  return (
    <ScreenShell title={t('gameOver')} onBack={leaveGame} footer={<Button wide onClick={continueSession}>{t('continueGame')}</Button>}>
      <section className={tally.outcome === 'draw' ? styles.draw : tally.civiliansWin ? styles.win : styles.lose} aria-live="polite">
        <p>{t('gameOver')}</p>
        <h2>{title}</h2>
        <p>{why}</p>
        <p>{t('civiliansLabel')}: {tally.civilians === 'win' ? t('win') : t('lose')}</p>
        {tally.undercover !== 'none' ? <p>{t(tally.undercover === 'caught' ? 'roleCaught' : 'roleSurvived', { role: t('undercover') })}</p> : null}
        {tally.doesntKnow !== 'none' ? <p>{t(tally.doesntKnow === 'caught' ? 'roleCaught' : 'roleSurvived', { role: t('doesntKnow') })}</p> : null}
      </section>

      <section className={styles.words}>
        <article className={styles.civilianCard}>
          <h2>{t('civilianWord')}</h2>
          <p>{game.civilianWord}</p>
        </article>
        {hasUndercover ? (
          <article className={styles.undercoverCard}>
            <h2>{t('undercoverWord')}</h2>
            <p>{game.undercoverWord}</p>
          </article>
        ) : null}
        {hasBlank ? (
          <article className={styles.blankCard}>
            <h2>{t('doesntKnow')}</h2>
            <p>{t('noWord')}</p>
          </article>
        ) : null}
      </section>

      {game.players.some((player) => player.doesntKnowGuess && player.doesntKnowGuess !== 'pending') ? (
        <section>
          <h2 className={styles.section}>{t('individualWinners')}</h2>
          {game.players.filter((player) => player.doesntKnowGuess && player.doesntKnowGuess !== 'pending').map((player) => (
            <article key={player.id} className={styles.person}>
              <strong>{player.name}</strong>
              <p>{player.doesntKnowGuess === 'correct' ? `✓ ${t('guessedRight')}` : `✗ ${t('guessedWrong')}`}</p>
            </article>
          ))}
        </section>
      ) : null}
      <section>
        <h2 className={styles.section}>{t('eliminatedLabel')}</h2>
        {game.eliminations.length ? game.eliminations.map((item) => {
          const player = game.players.find((entry) => entry.id === item.playerId);
          if (!player) return null;
          return (
            <article key={`${item.round}-${item.playerId}`} className={styles.person}>
              <p>{t('roundLabel', { n: item.round })}</p>
              <strong>{player.name}</strong>
              <RoleBadge role={player.role} />
              <p>{player.role === 'doesntKnow' ? t('noWord') : player.word}</p>
            </article>
          );
        }) : <p>{t('tieLabel')}</p>}
      </section>
      <section>
        <h2 className={styles.section}>{t('whoHadWhat')}</h2>
        <div className={styles.people}>
          {game.players.map((player) => {
            const caught = tally.eliminatedIds.includes(player.id);
            return (
              <article key={player.id} className={styles.person}>
                <strong>{player.name}</strong>
                <RoleBadge role={player.role} />
                <p>{player.role === 'doesntKnow' ? t('noWord') : player.word}</p>
                <p>{t('votesReceived', { count: tally.counts[player.id] ?? 0 })}</p>
                {player.role === 'civilian' ? null : <p>{caught ? `✓ ${t('caught')}` : `✗ ${t('notCaught')}`}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className={styles.section}>{t('roundPoints')}</h2>
        {game.players.map((player) => (
          <p key={player.id}>{player.name} <strong>{t('plusPoints', { count: roundPoints[player.id] ?? 0 })}</strong></p>
        ))}
      </section>
      {session ? <Scoreboard players={session.players} gains={roundPoints} /> : null}
      <section>
        <h2 className={styles.section}>{t('mostVotes')}</h2>
        {(game.voteHistory ?? []).map((item, index) => (
          <article key={`${item.round}-${index}`} className={styles.person}>
            <p>{t('roundLabel', { n: item.round })}</p>
            {Object.entries(item.counts).filter(([, count]) => count > 0).map(([id, count]) => (
              <p key={id}>{id === 'skip' ? t('skipVote') : game.players.find((player) => player.id === id)?.name ?? id}: {count}</p>
            ))}
          </article>
        ))}
      </section>
      <Button variant="secondary" wide onClick={playAgain}>{t('playAgain')}</Button>
      <Button variant="secondary" wide onClick={newGame}>
        {t('newGame')}
      </Button>
      <Button variant="quiet" wide onClick={leaveGame}>{t('backToMenu')}</Button>
    </ScreenShell>
  );
}

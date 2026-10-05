import { RoleBadge } from '../components/RoleBadge';
import { ScreenShell } from '../components/ScreenShell';
import { tallyVotes } from '../game/results';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './ResultsScreen.module.css';

export function ResultsScreen() {
  const { game, playAgain, newGame, revote, leaveGame } = useGame();
  const { t } = useI18n();

  if (!game || game.phase !== 'results') {
    return (
      <ScreenShell title={t('gameOver')} subtitle={t('resultsLocked')} onBack={leaveGame}>
        <p>{t('roundUnfinished')}</p>
      </ScreenShell>
    );
  }

  const tally = tallyVotes(game);
  const title = tally.tied ? t('tieResult') : tally.civiliansWin ? t('civiliansWin') : t('specialWin');
  const why = tally.tied ? t('whyTie') : tally.civiliansWin ? t('whyCivilians') : t('whySpecial');
  const ranking = [...game.players].sort((a, b) => (tally.counts[b.id] ?? 0) - (tally.counts[a.id] ?? 0) || a.name.localeCompare(b.name));
  const hasUndercover = game.players.some((player) => player.role === 'undercover');
  const hasBlank = game.players.some((player) => player.role === 'doesntKnow');

  return (
    <ScreenShell title={t('gameOver')} onBack={leaveGame}>
      <section className={tally.civiliansWin ? styles.win : styles.lose} aria-live="polite">
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
        <h2 className={styles.section}>{t('mostVotes')}</h2>
        {tally.tied ? <p className={styles.tie}>{t('tieLabel')}</p> : null}
        <ol className={styles.rank}>
          {ranking.map((player) => (
            <li key={player.id}>{t('voteRank', { name: player.name, count: tally.counts[player.id] ?? 0 })}</li>
          ))}
        </ol>
      </section>

      {tally.tied ? (
        <button type="button" className={styles.secondary} onClick={revote}>
          {t('tieRevote')}
        </button>
      ) : null}
      <button type="button" className={styles.primary} onClick={playAgain}>
        {t('playAgain')}
      </button>
      <button type="button" className={styles.secondary} onClick={newGame}>
        {t('newGame')}
      </button>
      <button type="button" className={styles.secondary} onClick={leaveGame}>
        {t('home')}
      </button>
    </ScreenShell>
  );
}

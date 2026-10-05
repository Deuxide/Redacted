import { RoleBadge } from '../components/RoleBadge';
import { ScreenShell } from '../components/ScreenShell';
import { SKIP_VOTE_ID, activePlayers, canVoteAgain, tallyVotes } from '../game/results';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './ResultsScreen.module.css';

export function EliminationScreen() {
  const { game, continueAfterElimination, revote, leaveGame } = useGame();
  const { t } = useI18n();
  if (!game || game.phase !== 'elimination') {
    return (
      <ScreenShell title={t('gameOver')} onBack={leaveGame}>
        <p>{t('roundUnfinished')}</p>
      </ScreenShell>
    );
  }
  const last = game.eliminations.at(-1);
  const just = game.players.find((player) => player.id === last?.playerId && last.round === game.round);
  const tally = tallyVotes(game);
  const skipped = !tally.tied && tally.leaders.length === 1 && tally.leaders[0]?.id === SKIP_VOTE_ID;
  const tied = tally.tied;
  return (
    <ScreenShell title={t('roundLabel', { n: game.round })} onBack={leaveGame}>
      {tied ? (
        <>
          <h2 className={styles.section}>{t('tieLabel')}</h2>
          <p>{t('tieAgain')}</p>
          <p>{t('tiedPlayers')}: {tally.leaders.map((leader) => leader.id === SKIP_VOTE_ID ? t('skipVote') : leader.name).join(', ')}</p>
          <ol className={styles.rank}>
            {activePlayers(game.players)
              .map((player) => ({ player, votes: tally.counts[player.id] ?? 0 }))
              .sort((a, b) => b.votes - a.votes || a.player.name.localeCompare(b.player.name))
              .map(({ player, votes }) => (
                <li key={player.id}>{t('voteRank', { name: player.name, count: votes })}</li>
              ))}
          </ol>
        </>
      ) : null}
      {skipped ? (
        <>
          <h2 className={styles.section}>{t('voteSkipped')}</h2>
          <p>{t('skipAgain')}</p>
          <p>{t('skipVote')}: {tally.counts[SKIP_VOTE_ID] ?? 0}</p>
        </>
      ) : null}
      {just && !skipped && !tied ? (
        <article className={styles.person}>
          <p>{t('votedOut', { name: just.name })}</p>
          <RoleBadge role={just.role} />
          <p>{just.role === 'doesntKnow' ? t('noWord') : just.word}</p>
        </article>
      ) : null}
      <p>{t('activeLeft', { count: activePlayers(game.players).length })}</p>
      {tied || skipped ? (
        <button type="button" className={styles.primary} onClick={canVoteAgain(game.players) ? revote : continueAfterElimination}>
          {canVoteAgain(game.players) ? t('tieRevote') : t('seeResults')}
        </button>
      ) : (
        <button type="button" className={styles.primary} onClick={continueAfterElimination}>
          {canVoteAgain(game.players) ? t('continueVote') : t('seeResults')}
        </button>
      )}
    </ScreenShell>
  );
}

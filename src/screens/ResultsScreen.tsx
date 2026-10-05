import { ScreenShell } from '../components/ScreenShell';
import { tallyVotes } from '../game/results';
import { useGame } from '../state/GameProvider';
import styles from './ResultsScreen.module.css';

export function ResultsScreen() {
  const { game, playAgain, newGame, revote, leaveGame } = useGame();

  if (!game || game.phase !== 'results') {
    return (
      <ScreenShell title="Results" subtitle="Finish voting before the words are revealed." onBack={leaveGame}>
        <p>The round is not finished.</p>
      </ScreenShell>
    );
  }

  const tally = tallyVotes(game);
  const undercover = game.players.filter((player) => player.role === 'undercover');
  const outcome = tally.tied
    ? 'Tie! Nobody is eliminated, so the undercover side wins.'
    : tally.civiliansWin
      ? 'Civilians win. Every undercover player was identified.'
      : 'Undercover wins. At least one undercover player survived the vote.';

  return (
    <ScreenShell title="Results" subtitle={outcome} onBack={leaveGame}>
      <section className={styles.block}>
        <h2>{tally.tied ? 'Tie!' : 'Most votes'}</h2>
        {tally.leaders.map((leader) => (
          <p key={leader.id}>
            {leader.name} — {leader.votes} {leader.votes === 1 ? 'vote' : 'votes'}
          </p>
        ))}
        {tally.tied ? <p>No player is eliminated.</p> : null}
      </section>
      <section className={styles.block}>
        <h2>Actual undercover</h2>
        {undercover.map((player) => (
          <p key={player.id}>{player.name}</p>
        ))}
      </section>
      <section className={styles.block}>
        <h2>Civilian word</h2>
        <p className={styles.word}>{game.civilianWord}</p>
        <h2>Undercover word</h2>
        <p className={styles.word}>{game.undercoverWord}</p>
      </section>
      <section className={styles.block}>
        <h2>Everyone</h2>
        <ul>
          {game.players.map((player) => (
            <li key={player.id} className={player.role === 'undercover' ? styles.undercover : styles.civilian}>
              {player.name} — {player.role === 'undercover' ? 'UNDERCOVER' : 'CIVILIAN'} — {player.word} — {tally.counts[player.id] ?? 0}{' '}
              {(tally.counts[player.id] ?? 0) === 1 ? 'vote' : 'votes'}
            </li>
          ))}
        </ul>
      </section>
      {tally.tied ? (
        <button type="button" className={game.tieBehavior === 'revote' ? styles.primary : styles.secondary} onClick={revote}>
          Revote
        </button>
      ) : null}
      <button type="button" className={game.tieBehavior === 'revote' && tally.tied ? styles.secondary : styles.primary} onClick={playAgain}>
        Play Again
      </button>
      <button type="button" className={styles.secondary} onClick={newGame}>
        New Game
      </button>
      <button type="button" className={styles.secondary} onClick={leaveGame}>
        Home
      </button>
    </ScreenShell>
  );
}

import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import styles from './RevealScreen.module.css';

export function DiscussionScreen() {
  const { game, startVoting, leaveGame } = useGame();

  return (
    <ScreenShell title="Everyone has received their word." subtitle="Now discuss your words in real life." onBack={leaveGame}>
      <p className={styles.copy}>Describe your word without saying it directly.</p>
      <p className={styles.meta}>Talk away from this screen. The app does not collect the discussion.</p>
      {game ? <p className={styles.meta}>{game.players.length} players are in this round.</p> : null}
      <button type="button" className={styles.reveal} onClick={startVoting} disabled={!game}>
        Start Voting
      </button>
    </ScreenShell>
  );
}

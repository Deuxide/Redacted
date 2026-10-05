import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const { openSetup, openWordSets, openImport, openExport } = useGame();

  return (
    <ScreenShell title="Undercover" subtitle="One phone. Secret words. Find who does not match.">
      <p className={styles.note}>Pass one phone around. Talk in real life. Vote on the phone. No account and no server.</p>
      <button type="button" className={styles.primary} onClick={openSetup}>
        New Game
      </button>
      <button type="button" className={styles.secondary} onClick={openWordSets}>
        Word Sets
      </button>
      <button type="button" className={styles.secondary} onClick={openImport}>
        Import JSON
      </button>
      <button type="button" className={styles.secondary} onClick={openExport}>
        Export JSON
      </button>
    </ScreenShell>
  );
}

import { useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import { playableGroups } from '../types/game';
import { downloadWordSet } from '../wordSets/storage';
import styles from './WordSetScreen.module.css';

export function ExportScreen() {
  const { wordSets, selectedSet, goHome } = useGame();
  const [setId, setSetId] = useState(selectedSet.id);
  const [error, setError] = useState<string | null>(null);
  const chosen = wordSets.find((set) => set.id === setId) ?? selectedSet;

  return (
    <ScreenShell title="Export JSON" subtitle="Downloads the word list. Assigned game words stay hidden." onBack={goHome}>
      <div className={styles.sets}>
        {wordSets.map((set) => (
          <button
            key={set.id}
            type="button"
            className={set.id === chosen.id ? styles.selected : styles.set}
            onClick={() => {
              setSetId(set.id);
              setError(null);
            }}
          >
            <strong>{set.name}</strong>
            <small>{playableGroups(set).length} playable groups</small>
          </button>
        ))}
      </div>
      {error ? <p className={styles.warn}>{error}</p> : null}
      <button
        type="button"
        className={styles.primary}
        onClick={() => {
          const result = downloadWordSet(chosen);
          setError(result.ok ? null : result.error);
        }}
      >
        Download {chosen.name}
      </button>
    </ScreenShell>
  );
}

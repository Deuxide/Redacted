import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import { playableGroups } from '../types/game';
import styles from './WordSetScreen.module.css';

export function WordSetsScreen() {
  const { wordSets, selectedSet, goHome, openImport, openExport, openEditor, setWordSetId, createCustomSet, duplicateWordSet, deleteWordSet } =
    useGame();

  return (
    <ScreenShell title="Word Sets" subtitle="Groups of related words. The game picks two at random." onBack={goHome}>
      <div className={styles.row}>
        <button type="button" className={styles.primary} onClick={createCustomSet}>
          New set
        </button>
        <button type="button" className={styles.secondary} onClick={openImport}>
          Import
        </button>
        <button type="button" className={styles.secondary} onClick={openExport}>
          Export
        </button>
      </div>
      {wordSets.map((set) => {
        const ready = playableGroups(set).length;
        const selected = set.id === selectedSet.id;
        return (
          <article key={set.id} className={styles.card}>
            <h2>{set.name}</h2>
            <p>{set.description || 'No description'}</p>
            <small>
              {ready} playable groups · {set.groups.length} total{set.builtin ? ' · built-in' : ''}
              {selected ? ' · used for new games' : ''}
            </small>
            <div className={styles.actions}>
              <button type="button" onClick={() => setWordSetId(set.id)}>
                Use
              </button>
              {set.builtin ? (
                <button type="button" onClick={() => duplicateWordSet(set.id)}>
                  Duplicate
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => openEditor(set.id)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => duplicateWordSet(set.id)}>
                    Duplicate
                  </button>
                  <button type="button" className={styles.danger} onClick={() => deleteWordSet(set.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </ScreenShell>
  );
}

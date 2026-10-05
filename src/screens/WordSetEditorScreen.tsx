import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import type { WordSet } from '../types/game';
import { MIN_WORDS_PER_GROUP, uniqueWords } from '../types/game';
import { blankGroup } from '../wordSets/mutate';
import styles from './WordSetScreen.module.css';

export function WordSetEditorScreen() {
  const { editingSet, openWordSets, updateWordSet } = useGame();

  if (!editingSet) {
    return (
      <ScreenShell title="Editor" subtitle="That set is not editable." onBack={openWordSets}>
        <p className={styles.note}>Built-in sets stay fixed. Duplicate one to make your own.</p>
      </ScreenShell>
    );
  }

  function change(next: WordSet) {
    updateWordSet(next);
  }

  return (
    <ScreenShell title="Edit set" subtitle="Each group needs at least 2 different words." onBack={openWordSets}>
      <label className={styles.field}>
        Name
        <input value={editingSet.name} maxLength={40} onChange={(event) => change({ ...editingSet, name: event.target.value })} />
      </label>
      <label className={styles.field}>
        Description
        <input
          value={editingSet.description}
          maxLength={120}
          onChange={(event) => change({ ...editingSet, description: event.target.value })}
        />
      </label>
      {editingSet.groups.map((group, groupIndex) => {
        const ready = uniqueWords(group.words).length >= MIN_WORDS_PER_GROUP;
        return (
          <article key={group.id} className={styles.card}>
            <label className={styles.field}>
              Group label
              <input
                value={group.label ?? ''}
                maxLength={40}
                placeholder={`Group ${groupIndex + 1}`}
                onChange={(event) =>
                  change({
                    ...editingSet,
                    groups: editingSet.groups.map((item) =>
                      item.id === group.id ? { ...item, label: event.target.value } : item,
                    ),
                  })
                }
              />
            </label>
            {group.words.map((word, wordIndex) => (
              <div key={`${group.id}-${wordIndex}`} className={styles.wordRow}>
                <input
                  value={word}
                  maxLength={32}
                  aria-label={`Word ${wordIndex + 1}`}
                  onChange={(event) =>
                    change({
                      ...editingSet,
                      groups: editingSet.groups.map((item) =>
                        item.id === group.id
                          ? { ...item, words: item.words.map((current, index) => (index === wordIndex ? event.target.value : current)) }
                          : item,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    change({
                      ...editingSet,
                      groups: editingSet.groups.map((item) =>
                        item.id === group.id ? { ...item, words: item.words.filter((_, index) => index !== wordIndex) } : item,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <p className={ready ? styles.ok : styles.warn}>
              {ready ? 'Ready for a game.' : 'Needs 2 different words. Empty and repeated words are ignored.'}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() =>
                  change({
                    ...editingSet,
                    groups: editingSet.groups.map((item) =>
                      item.id === group.id ? { ...item, words: [...item.words, ''] } : item,
                    ),
                  })
                }
              >
                Add word
              </button>
              <button
                type="button"
                className={styles.danger}
                onClick={() => change({ ...editingSet, groups: editingSet.groups.filter((item) => item.id !== group.id) })}
              >
                Delete group
              </button>
            </div>
          </article>
        );
      })}
      <button type="button" className={styles.primary} onClick={() => change({ ...editingSet, groups: [...editingSet.groups, blankGroup()] })}>
        Add group
      </button>
    </ScreenShell>
  );
}

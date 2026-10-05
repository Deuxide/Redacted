import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import type { WordSet } from '../types/game';
import { MIN_WORDS_PER_GROUP, uniqueWords } from '../types/game';
import { blankGroup } from '../wordSets/mutate';
import styles from './WordSetScreen.module.css';

export function WordSetEditorScreen() {
  const { editingSet, openWordSets, updateWordSet } = useGame();
  const { t } = useI18n();

  if (!editingSet) {
    return (
      <ScreenShell title={t('editTitle')} subtitle={t('editorMissing')} onBack={openWordSets}>
        <p className={styles.note}>{t('editorMissingNote')}</p>
      </ScreenShell>
    );
  }

  function change(next: WordSet) {
    updateWordSet(next);
  }

  return (
    <ScreenShell title={t('editTitle')} subtitle={t('editSubtitle')} onBack={openWordSets}>
      <label className={styles.field}>
        {t('setName')}
        <input value={editingSet.name} maxLength={40} onChange={(event) => change({ ...editingSet, name: event.target.value })} />
      </label>
      <label className={styles.field}>
        {t('description')}
        <input value={editingSet.description} maxLength={120} onChange={(event) => change({ ...editingSet, description: event.target.value })} />
      </label>
      {editingSet.groups.map((group, groupIndex) => {
        const ready = uniqueWords(group.words).length >= MIN_WORDS_PER_GROUP;
        return (
          <article key={group.id} className={styles.card}>
            <label className={styles.field}>
              {t('groupLabel')}
              <input
                value={group.label ?? ''}
                maxLength={40}
                placeholder={t('groupFallback', { n: groupIndex + 1 })}
                onChange={(event) =>
                  change({
                    ...editingSet,
                    groups: editingSet.groups.map((item) => (item.id === group.id ? { ...item, label: event.target.value } : item)),
                  })
                }
              />
            </label>
            {group.words.map((word, wordIndex) => (
              <div key={`${group.id}-${wordIndex}`} className={styles.wordRow}>
                <input
                  value={word}
                  maxLength={32}
                  aria-label={t('wordLabel', { n: wordIndex + 1 })}
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
                  {t('remove')}
                </button>
              </div>
            ))}
            <p className={ready ? styles.ok : styles.warn}>{ready ? t('readyGroup') : t('shortGroup')}</p>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() =>
                  change({
                    ...editingSet,
                    groups: editingSet.groups.map((item) => (item.id === group.id ? { ...item, words: [...item.words, ''] } : item)),
                  })
                }
              >
                {t('addWord')}
              </button>
              <button type="button" className={styles.danger} onClick={() => change({ ...editingSet, groups: editingSet.groups.filter((item) => item.id !== group.id) })}>
                {t('deleteGroup')}
              </button>
            </div>
          </article>
        );
      })}
      <button type="button" className={styles.primary} onClick={() => change({ ...editingSet, groups: [...editingSet.groups, blankGroup()] })}>
        {t('addGroup')}
      </button>
    </ScreenShell>
  );
}

import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import { playableGroups } from '../types/game';
import styles from './WordSetScreen.module.css';

export function WordSetsScreen() {
  const { wordSets, selectedSet, goHome, openImport, openExport, openEditor, setWordSetId, createCustomSet, duplicateWordSet, deleteWordSet } = useGame();
  const { t } = useI18n();

  return (
    <ScreenShell title={t('wordSets')} subtitle={t('wordSetsSubtitle')} onBack={goHome}>
      <div className={styles.row}>
        <button type="button" className={styles.primary} onClick={createCustomSet}>{t('newSet')}</button>
        <button type="button" className={styles.secondary} onClick={openImport}>{t('import')}</button>
        <button type="button" className={styles.secondary} onClick={openExport}>{t('export')}</button>
      </div>
      {wordSets.map((set) => {
        const ready = playableGroups(set).length;
        const selected = set.id === selectedSet.id;
        return (
          <article key={set.id} className={styles.card}>
            <h2>{set.name}</h2>
            <p>{set.description || t('noDescription')}</p>
            <small>
              {t('totalGroups', { ready, total: set.groups.length })}
              {set.builtin ? ` · ${t('builtin')}` : ''}
              {selected ? ` · ${t('usedForGames')}` : ''}
            </small>
            <div className={styles.actions}>
              <button type="button" onClick={() => setWordSetId(set.id)}>{t('use')}</button>
              {set.builtin ? (
                <button type="button" onClick={() => duplicateWordSet(set.id)}>{t('duplicate')}</button>
              ) : (
                <>
                  <button type="button" onClick={() => openEditor(set.id)}>{t('edit')}</button>
                  <button type="button" onClick={() => duplicateWordSet(set.id)}>{t('duplicate')}</button>
                  <button type="button" className={styles.danger} onClick={() => deleteWordSet(set.id)}>{t('delete')}</button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </ScreenShell>
  );
}

import { Button, Card } from '../components/Primitives';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import { playableGroups } from '../types/game';
import styles from './WordSetScreen.module.css';

export function WordSetsScreen() {
  const { wordSets, selectedSet, goHome, openImport, openExport, openEditor, setWordSetId, createCustomSet, duplicateWordSet, deleteWordSet } = useGame();
  const { t } = useI18n();

  return (
    <ScreenShell title={t('wordSets')} subtitle={t('wordSetsSubtitle')} onBack={goHome}
      footer={<Button wide onClick={createCustomSet}>{t('newSet')}</Button>}>
      <div className={styles.row}>
        <Button variant="secondary" onClick={openImport}>{t('import')}</Button>
        <Button variant="secondary" onClick={openExport}>{t('export')}</Button>
      </div>
      {wordSets.map((set) => {
        const ready = playableGroups(set).length;
        const selected = set.id === selectedSet.id;
        return (
          <Card key={set.id} className={styles.card}>
            <h2>{set.name}</h2>
            <p>{set.description || t('noDescription')}</p>
            <small>
              {t('totalGroups', { ready, total: set.groups.length })}
              {set.builtin ? ` · ${t('builtin')}` : ''}
              {selected ? ` · ${t('usedForGames')}` : ''}
            </small>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setWordSetId(set.id)} aria-pressed={selected}>{t('use')}</Button>
              {set.builtin ? (
                <Button variant="secondary" onClick={() => duplicateWordSet(set.id)}>{t('duplicate')}</Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => openEditor(set.id)}>{t('edit')}</Button>
                  <Button variant="secondary" onClick={() => duplicateWordSet(set.id)}>{t('duplicate')}</Button>
                  <Button variant="danger" onClick={() => deleteWordSet(set.id)}>{t('delete')}</Button>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </ScreenShell>
  );
}

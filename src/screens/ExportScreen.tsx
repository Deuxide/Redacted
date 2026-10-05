import { useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import { playableGroups } from '../types/game';
import { downloadWordSet } from '../wordSets/storage';
import styles from './WordSetScreen.module.css';

export function ExportScreen() {
  const { wordSets, selectedSet, goHome } = useGame();
  const { t } = useI18n();
  const [setId, setSetId] = useState(selectedSet.id);
  const [error, setError] = useState<string | null>(null);
  const chosen = wordSets.find((set) => set.id === setId) ?? selectedSet;

  return (
    <ScreenShell title={t('exportTitle')} subtitle={t('exportSubtitle')} onBack={goHome}>
      <div className={styles.sets}>
        {wordSets.map((set) => (
          <button key={set.id} type="button" className={set.id === chosen.id ? styles.selected : styles.set} onClick={() => { setSetId(set.id); setError(null); }}>
            <strong>{set.name}</strong>
            <small>{t('playableGroups', { count: playableGroups(set).length })}</small>
          </button>
        ))}
      </div>
      {error ? <p className={styles.warn}>{t('exportNeedsWords')}</p> : null}
      <button type="button" className={styles.primary} onClick={() => { const result = downloadWordSet(chosen); setError(result.ok ? null : result.error); }}>
        {t('download', { name: chosen.name })}
      </button>
    </ScreenShell>
  );
}

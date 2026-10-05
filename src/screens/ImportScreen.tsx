import { useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { useGame } from '../state/GameProvider';
import type { WordSet } from '../types/game';
import { parseWordSetJson } from '../wordSets/validate';
import styles from './WordSetScreen.module.css';

const issueKeys = new Set<MessageKey>(['invalidJson', 'badShape', 'mapTooSmall', 'emptyFile', 'needsObject', 'needsGroups', 'needsName', 'noPlayable', 'skippedGroup', 'fileTooLarge', 'fileUnreadable']);

export function ImportScreen() {
  const { goHome, addImportedSets } = useGame();
  const { t } = useI18n();
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, setPending] = useState<WordSet[]>([]);
  const [paste, setPaste] = useState('');

  function label(code: string) {
    return issueKeys.has(code as MessageKey) ? t(code as MessageKey) : t('badShape');
  }

  function review(raw: string) {
    const result = parseWordSetJson(raw);
    if (!result.ok) {
      setErrors(result.errors);
      setWarnings([]);
      setPending([]);
      return;
    }
    setErrors([]);
    setWarnings([...new Set(result.warnings)]);
    setPending(result.sets);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 500_000) {
      setErrors(['fileTooLarge']);
      setWarnings([]);
      setPending([]);
      return;
    }
    try {
      review(await file.text());
    } catch {
      setErrors(['fileUnreadable']);
      setWarnings([]);
      setPending([]);
    }
  }

  return (
    <ScreenShell title={t('importTitle')} subtitle={t('importSubtitle')} onBack={goHome}>
      <p className={styles.note}>{t('importNote', { example: '{ "Fruit": ["Apple", "Orange"] }' })}</p>
      <label className={styles.file}>
        {t('chooseFile')}
        <input type="file" accept="application/json,.json" onChange={(event) => { void onFile(event.target.files?.[0]); event.target.value = ''; }} />
      </label>
      <label className={styles.field}>
        {t('pasteJson')}
        <textarea value={paste} rows={8} onChange={(event) => setPaste(event.target.value)} />
      </label>
      <button type="button" className={styles.secondary} onClick={() => review(paste)} disabled={!paste.trim()}>
        {t('checkPaste')}
      </button>
      {errors.map((error) => <p key={error} className={styles.warn}>{label(error)}</p>)}
      {warnings.map((warning) => <p key={warning} className={styles.note}>{label(warning)}</p>)}
      {pending.map((set) => (
        <article key={set.id} className={styles.card}>
          <h2>{set.name}</h2>
          <p>{t('groupsReady', { count: set.groups.length })}</p>
        </article>
      ))}
      {pending.length ? <button type="button" className={styles.primary} onClick={() => addImportedSets(pending)}>{t('addSets', { count: pending.length })}</button> : null}
      <p className={styles.note}>{t('sampleLink')} <a href="/word-set.example.json">word-set.example.json</a></p>
    </ScreenShell>
  );
}

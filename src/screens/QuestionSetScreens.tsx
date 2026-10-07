import { useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { BUILTIN_QUESTION_SET, parseQuestionSet } from '../question/sets';
import { useGame } from '../state/GameProvider';
import styles from './WordSetScreen.module.css';

export function QuestionSetsScreen() {
  const { questionSets, questionSetId, goHome, setQuestionSetId, createQuestionSet, deleteQuestionSet, duplicateQuestionSet, openQuestionEditor, importQuestionSet } = useGame();
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [paste, setPaste] = useState('');
  const [ready, setReady] = useState(false);
  const sets = [BUILTIN_QUESTION_SET, ...questionSets];
  return (
    <ScreenShell title={t('questionSets')} subtitle={t('questionSetsSubtitle')} onBack={goHome}>
      <div className={styles.row}>
        <button type="button" className={styles.primary} onClick={createQuestionSet}>{t('newSet')}</button>
        <label className={styles.file}>{t('import')}<input type="file" accept="application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setError((await importQuestionSet(await file.text())) ? t('invalidJson') : ''); }} /></label>
      </div>
      {error ? <p className={styles.warn}>{error}</p> : null}
      <label className={styles.field}>
        {t('pasteJson')}
        <textarea value={paste} rows={8} onChange={(event) => { setPaste(event.target.value); setReady(false); }} />
      </label>
      <button type="button" className={styles.secondary} disabled={!paste.trim()} onClick={() => { const parsed = parseQuestionSet(paste); setError(parsed.ok ? '' : t('invalidJson')); setReady(parsed.ok); }}>{t('checkPaste')}</button>
      {ready ? <button type="button" className={styles.primary} onClick={() => { const message = importQuestionSet(paste); setError(message ? t('invalidJson') : ''); if (!message) { setPaste(''); setReady(false); } }}>{t('addSets', { count: 1 })}</button> : null}
      {sets.map((set) => (
        <article key={set.id} className={styles.card}>
          <h2>{set.name}</h2>
          <small>{t('totalGroups', { ready: set.groups.length, total: set.groups.length })}{set.builtin ? ` · ${t('builtin')}` : ''}{set.id === questionSetId ? ` · ${t('usedForGames')}` : ''}</small>
          <div className={styles.actions}>
            <button type="button" onClick={() => setQuestionSetId(set.id)}>{t('use')}</button>
            {set.builtin ? <button type="button" onClick={() => duplicateQuestionSet(set.id)}>{t('duplicate')}</button> : <button type="button" onClick={() => openQuestionEditor(set.id)}>{t('edit')}</button>}
            {set.builtin ? null : <button type="button" onClick={() => duplicateQuestionSet(set.id)}>{t('duplicate')}</button>}
            {set.builtin ? null : <button type="button" className={styles.danger} onClick={() => { if (window.confirm(t('delete'))) deleteQuestionSet(set.id); }}>{t('delete')}</button>}
            <button type="button" onClick={() => download(set)}>{t('export')}</button>
          </div>
        </article>
      ))}
    </ScreenShell>
  );
}

export function QuestionSetEditorScreen() {
  const { editingQuestionSet, updateQuestionSet, goHome } = useGame();
  const { t } = useI18n();
  if (!editingQuestionSet) return null;
  return (
    <ScreenShell title={t('questionSets')} onBack={goHome}>
      <label className={styles.field}>{t('setName')}<input value={editingQuestionSet.name} maxLength={40} onChange={(event) => updateQuestionSet({ ...editingQuestionSet, name: event.target.value })} /></label>
      {editingQuestionSet.groups.map((group) => (
        <article key={group.id} className={styles.card}>
          <label className={styles.field}>{t('civilianQuestionField')}<textarea value={group.civilianQuestion} onChange={(event) => updateQuestionSet({ ...editingQuestionSet, groups: editingQuestionSet.groups.map((item) => item.id === group.id ? { ...item, civilianQuestion: event.target.value } : item) })} /></label>
          <label className={styles.field}>{t('undercoverQuestionField')}<textarea value={group.undercoverQuestion} onChange={(event) => updateQuestionSet({ ...editingQuestionSet, groups: editingQuestionSet.groups.map((item) => item.id === group.id ? { ...item, undercoverQuestion: event.target.value } : item) })} /></label>
          <button type="button" className={styles.danger} onClick={() => updateQuestionSet({ ...editingQuestionSet, groups: editingQuestionSet.groups.filter((item) => item.id !== group.id) })}>{t('deleteGroup')}</button>
        </article>
      ))}
      <button type="button" className={styles.primary} onClick={() => updateQuestionSet({ ...editingQuestionSet, groups: [...editingQuestionSet.groups, { id: crypto.randomUUID(), civilianQuestion: '', undercoverQuestion: '' }] })}>{t('addGroup')}</button>
    </ScreenShell>
  );
}

function download(set: { name: string; groups: { id: string; civilianQuestion: string; undercoverQuestion: string }[] }) {
  const blob = new Blob([JSON.stringify({ name: set.name, groups: set.groups }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'question-set.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

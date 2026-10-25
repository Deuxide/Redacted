import { useState } from 'react';
import { Button, Card, Field } from '../components/Primitives';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { BUILTIN_QUESTION_SET, parseQuestionSet } from '../question/sets';
import { useGame } from '../state/GameProvider';
import styles from './WordSetScreen.module.css';

export function QuestionSetsScreen() {
  const { questionSets, questionSetId, goHome, setQuestionSetId, createQuestionSet, deleteQuestionSet, duplicateQuestionSet, openQuestionEditor, openQuestionImport } = useGame();
  const { t } = useI18n();
  const sets = [BUILTIN_QUESTION_SET, ...questionSets];
  return (
    <ScreenShell title={t('questionSets')} subtitle={t('questionSetsSubtitle')} onBack={goHome}
      footer={<Button wide onClick={createQuestionSet}>{t('newSet')}</Button>}>
      <div className={styles.row}>
        <Button variant="secondary" onClick={openQuestionImport}>{t('import')}</Button>
      </div>
      {sets.map((set) => (
        <Card key={set.id} className={styles.card}>
          <h2>{set.name}</h2>
          <small>{t('totalGroups', { ready: set.groups.length, total: set.groups.length })}{set.builtin ? ` · ${t('builtin')}` : ''}{set.id === questionSetId ? ` · ${t('usedForGames')}` : ''}</small>
          <div className={styles.actions}>
            <Button variant="secondary" aria-pressed={set.id === questionSetId} onClick={() => setQuestionSetId(set.id)}>{t('use')}</Button>
            {set.builtin ? <Button variant="secondary" onClick={() => duplicateQuestionSet(set.id)}>{t('duplicate')}</Button> : <Button variant="secondary" onClick={() => openQuestionEditor(set.id)}>{t('edit')}</Button>}
            {set.builtin ? null : <Button variant="secondary" onClick={() => duplicateQuestionSet(set.id)}>{t('duplicate')}</Button>}
            {set.builtin ? null : <Button variant="danger" onClick={() => { if (window.confirm(t('delete'))) deleteQuestionSet(set.id); }}>{t('delete')}</Button>}
            <Button variant="secondary" onClick={() => download(set)}>{t('export')}</Button>
          </div>
        </Card>
      ))}
    </ScreenShell>
  );
}

export function QuestionImportScreen() {
  const { importQuestionSet, openQuestionSets } = useGame();
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [paste, setPaste] = useState('');
  const [ready, setReady] = useState(false);
  return (
    <ScreenShell title={t('importTitle')} subtitle={t('importSubtitle')} onBack={openQuestionSets}
      footer={ready ? <Button wide onClick={() => { const message = importQuestionSet(paste); if (message) setError(t('invalidJson')); else openQuestionSets(); }}>{t('addSets', { count: 1 })}</Button> : undefined}>
      <label className={styles.file}>
        {t('chooseFile')}
        <input type="file" accept="application/json,.json" onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const raw = await file.text(); const parsed = parseQuestionSet(raw); setPaste(raw); setError(parsed.ok ? '' : t('invalidJson')); setReady(parsed.ok); }} />
      </label>
      <Field className={styles.field}>
        {t('pasteJson')}
        <textarea value={paste} rows={8} onChange={(event) => { setPaste(event.target.value); setReady(false); }} />
      </Field>
      <Button variant="secondary" wide disabled={!paste.trim()} onClick={() => { const parsed = parseQuestionSet(paste); setError(parsed.ok ? '' : t('invalidJson')); setReady(parsed.ok); }}>{t('checkPaste')}</Button>
      {error ? <p className={styles.warn} role="alert" aria-live="polite">{error}</p> : null}
    </ScreenShell>
  );
}

export function QuestionSetEditorScreen() {
  const { editingQuestionSet, updateQuestionSet, goHome } = useGame();
  const { t } = useI18n();
  if (!editingQuestionSet) return null;
  return (
    <ScreenShell title={t('questionSets')} onBack={goHome}
      footer={<Button wide onClick={() => updateQuestionSet({ ...editingQuestionSet, groups: [...editingQuestionSet.groups, { id: crypto.randomUUID(), civilianQuestion: '', undercoverQuestion: '' }] })}>{t('addGroup')}</Button>}>
      <Field className={styles.field}>{t('setName')}<input value={editingQuestionSet.name} maxLength={40} onChange={(event) => updateQuestionSet({ ...editingQuestionSet, name: event.target.value })} /></Field>
      {editingQuestionSet.groups.map((group) => (
        <Card key={group.id} className={styles.card}>
          <Field className={styles.field}>{t('civilianQuestionField')}<textarea value={group.civilianQuestion} onChange={(event) => updateQuestionSet({ ...editingQuestionSet, groups: editingQuestionSet.groups.map((item) => item.id === group.id ? { ...item, civilianQuestion: event.target.value } : item) })} /></Field>
          <Field className={styles.field}>{t('undercoverQuestionField')}<textarea value={group.undercoverQuestion} onChange={(event) => updateQuestionSet({ ...editingQuestionSet, groups: editingQuestionSet.groups.map((item) => item.id === group.id ? { ...item, undercoverQuestion: event.target.value } : item) })} /></Field>
          <Button variant="danger" onClick={() => updateQuestionSet({ ...editingQuestionSet, groups: editingQuestionSet.groups.filter((item) => item.id !== group.id) })}>{t('deleteGroup')}</Button>
        </Card>
      ))}
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

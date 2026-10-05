import { useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import type { WordSet } from '../types/game';
import { parseWordSetJson } from '../wordSets/validate';
import styles from './WordSetScreen.module.css';

export function ImportScreen() {
  const { goHome, addImportedSets } = useGame();
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, setPending] = useState<WordSet[]>([]);
  const [paste, setPaste] = useState('');

  function review(raw: string) {
    const result = parseWordSetJson(raw);
    if (!result.ok) {
      setErrors(result.errors);
      setWarnings([]);
      setPending([]);
      return;
    }
    setErrors([]);
    setWarnings(result.warnings);
    setPending(result.sets);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 500_000) {
      setErrors(['That file is too large. Keep word sets under 500 KB.']);
      setWarnings([]);
      setPending([]);
      return;
    }
    try {
      review(await file.text());
    } catch {
      setErrors(['Could not read that file.']);
      setWarnings([]);
      setPending([]);
    }
  }

  return (
    <ScreenShell title="Import JSON" subtitle="Adds a word set on this device. Nothing is uploaded." onBack={goHome}>
      <p className={styles.note}>Use a word set file, or a simple map such as {`{ "Fruit": ["Apple", "Orange", "Banana"] }`}.</p>
      <label className={styles.file}>
        Choose JSON file
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void onFile(file);
            event.target.value = '';
          }}
        />
      </label>
      <label className={styles.field}>
        Or paste JSON
        <textarea value={paste} rows={8} onChange={(event) => setPaste(event.target.value)} />
      </label>
      <button type="button" className={styles.secondary} onClick={() => review(paste)} disabled={!paste.trim()}>
        Check pasted JSON
      </button>
      {errors.map((error) => (
        <p key={error} className={styles.warn}>
          {error}
        </p>
      ))}
      {warnings.map((warning) => (
        <p key={warning} className={styles.note}>
          {warning}
        </p>
      ))}
      {pending.map((set) => (
        <article key={set.id} className={styles.card}>
          <h2>{set.name}</h2>
          <p>{set.groups.length} groups ready to add</p>
        </article>
      ))}
      {pending.length ? (
        <button type="button" className={styles.primary} onClick={() => addImportedSets(pending)}>
          Add {pending.length} set{pending.length === 1 ? '' : 's'}
        </button>
      ) : null}
      <p className={styles.note}>
        A sample file is included at <a href="/word-set.example.json">word-set.example.json</a>.
      </p>
      <pre className={styles.sample}>{`{
  "version": 1,
  "name": "Fruits",
  "groups": [
    { "id": "fruit-001", "words": ["Apple", "Orange", "Banana"] }
  ]
}`}</pre>
    </ScreenShell>
  );
}

import styles from './Stepper.module.css';
import { useI18n } from '../i18n/LanguageProvider';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  hint?: string;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, min, max, hint, onChange }: StepperProps) {
  const { t } = useI18n();
  return (
    <div className={styles.stepper}>
      <div>
        <span className={styles.label}>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t('decreaseValue', { label })}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12" /></svg>
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t('increaseValue', { label })}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
        </button>
      </div>
    </div>
  );
}

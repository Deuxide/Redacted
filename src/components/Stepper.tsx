import styles from './Stepper.module.css';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  hint?: string;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, min, max, hint, onChange }: StepperProps) {
  return (
    <div className={styles.stepper}>
      <div>
        <span className={styles.label}>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
          −
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

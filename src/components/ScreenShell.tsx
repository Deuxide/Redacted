import type { ReactNode } from 'react';
import styles from './ScreenShell.module.css';

interface ScreenShellProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function ScreenShell({ title, subtitle, onBack, children, footer }: ScreenShellProps) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        {onBack ? (
          <button type="button" className={styles.back} onClick={onBack}>
            Back
          </button>
        ) : (
          <span className={styles.brand}>Undercover</span>
        )}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <section className={styles.body}>{children}</section>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </main>
  );
}

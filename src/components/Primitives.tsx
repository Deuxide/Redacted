import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { useI18n } from '../i18n/LanguageProvider';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  wide?: boolean;
}

export function Button({ variant = 'primary', wide = false, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`ui-button ui-button--${variant}${wide ? ' ui-button--wide' : ''}${className ? ` ${className}` : ''}`}
    />
  );
}

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  children: ReactNode;
}

export function Card({ as: Element = 'article', className = '', ...props }: CardProps) {
  return <Element {...props} className={`ui-card${className ? ` ${className}` : ''}`} />;
}

export function Field({ className = '', ...props }: HTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`ui-field${className ? ` ${className}` : ''}`} />;
}

interface ChoiceRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function ChoiceRow({ className = '', type = 'button', ...props }: ChoiceRowProps) {
  return <button {...props} type={type} className={`ui-choice${className ? ` ${className}` : ''}`} />;
}

export function ProgressIndicator({ value, total, label }: { value: number; total: number; label: string }) {
  const { t } = useI18n();
  const clamped = Math.max(0, Math.min(value, total));

  return (
    <div className="ui-progress" role="img" aria-label={t('progressLabel', { label, n: clamped, total })}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} data-complete={index < clamped} />
      ))}
    </div>
  );
}

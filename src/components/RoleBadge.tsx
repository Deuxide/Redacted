import { useI18n } from '../i18n/LanguageProvider';
import type { Role } from '../types/game';
import styles from './RoleBadge.module.css';

export function RoleBadge({ role }: { role: Role }) {
  const { t } = useI18n();
  const label = role === 'undercover' ? t('undercover') : role === 'doesntKnow' ? t('doesntKnow') : t('civilian');
  const mark = role === 'undercover' ? '◆' : role === 'doesntKnow' ? '?' : '●';
  return (
    <span className={`${styles.badge} ${styles[role]}`}>
      <span aria-hidden="true">{mark}</span>
      {label}
    </span>
  );
}

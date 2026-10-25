import { useI18n } from '../i18n/LanguageProvider';
import type { Role } from '../types/game';
import styles from './RoleBadge.module.css';

export function RoleBadge({ role }: { role: Role }) {
  const { t } = useI18n();
  const label = role === 'undercover' ? t('undercover') : role === 'doesntKnow' ? t('doesntKnow') : t('civilian');
  return (
    <span className={`${styles.badge} ${styles[role]}`}>
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true">
        {role === 'undercover' ? <path d="m10 2.5 7.5 7.5-7.5 7.5L2.5 10 10 2.5Z" /> : null}
        {role === 'civilian' ? <circle cx="10" cy="10" r="6.5" /> : null}
        {role === 'doesntKnow' ? <><circle cx="10" cy="10" r="7.5" /><path d="M7.8 7.5a2.3 2.3 0 1 1 3.8 1.7c-1 .9-1.6 1.3-1.6 2.8m0 2.1v.1" /></> : null}
      </svg>
      {label}
    </span>
  );
}

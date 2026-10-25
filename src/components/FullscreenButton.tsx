import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageProvider';
import styles from './FullscreenButton.module.css';

export function FullscreenButton() {
  const { t } = useI18n();
  const [active, setActive] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setActive(Boolean(document.fullscreenElement));
    }
  }

  return (
    <button type="button" className={styles.button} aria-pressed={active} aria-label={active ? t('exitFullscreen') : t('fullscreen')} onClick={toggle}>
      {active ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8 4 4m0 0v4m0-4h4m8 4 4-4m0 0v4m0-4h-4M8 16l-4 4m0 0v-4m0 4h4m8-4 4 4m0 0v-4m0 4h-4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m13-5v4a1 1 0 0 1-1 1h-4" />
        </svg>
      )}
    </button>
  );
}

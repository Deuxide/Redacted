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
      {active ? '✕' : '⛶'}
    </button>
  );
}

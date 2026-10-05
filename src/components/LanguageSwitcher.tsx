import { useI18n } from '../i18n/LanguageProvider';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className={styles.switcher}>
      {t('language')}
      <select value={locale} onChange={(event) => setLocale(event.target.value === 'id' ? 'id' : 'en')}>
        <option value="en">English</option>
        <option value="id">Bahasa Indonesia</option>
      </select>
    </label>
  );
}

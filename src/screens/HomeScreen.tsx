import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ScreenShell } from '../components/ScreenShell';
import { ThemePicker } from '../components/ThemePicker';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const { openSetup, openQuestionSetup, openSettings, openWordSets, openImport, openExport } = useGame();
  const { t } = useI18n();

  return (
    <ScreenShell title={t('homeTitle')} subtitle={t('homeSubtitle')}>
      <p className={styles.note}>{t('homeNote')}</p>
      <section className={styles.section}>
        <h2>{t('gameModes')}</h2>
        <button type="button" className={styles.primary} onClick={openSetup}>{t('newGame')}</button>
        <p className={styles.note}>{t('wordModeHint')}</p>
        <button type="button" className={styles.secondary} onClick={openQuestionSetup}>{t('questionMode')}</button>
        <p className={styles.note}>{t('questionModeHint')}</p>
      </section>
      <button type="button" className={styles.secondary} onClick={openWordSets}>
        {t('wordSets')}
      </button>
      <button type="button" className={styles.secondary} onClick={openImport}>
        {t('importJson')}
      </button>
      <button type="button" className={styles.secondary} onClick={openExport}>
        {t('exportJson')}
      </button>
      <button type="button" className={styles.secondary} onClick={openSettings}>
        {t('settings')}
      </button>
      <LanguageSwitcher />
    </ScreenShell>
  );
}

export function SettingsScreen() {
  const { goHome } = useGame();
  const { t } = useI18n();
  return (
    <ScreenShell title={t('settings')} subtitle={t('settingsHint')} onBack={goHome}>
      <section className={styles.section}>
        <h2>{t('languageSection')}</h2>
        <LanguageSwitcher />
      </section>
      <ThemePicker />
    </ScreenShell>
  );
}

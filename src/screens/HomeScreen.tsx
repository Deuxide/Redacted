import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Button, Card } from '../components/Primitives';
import { ScreenShell } from '../components/ScreenShell';
import { ThemePicker } from '../components/ThemePicker';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const { openSetup, openQuestionSetup, openSettings, openWordSets, openQuestionSets } = useGame();
  const { t } = useI18n();

  return (
    <ScreenShell
      title={t('homeTitle')}
      subtitle={t('homeSubtitle')}
      footer={<Button wide onClick={openSetup}>{t('newGame')}</Button>}
    >
      <p className={styles.note}>{t('homeNote')}</p>
      <section className={styles.section}>
        <h2>{t('gameModes')}</h2>
        <Card className={styles.modeCard}>
          <span className={styles.modeMark} aria-hidden="true">01</span>
          <div>
            <h3>{t('newGame')}</h3>
            <p>{t('wordModeHint')}</p>
          </div>
        </Card>
        <Card className={styles.modeCard}>
          <span className={styles.modeMark} aria-hidden="true">02</span>
          <div>
            <h3>{t('questionMode')}</h3>
            <p>{t('questionModeHint')}</p>
          </div>
          <Button variant="secondary" onClick={openQuestionSetup}>{t('questionMode')}</Button>
        </Card>
      </section>
      <nav className={styles.links} aria-label={t('home')}>
        <Button variant="quiet" onClick={openWordSets}>{t('wordSets')}</Button>
        <Button variant="quiet" onClick={openQuestionSets}>{t('questionSets')}</Button>
        <Button variant="quiet" onClick={openSettings}>
        {t('settings')}
        </Button>
      </nav>
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

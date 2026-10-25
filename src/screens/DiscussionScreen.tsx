import { Scoreboard } from '../components/Scoreboard';
import { Button } from '../components/Primitives';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './RevealScreen.module.css';

export function DiscussionScreen() {
  const { game, session, startVoting, leaveGame } = useGame();
  const { t } = useI18n();

  return (
    <ScreenShell title={t('discussionTitle')} subtitle={t('discussionSubtitle')} onBack={leaveGame}
      footer={<Button wide onClick={startVoting} disabled={!game}>{t('startVoting')}</Button>}>
      <p className={styles.copy}>{t('discussionBody')}</p>
      <p className={styles.meta}>{t('discussionAway')}</p>
      {game ? <p className={styles.meta}>{t('playerCountNote', { count: game.players.length })}</p> : null}
      {session ? <Scoreboard players={session.players} /> : null}
    </ScreenShell>
  );
}

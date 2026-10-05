import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './RevealScreen.module.css';

export function DiscussionScreen() {
  const { game, session, startVoting, leaveGame } = useGame();
  const { t } = useI18n();

  return (
    <ScreenShell title={t('discussionTitle')} subtitle={t('discussionSubtitle')} onBack={leaveGame}>
      <p className={styles.copy}>{t('discussionBody')}</p>
      <p className={styles.meta}>{t('discussionAway')}</p>
      {game ? <p className={styles.meta}>{t('playerCountNote', { count: game.players.length })}</p> : null}
      <section>
        <h2>{t('sessionScore')}</h2>
        {[...(session?.players ?? [])].sort((a, b) => b.points - a.points).map((player, index) => (
          <p key={player.id}>{index + 1}. {player.name} {t('pointsLabel', { count: player.points })}</p>
        ))}
      </section>
      <button type="button" className={styles.reveal} onClick={startVoting} disabled={!game}>
        {t('startVoting')}
      </button>
    </ScreenShell>
  );
}

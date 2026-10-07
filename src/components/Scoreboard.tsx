import type { SessionPlayer } from '../game/sessionPoints';
import { useI18n } from '../i18n/LanguageProvider';
import styles from './Scoreboard.module.css';

export function Scoreboard({ players, gains }: { players: SessionPlayer[]; gains?: Record<string, number> }) {
  const { t } = useI18n();
  const ranked = players
    .map((player, index) => ({ player, index }))
    .sort((a, b) => b.player.points - a.player.points || a.index - b.index);

  return (
    <section className={styles.board} aria-label={t('sessionScore')}>
      <h2>{t('sessionScore')}</h2>
      <ol>
        {ranked.map(({ player }, rank) => {
          const place = rank + 1;
          const gain = gains?.[player.id] ?? 0;
          return (
            <li key={player.id} className={place === 1 ? styles.first : place === 2 ? styles.second : place === 3 ? styles.third : styles.row}>
              <span className={styles.rank}>{place}</span>
              <strong>{player.name}</strong>
              <span className={styles.points}>
                {gain > 0 ? <em className={styles.gain}>{t('plusPoints', { count: gain })}</em> : null}
                {t('pointsLabel', { count: player.points })}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

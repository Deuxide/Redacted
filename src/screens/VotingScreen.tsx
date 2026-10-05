import { useEffect, useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import type { ActiveGame } from '../types/game';
import styles from './VotingScreen.module.css';

const HANDOFF_MS = 550;

export function VotingScreen() {
  const { game, castVote, leaveGame } = useGame();
  const { t } = useI18n();

  if (!game || game.phase !== 'voting') {
    return (
      <ScreenShell title={t('votingTitle')} subtitle={t('votingClosed')} onBack={leaveGame}>
        <p>{t('votesClosedNote')}</p>
      </ScreenShell>
    );
  }

  return <VoteTurn key={`${game.id}-${game.voteIndex}`} game={game} onLeave={leaveGame} onVote={castVote} />;
}

function VoteTurn({
  game,
  onLeave,
  onVote,
}: {
  game: ActiveGame;
  onLeave: () => void;
  onVote: (voterId: string, suspectIds: string[]) => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<'pass' | 'choose' | 'confirm' | 'clearing'>('pass');
  const [selected, setSelected] = useState<string[]>([]);
  const voter = game.players[game.voteIndex];
  const needed = game.suspectsPerVote;
  const locked = Boolean(game.votes[voter.id]);

  useEffect(() => {
    if (step !== 'clearing' || locked) return;
    const timer = window.setTimeout(() => onVote(voter.id, selected), HANDOFF_MS);
    return () => window.clearTimeout(timer);
  }, [locked, onVote, selected, step, voter.id]);

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (needed === 1) return [id];
      if (current.length >= needed) return current;
      return [...current, id];
    });
  }

  if (step === 'clearing') {
    return (
      <ScreenShell title={t('lookAway')}>
        <p className={styles.handoff}>{t('passing')}</p>
        <p className={styles.copy}>{t('voteHidden')}</p>
      </ScreenShell>
    );
  }

  const names = game.players.filter((player) => selected.includes(player.id)).map((player) => player.name);

  return (
    <ScreenShell title={t('voterStep', { n: game.voteIndex + 1 })} subtitle={t('passPhone', { name: voter.name })} onBack={step === 'pass' ? onLeave : undefined}>
      <p className={styles.player}>{voter.name}</p>
      <p className={styles.step}>{t('voteProgress', { n: game.voteIndex + 1, total: game.players.length })}</p>
      {step === 'pass' ? (
        <>
          <p className={styles.copy}>{t('votesHidden')}</p>
          <button type="button" className={styles.primary} onClick={() => setStep('choose')}>
            {t('imPlayer', { name: voter.name })}
          </button>
        </>
      ) : null}
      {step === 'choose' ? (
        <>
          <h2 className={styles.question}>{t('whoUndercover')}</h2>
          <p className={styles.copy}>{needed === 1 ? t('pickOne') : t('pickMany', { count: needed })}</p>
          <div className={styles.list}>
            {game.players
              .filter((player) => player.id !== voter.id)
              .map((player) => {
                const pressed = selected.includes(player.id);
                return (
                  <button key={player.id} type="button" className={styles.choice} aria-pressed={pressed} onClick={() => toggle(player.id)}>
                    <span className={styles.mark}>{pressed ? '●' : '○'}</span>
                    {player.name}
                  </button>
                );
              })}
          </div>
          <button type="button" className={styles.primary} disabled={selected.length !== needed} onClick={() => setStep('confirm')}>
            {t('reviewVote')}
          </button>
        </>
      ) : null}
      {step === 'confirm' ? (
        <>
          <p className={styles.question}>{t('lockVote')}</p>
          <p className={styles.copy}>{names.join(', ')}</p>
          <button type="button" className={styles.primary} onClick={() => setStep('clearing')}>
            {t('confirmHide')}
          </button>
          <button type="button" className={styles.secondary} onClick={() => setStep('choose')}>
            {t('changeVote')}
          </button>
        </>
      ) : null}
    </ScreenShell>
  );
}

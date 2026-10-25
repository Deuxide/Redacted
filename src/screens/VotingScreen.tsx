import { useEffect, useState } from 'react';
import { Button, ChoiceRow, ProgressIndicator } from '../components/Primitives';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { SKIP_VOTE_ID, activePlayers, playerInOrder } from '../game/results';
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
  const voter = playerInOrder(game.players, game.playerOrder, game.voteIndex);
  const active = activePlayers(game.players);
  const needed = Math.min(game.suspectsPerVote, Math.max(1, active.length - 1));

  useEffect(() => {
    if (step !== 'clearing' || !voter || game.votes[voter.id]) return;
    const timer = window.setTimeout(() => onVote(voter.id, selected), HANDOFF_MS);
    return () => window.clearTimeout(timer);
  }, [game.votes, onVote, selected, step, voter]);

  if (!voter) return null;
  const stageIndex = step === 'pass' ? 1 : step === 'choose' ? 2 : 3;

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

  const names = selected.map((id) => (id === SKIP_VOTE_ID ? t('skipVote') : game.players.find((player) => player.id === id)?.name ?? id));

  return (
    <ScreenShell
      title={t('voterStep', { n: game.voteIndex + 1 })}
      subtitle={t('passPhone', { name: voter.name })}
      onBack={step === 'pass' ? onLeave : undefined}
      footer={
        step === 'pass' ? <Button wide onClick={() => setStep('choose')}>{t('imPlayer', { name: voter.name })}</Button>
          : step === 'choose' ? <Button wide disabled={selected.length !== needed} onClick={() => setStep('confirm')}>{t('reviewVote')}</Button>
            : step === 'confirm' ? <Button wide onClick={() => setStep('clearing')}>{t('confirmHide')}</Button>
              : null
      }
    >
      <ProgressIndicator value={stageIndex} total={3} label={t('votingSteps')} />
      <ProgressIndicator
        value={active.filter((player) => game.votes[player.id] || player.id === voter.id).length}
        total={active.length}
        label={t('votingTitle')}
      />
      <p className={styles.turnEyebrow}>{t('yourTurn')}</p>
      <p className={styles.player}>{voter.name}</p>
      <p className={styles.step}>{t('voteProgress', { n: active.filter((player) => game.votes[player.id] || player.id === voter.id).length, total: active.length })}</p>
      {step === 'pass' ? (
        <p className={styles.copy}>{t('votesHidden')}</p>
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
                  <ChoiceRow key={player.id} aria-pressed={pressed} disabled={player.eliminated} onClick={() => toggle(player.id)}>
                    <span className={styles.mark} aria-hidden="true">
                      <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" />{pressed ? <path d="m6.5 10 2.2 2.2 4.8-4.8" /> : null}</svg>
                    </span>
                    <span className={styles.choiceContent}>
                      <strong>{player.name}</strong>
                      {player.eliminated ? <small>{t('cannotVote')}</small> : null}
                    </span>
                  </ChoiceRow>
                );
              })}
            <ChoiceRow className={styles.skip} aria-pressed={selected.includes(SKIP_VOTE_ID)} onClick={() => toggle(SKIP_VOTE_ID)}>
              <span className={styles.mark} aria-hidden="true">
                <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" />{selected.includes(SKIP_VOTE_ID) ? <path d="m6.5 10 2.2 2.2 4.8-4.8" /> : null}</svg>
              </span>
              {t('skipVote')}
            </ChoiceRow>
          </div>
        </>
      ) : null}
      {step === 'confirm' ? (
        <>
          <p className={styles.question}>{t('lockVote')}</p>
          <p className={styles.selectedNames}>{names.join(', ')}</p>
          <Button variant="secondary" wide onClick={() => setStep('choose')}>
            {t('changeVote')}
          </Button>
        </>
      ) : null}
    </ScreenShell>
  );
}

import { useEffect, useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import type { ActiveGame } from '../types/game';
import styles from './VotingScreen.module.css';

const HANDOFF_MS = 550;

export function VotingScreen() {
  const { game, castVote, leaveGame } = useGame();

  if (!game || game.phase !== 'voting') {
    return (
      <ScreenShell title="Voting" subtitle="Start voting after the discussion." onBack={leaveGame}>
        <p>Votes are not open yet.</p>
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
      <ScreenShell title="Look away">
        <p className={styles.handoff}>Passing the phone.</p>
        <p className={styles.copy}>The vote is hidden.</p>
      </ScreenShell>
    );
  }

  const names = game.players.filter((player) => selected.includes(player.id)).map((player) => player.name);

  return (
    <ScreenShell
      title={`Voter ${game.voteIndex + 1}`}
      subtitle={`Pass the phone to ${voter.name}`}
      onBack={step === 'pass' ? onLeave : undefined}
    >
      <p className={styles.player}>{voter.name}</p>
      <p className={styles.step}>
        Vote {game.voteIndex + 1} of {game.players.length}
      </p>
      {step === 'pass' ? (
        <>
          <p className={styles.copy}>Votes stay hidden until everyone has voted.</p>
          <button type="button" className={styles.primary} onClick={() => setStep('choose')}>
            I'm {voter.name}
          </button>
        </>
      ) : null}
      {step === 'choose' ? (
        <>
          <h2 className={styles.question}>Who do you think is Undercover?</h2>
          <p className={styles.copy}>
            {needed === 1 ? 'Choose one player. You cannot vote for yourself.' : `Choose ${needed} players. You cannot vote for yourself.`}
          </p>
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
            Review vote
          </button>
        </>
      ) : null}
      {step === 'confirm' ? (
        <>
          <p className={styles.question}>Lock this vote?</p>
          <p className={styles.copy}>{names.join(', ')}</p>
          <button type="button" className={styles.primary} onClick={() => setStep('clearing')}>
            Confirm and hide vote
          </button>
          <button type="button" className={styles.secondary} onClick={() => setStep('choose')}>
            Change vote
          </button>
        </>
      ) : null}
    </ScreenShell>
  );
}

import { useEffect, useState } from 'react';
import { ScreenShell } from '../components/ScreenShell';
import { useGame } from '../state/GameProvider';
import type { ActiveGame } from '../types/game';
import styles from './RevealScreen.module.css';

const HANDOFF_MS = 550;

export function RevealScreen() {
  const { game, leaveGame, markCurrentSeenAndAdvance } = useGame();

  if (!game || game.phase !== 'reveal') {
    return (
      <ScreenShell title="No reveal in progress" subtitle="Start a game from the home screen." onBack={leaveGame}>
        <p className={styles.copy}>There is no private word to show.</p>
      </ScreenShell>
    );
  }

  return (
    <PlayerTurn
      key={`${game.id}-${game.revealIndex}`}
      game={game}
      onLeave={leaveGame}
      onPass={markCurrentSeenAndAdvance}
    />
  );
}

function PlayerTurn({ game, onLeave, onPass }: { game: ActiveGame; onLeave: () => void; onPass: () => void }) {
  const [step, setStep] = useState<'pass' | 'privacy' | 'secret' | 'clearing'>('pass');
  const player = game.players[game.revealIndex];
  const stepNumber = game.revealIndex + 1;

  useEffect(() => {
    if (step !== 'clearing') return;
    const timer = window.setTimeout(onPass, HANDOFF_MS);
    return () => window.clearTimeout(timer);
  }, [onPass, step]);

  if (step === 'clearing') {
    return (
      <ScreenShell title="Look away">
        <p className={styles.handoff}>Passing the phone.</p>
        <p className={styles.copy}>The word is hidden.</p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={`Player ${stepNumber}`}
      subtitle={`Pass the phone to ${player.name}`}
      onBack={step === 'pass' ? onLeave : undefined}
    >
      <p className={styles.player}>{player.name}</p>
      <p className={styles.step}>
        Player {stepNumber} of {game.players.length}
      </p>
      {step === 'pass' ? (
        <button type="button" className={styles.reveal} onClick={() => setStep('privacy')}>
          I'm {player.name}
        </button>
      ) : null}
      {step === 'privacy' ? (
        <>
          <p className={styles.warning}>Make sure nobody else can see the screen.</p>
          <button type="button" className={styles.reveal} onClick={() => setStep('secret')}>
            Reveal My Word
          </button>
        </>
      ) : null}
      {step === 'secret' ? <SecretCard role={player.role} word={player.word} onHide={() => setStep('clearing')} /> : null}
    </ScreenShell>
  );
}

function SecretCard({ role, word, onHide }: { role: 'civilian' | 'undercover'; word: string; onHide: () => void }) {
  return (
    <>
      <div className={styles.secret}>
        <span>Role</span>
        <strong className={role === 'undercover' ? styles.undercover : styles.civilian}>
          {role === 'undercover' ? 'Undercover' : 'Civilian'}
        </strong>
        <span>Your word</span>
        <strong className={styles.word}>{word}</strong>
      </div>
      <button type="button" className={styles.pass} onClick={onHide}>
        Hide & Pass Phone
      </button>
    </>
  );
}

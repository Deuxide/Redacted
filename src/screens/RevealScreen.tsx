import { useEffect, useState } from 'react';
import { RoleBadge } from '../components/RoleBadge';
import { ScreenShell } from '../components/ScreenShell';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import type { ActiveGame, Role } from '../types/game';
import styles from './RevealScreen.module.css';

const HANDOFF_MS = 550;

export function RevealScreen() {
  const { game, leaveGame, markCurrentSeenAndAdvance } = useGame();
  const { t } = useI18n();

  if (!game || game.phase !== 'reveal') {
    return (
      <ScreenShell title={t('noReveal')} subtitle={t('noRevealNote')} onBack={leaveGame}>
        <p className={styles.copy}>{t('noRevealNote')}</p>
      </ScreenShell>
    );
  }

  return (
    <PlayerTurn key={`${game.id}-${game.revealIndex}`} game={game} onLeave={leaveGame} onPass={markCurrentSeenAndAdvance} />
  );
}

function PlayerTurn({ game, onLeave, onPass }: { game: ActiveGame; onLeave: () => void; onPass: () => void }) {
  const { t } = useI18n();
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
      <ScreenShell title={t('lookAway')}>
        <p className={styles.handoff}>{t('passing')}</p>
        <p className={styles.copy}>{game.showRoleDuringReveal ? t('wordHidden') : t('infoHidden')}</p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={`${t('playerLabel', { n: stepNumber })}`} subtitle={t('passPhone', { name: player.name })} onBack={step === 'pass' ? onLeave : undefined}>
      <p className={styles.player}>{player.name}</p>
      <p className={styles.step}>{t('playerStep', { n: stepNumber, total: game.players.length })}</p>
      {step === 'pass' ? (
        <button type="button" className={styles.reveal} onClick={() => setStep('privacy')}>
          {t('imPlayer', { name: player.name })}
        </button>
      ) : null}
      {step === 'privacy' ? (
        <>
          <p className={styles.warning}>{t('privacy')}</p>
          <button type="button" className={styles.reveal} onClick={() => setStep('secret')}>
            {game.showRoleDuringReveal ? t('revealWord') : t('showInfo')}
          </button>
        </>
      ) : null}
      {step === 'secret' ? (
        <SecretCard showRole={game.showRoleDuringReveal} role={player.role} word={player.word} onHide={() => setStep('clearing')} />
      ) : null}
    </ScreenShell>
  );
}

function SecretCard({ showRole, role, word, onHide }: { showRole: boolean; role: Role; word: string; onHide: () => void }) {
  const { t } = useI18n();
  const unnamed = !showRole;
  return (
    <>
      <div className={styles.secret}>
        {unnamed ? <span>{t('yourInformation')}</span> : <span>{t('yourRole')}</span>}
        {unnamed ? null : <RoleBadge role={role} />}
        {role === 'doesntKnow' ? (
          <p className={styles.copy}>{unnamed ? `${t('noWordHidden')} ${t('noWordListen')}` : t('noWordBody')}</p>
        ) : (
          <>
            {unnamed ? null : <span>{t('yourWord')}</span>}
            <strong className={styles.word}>{word}</strong>
          </>
        )}
      </div>
      <button type="button" className={styles.pass} onClick={onHide}>
        {t('hidePass')}
      </button>
    </>
  );
}

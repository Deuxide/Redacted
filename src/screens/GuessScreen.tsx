import { useState } from 'react';
import { RoleBadge } from '../components/RoleBadge';
import { ScreenShell } from '../components/ScreenShell';
import { canVoteAgain } from '../game/results';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './ResultsScreen.module.css';

export function GuessScreen() {
  const { game, submitGuess, continueAfterElimination, leaveGame } = useGame();
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const guesser = game?.players.find((player) => player.doesntKnowGuess === 'pending' || player.doesntKnowGuess === 'correct' || player.doesntKnowGuess === 'incorrect');
  if (!game || game.phase !== 'guess' || !guesser) {
    return (
      <ScreenShell title={t('guessTitle')} onBack={leaveGame}>
        <p>{t('roundUnfinished')}</p>
      </ScreenShell>
    );
  }
  const locked = guesser.doesntKnowGuess !== 'pending';
  return (
    <ScreenShell title={t('guessTitle')} subtitle={guesser.name} onBack={leaveGame}>
      <RoleBadge role="doesntKnow" />
      <p>{t('guessPrompt')}</p>
      {locked ? (
        <p>{guesser.doesntKnowGuess === 'correct' ? t('guessCorrect') : t('guessWrong')}</p>
      ) : (
        <label>
          {t('guessLabel')}
          <input className={styles.word} value={draft} maxLength={40} autoComplete="off" aria-label={t('guessLabel')} onChange={(event) => setDraft(event.target.value)} />
        </label>
      )}
      {locked ? (
        <button type="button" className={styles.primary} onClick={continueAfterElimination}>
          {canVoteAgain(game.players) ? t('continueVote') : t('seeResults')}
        </button>
      ) : (
        <button type="button" className={styles.primary} disabled={!draft.trim()} onClick={() => submitGuess(guesser.id, draft)}>
          {t('submitGuess')}
        </button>
      )}
    </ScreenShell>
  );
}

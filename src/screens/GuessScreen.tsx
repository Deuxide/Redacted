import { useState } from 'react';
import { Button, Field } from '../components/Primitives';
import { RoleBadge } from '../components/RoleBadge';
import { ScreenShell } from '../components/ScreenShell';
import { canVoteAgain } from '../game/results';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import styles from './ResultsScreen.module.css';
import { ResultsScreen } from './ResultsScreen';
import { VotingScreen } from './VotingScreen';

export function GuessScreen() {
  const { game, submitGuess, continueAfterElimination, leaveGame } = useGame();
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const guesser = game?.players.find((player) => player.doesntKnowGuess === 'pending' || player.doesntKnowGuess === 'correct' || player.doesntKnowGuess === 'incorrect');
  if (game?.phase === 'results') return <ResultsScreen />;
  if (game?.phase === 'voting') return <VotingScreen />;
  if (!game || game.phase !== 'guess' || !guesser) {
    return (
      <ScreenShell title={t('guessTitle')} onBack={leaveGame}>
        <p>{t('roundUnfinished')}</p>
      </ScreenShell>
    );
  }
  const locked = guesser.doesntKnowGuess !== 'pending';
  return (
    <ScreenShell title={t('guessTitle')} subtitle={guesser.name} onBack={leaveGame}
      footer={locked
        ? <Button wide onClick={continueAfterElimination}>{canVoteAgain(game.players) ? t('continueVote') : t('seeResults')}</Button>
        : <Button wide disabled={!draft.trim()} onClick={() => submitGuess(guesser.id, draft)}>{t('submitGuess')}</Button>}>
      <RoleBadge role="doesntKnow" />
      <p>{t('guessPrompt')}</p>
      {locked ? (
        <p>{guesser.doesntKnowGuess === 'correct' ? t('guessCorrect') : t('guessWrong')}</p>
      ) : (
        <Field>
          {t('guessLabel')}
          <input className={styles.word} value={draft} maxLength={40} autoComplete="off" aria-label={t('guessLabel')} onChange={(event) => setDraft(event.target.value)} />
        </Field>
      )}
    </ScreenShell>
  );
}

import { useEffect, useState } from 'react';
import { Button, Card, ChoiceRow, ProgressIndicator } from '../components/Primitives';
import { Scoreboard } from '../components/Scoreboard';
import { ScreenShell } from '../components/ScreenShell';
import { SKIP_VOTE_ID } from '../game/results';
import { countQuestionVotes } from '../question/votes';
import { useI18n } from '../i18n/LanguageProvider';
import { BUILTIN_QUESTION_SET } from '../question/sets';
import { useGame } from '../state/GameProvider';
import { MIN_PLAYERS } from '../types/game';
import styles from './WordSetScreen.module.css';

export function QuestionSetupScreen() {
  const { draft, questionSets, questionSetId, setQuestionSetId, goHome, addPlayer, removePlayer, setPlayerName, startQuestionGame } = useGame();
  const { t } = useI18n();
  return (
    <ScreenShell title={t('questionMode')} subtitle={t('questionModeHint')} onBack={goHome} footer={<Button wide onClick={startQuestionGame} disabled={draft.playerCount < MIN_PLAYERS}>{t('startQuestions')}</Button>}>
      <p>{t('lobbyHint')}</p>
      <label className={styles.field}>
        {t('questionSet')}
        <select value={questionSetId} onChange={(event) => setQuestionSetId(event.target.value)}>
          {[BUILTIN_QUESTION_SET, ...questionSets].map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
        </select>
      </label>
      <ul className={styles.names}>
        {draft.players.map((player, index) => (
          <li key={player.id}>
            <label htmlFor={`q-${player.id}`}>{t('playerLabel', { n: index + 1 })}</label>
            <div className={styles.wordRow}>
              <input id={`q-${player.id}`} value={player.name} maxLength={24} aria-label={t('playerLabel', { n: index + 1 })} onChange={(event) => setPlayerName(player.id, event.target.value)} />
              <button type="button" onClick={() => removePlayer(player.id)} disabled={draft.playerCount <= MIN_PLAYERS}>{t('remove')}</button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" wide onClick={addPlayer}>{t('addPlayer')}</Button>
    </ScreenShell>
  );
}

export function QuestionAnswerScreen() {
  const { questionRound, submitQuestionAnswer, leaveGame } = useGame();
  const { t } = useI18n();
  const [step, setStep] = useState<'pass' | 'answer' | 'done'>('pass');
  const [text, setText] = useState('');
  useEffect(() => {
    setStep('pass');
    setText('');
  }, [questionRound?.turnIndex, questionRound?.phase]);
  if (!questionRound || questionRound.phase !== 'answer') return null;
  const player = questionRound.players.find((entry) => entry.id === questionRound.playerOrder[questionRound.turnIndex]);
  if (!player) return null;
  const stageIndex = step === 'pass' ? 1 : step === 'answer' ? 2 : 3;
  return (
    <ScreenShell
      key={`${questionRound.id}-${player.id}-${step}`}
      title={player.name}
      subtitle={t('passPhone', { name: player.name })}
      onBack={step === 'pass' ? leaveGame : undefined}
      footer={
        step === 'pass' ? <Button wide onClick={() => setStep('answer')}>{t('revealQuestion')}</Button>
          : step === 'answer' ? <Button wide disabled={!text.trim()} onClick={() => setStep('done')}>{t('submitAnswer')}</Button>
            : <Button wide onClick={() => submitQuestionAnswer(player.id, text)}>{t('passNext')}</Button>
      }
    >
      <ProgressIndicator value={stageIndex} total={3} label={t('revealSteps')} />
      <p className={styles.turnEyebrow}>{t('yourTurn')}</p>
      {step === 'answer' ? (
        <>
          <Card className={styles.card}>
            <p className={styles.note}>{t('yourQuestion')}</p>
            <strong>{player.question}</strong>
          </Card>
          <label className={styles.field}>
            {t('yourAnswer')}
            <textarea value={text} maxLength={160} placeholder={t('yourAnswer')} aria-label={t('yourAnswer')} onChange={(event) => setText(event.target.value)} />
            <small className={styles.counter} role="status">{t('answerCharacterCount', { count: text.length })}</small>
          </label>
        </>
      ) : null}
      {step === 'done' ? (
        <>
          <p>{t('answerSubmitted')}</p>
          <p>{t('passNext')}</p>
        </>
      ) : null}
    </ScreenShell>
  );
}

export function QuestionDiscussionScreen() {
  const { questionRound, revealCivilianQuestion, startQuestionVoting, leaveGame } = useGame();
  const { t } = useI18n();
  if (!questionRound || questionRound.phase !== 'board') return null;
  return (
    <ScreenShell title={t('answersTitle')} onBack={leaveGame} footer={questionRound.civilianQuestionRevealed ? <Button wide onClick={startQuestionVoting}>{t('startVoting')}</Button> : undefined}>
      {questionRound.playerOrder.map((id) => {
        const player = questionRound.players.find((entry) => entry.id === id);
        return <Card key={id} className={styles.card}><h2>{player?.name}</h2><p>{questionRound.answers[id]}</p></Card>;
      })}
      {questionRound.civilianQuestionRevealed ? <p>{t('civilianQuestion')}: {questionRound.civilianQuestion}</p> : <Button variant="secondary" wide onClick={revealCivilianQuestion}>{t('revealCivilianQuestion')}</Button>}
      {questionRound.civilianQuestionRevealed ? (
        <p>{t('questionTalk')}</p>
      ) : null}
    </ScreenShell>
  );
}

export function QuestionVoteScreen() {
  const { questionRound, castQuestionVote, leaveGame } = useGame();
  const { t } = useI18n();
  const [step, setStep] = useState<'pass' | 'choose'>('pass');
  const [selected, setSelected] = useState('');
  const voterId = questionRound?.playerOrder[questionRound.voteIndex];
  useEffect(() => { setStep('pass'); setSelected(''); }, [voterId]);
  if (!questionRound || questionRound.phase !== 'voting' || !voterId) return null;
  if (questionRound.notice) {
    return (
      <ScreenShell title={questionRound.notice === 'tie' ? t('tieLabel') : t('voteSkipped')} onBack={leaveGame}
        footer={<Button wide onClick={() => castQuestionVote('dismiss', 'dismiss')}>{t('continueVoting')}</Button>}>
        <p>{questionRound.notice === 'tie' ? t('tieAgain') : t('skipAgain')}</p>
      </ScreenShell>
    );
  }
  const voter = questionRound.players.find((player) => player.id === voterId);
  return (
    <ScreenShell
      title={voter?.name ?? ''}
      subtitle={t('passPhone', { name: voter?.name ?? '' })}
      onBack={step === 'pass' ? leaveGame : undefined}
      footer={step === 'pass' ? <Button wide onClick={() => setStep('choose')}>{t('imPlayer', { name: voter?.name ?? '' })}</Button>
        : <Button wide disabled={!selected} onClick={() => castQuestionVote(voterId, selected)}>{t('confirmHide')}</Button>}
    >
      <ProgressIndicator value={step === 'pass' ? 1 : 2} total={2} label={t('votingSteps')} />
      <p className={styles.turnEyebrow}>{t('yourTurn')}</p>
      {step === 'choose' ? (
        <>
          <p>{t('whoDifferent')}</p>
          {questionRound.players.filter((player) => player.id !== voterId).map((player) => (
            <ChoiceRow key={player.id} aria-pressed={selected === player.id} onClick={() => setSelected(player.id)}>{player.name}</ChoiceRow>
          ))}
          <ChoiceRow aria-pressed={selected === SKIP_VOTE_ID} onClick={() => setSelected(SKIP_VOTE_ID)}>{t('skipVote')}</ChoiceRow>
        </>
      ) : null}
    </ScreenShell>
  );
}

export function QuestionResultsScreen() {
  const { questionRound, session, roundPoints, playQuestionAgain, leaveGame } = useGame();
  const { t } = useI18n();
  if (!questionRound?.result || !questionRound.eliminatedId) return null;
  const eliminated = questionRound.players.find((player) => player.id === questionRound.eliminatedId);
  const counts = questionRound.voteHistory.at(-1)?.counts ?? countQuestionVotes(questionRound);
  return (
    <ScreenShell
      title={questionRound.result === 'civilianWin' ? t('questionCivilianWin') : t('questionUndercoverWin')}
      onBack={leaveGame}
      footer={<Button wide onClick={playQuestionAgain}>{t('playAgain')}</Button>}
    >
      <p>{eliminated?.name} — {eliminated?.role === 'undercover' ? t('undercover') : t('civilian')}</p>
      <h2>{t('civilianQuestion')}</h2>
      <p>{questionRound.civilianQuestion}</p>
      <h2>{t('undercoverQuestion')}</h2>
      <p>{questionRound.undercoverQuestion}</p>
      <h2>{t('answersTitle')}</h2>
      {questionRound.playerOrder.map((id) => <p key={id}><strong>{questionRound.players.find((player) => player.id === id)?.name}</strong> {questionRound.answers[id]}</p>)}
      <h2>{t('voteResults')}</h2>
      {questionRound.players.map((player) => <p key={player.id}>{player.name}: {counts[player.id] ?? 0}</p>)}
      <p>{t('skipVote')}: {counts[SKIP_VOTE_ID] ?? 0}</p>
      <h2>{t('roundPoints')}</h2>
      {questionRound.players.map((player) => <p key={player.id}>{player.name} {t('plusPoints', { count: roundPoints[player.id] ?? 0 })}</p>)}
      {session ? <Scoreboard players={session.players} gains={roundPoints} /> : null}
      <Button variant="quiet" wide onClick={leaveGame}>{t('backToMenu')}</Button>
    </ScreenShell>
  );
}

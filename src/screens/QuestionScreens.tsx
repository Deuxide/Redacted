import { useEffect, useState } from 'react';
import { Scoreboard } from '../components/Scoreboard';
import { ScreenShell } from '../components/ScreenShell';
import { SKIP_VOTE_ID } from '../game/results';
import { countQuestionVotes } from '../question/votes';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import { MIN_PLAYERS } from '../types/game';
import styles from './SetupScreen.module.css';

export function QuestionSetupScreen() {
  const { draft, goHome, addPlayer, removePlayer, setPlayerName, startQuestionGame } = useGame();
  const { t } = useI18n();
  return (
    <ScreenShell title={t('questionMode')} subtitle={t('questionModeHint')} onBack={goHome} footer={<button type="button" className={styles.start} onClick={startQuestionGame} disabled={draft.playerCount < MIN_PLAYERS}>{t('startQuestions')}</button>}>
      <p>{t('lobbyHint')}</p>
      <QuestionSetImport />
      <ul className={styles.names}>
        {draft.players.map((player, index) => (
          <li key={player.id}>
            <label htmlFor={`q-${player.id}`}>{t('playerLabel', { n: index + 1 })}</label>
            <div className={styles.nameRow}>
              <input id={`q-${player.id}`} value={player.name} maxLength={24} aria-label={t('playerLabel', { n: index + 1 })} onChange={(event) => setPlayerName(player.id, event.target.value)} />
              <button type="button" onClick={() => removePlayer(player.id)} disabled={draft.playerCount <= MIN_PLAYERS}>{t('remove')}</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.secondary} onClick={addPlayer}>{t('addPlayer')}</button>
    </ScreenShell>
  );
}

function QuestionSetImport() {
  const { importQuestionSet, questionSets } = useGame();
  const { t } = useI18n();
  const [error, setError] = useState('');
  return (
    <section>
      <p>{questionSets[0]?.name ?? t('builtin')}</p>
      <input type="file" accept="application/json" aria-label={t('importJson')} onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const message = importQuestionSet(await file.text());
        setError(message ? t('invalidJson') : '');
      }} />
      {error ? <p>{error}</p> : null}
      {questionSets[0] ? <button type="button" className={styles.secondary} onClick={() => downloadSet(questionSets[0])}>{t('exportJson')}</button> : null}
    </section>
  );
}

function downloadSet(set: { name: string; groups: { id: string; civilianQuestion: string; undercoverQuestion: string }[] }) {
  const blob = new Blob([JSON.stringify({ name: set.name, groups: set.groups }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'question-set.json';
  link.click();
  URL.revokeObjectURL(link.href);
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
  return (
    <ScreenShell key={`${questionRound.id}-${player.id}-${step}`} title={player.name} subtitle={t('passPhone', { name: player.name })} onBack={step === 'pass' ? leaveGame : undefined}>
      {step === 'pass' ? <button type="button" className={styles.start} onClick={() => setStep('answer')}>{t('revealQuestion')}</button> : null}
      {step === 'answer' ? (
        <>
          <p>{t('yourQuestion')}</p>
          <strong>{player.question}</strong>
          <label>
            {t('yourAnswer')}
            <input value={text} maxLength={160} aria-label={t('yourAnswer')} onChange={(event) => setText(event.target.value)} />
          </label>
          <button type="button" className={styles.start} disabled={!text.trim()} onClick={() => setStep('done')}>{t('submitAnswer')}</button>
        </>
      ) : null}
      {step === 'done' ? (
        <>
          <p>{t('answerSubmitted')}</p>
          <p>{t('passNext')}</p>
          <button type="button" className={styles.start} onClick={() => submitQuestionAnswer(player.id, text)}>{t('passNext')}</button>
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
    <ScreenShell title={t('answersTitle')} onBack={leaveGame}>
      {questionRound.playerOrder.map((id) => {
        const player = questionRound.players.find((entry) => entry.id === id);
        return <article key={id}><strong>{player?.name}</strong><p>{questionRound.answers[id]}</p></article>;
      })}
      {questionRound.civilianQuestionRevealed ? <p>{t('civilianQuestion')}: {questionRound.civilianQuestion}</p> : <button type="button" className={styles.secondary} onClick={revealCivilianQuestion}>{t('revealCivilianQuestion')}</button>}
      {questionRound.civilianQuestionRevealed ? (
        <>
          <p>{t('questionTalk')}</p>
          <button type="button" className={styles.start} onClick={startQuestionVoting}>{t('startVoting')}</button>
        </>
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
      <ScreenShell title={questionRound.notice === 'tie' ? t('tieLabel') : t('voteSkipped')} onBack={leaveGame}>
        <p>{questionRound.notice === 'tie' ? t('tieAgain') : t('skipAgain')}</p>
        <button type="button" className={styles.start} onClick={() => castQuestionVote('dismiss', 'dismiss')}>{t('tieRevote')}</button>
      </ScreenShell>
    );
  }
  const voter = questionRound.players.find((player) => player.id === voterId);
  return (
    <ScreenShell title={voter?.name ?? ''} subtitle={t('passPhone', { name: voter?.name ?? '' })} onBack={step === 'pass' ? leaveGame : undefined}>
      {step === 'pass' ? <button type="button" className={styles.start} onClick={() => setStep('choose')}>{t('imPlayer', { name: voter?.name ?? '' })}</button> : null}
      {step === 'choose' ? (
        <>
          <p>{t('whoDifferent')}</p>
          {questionRound.players.filter((player) => player.id !== voterId).map((player) => (
            <button key={player.id} type="button" className={styles.secondary} aria-pressed={selected === player.id} onClick={() => setSelected(player.id)}>{player.name}</button>
          ))}
          <button type="button" className={styles.secondary} aria-pressed={selected === SKIP_VOTE_ID} onClick={() => setSelected(SKIP_VOTE_ID)}>{t('skipVote')}</button>
          <button type="button" className={styles.start} disabled={!selected} onClick={() => castQuestionVote(voterId, selected)}>{t('confirmHide')}</button>
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
    <ScreenShell title={questionRound.result === 'civilianWin' ? t('questionCivilianWin') : t('questionUndercoverWin')} onBack={leaveGame}>
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
      <button type="button" className={styles.start} onClick={playQuestionAgain}>{t('playAgain')}</button>
      <button type="button" className={styles.secondary} onClick={leaveGame}>{t('backToMenu')}</button>
    </ScreenShell>
  );
}

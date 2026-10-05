import { ScreenShell } from '../components/ScreenShell';
import { Stepper } from '../components/Stepper';
import { useGame } from '../state/GameProvider';
import { MAX_PLAYERS, MIN_PLAYERS, MIN_UNDERCOVER, maxSuspects, maxUndercover, playableGroups, suggestedUndercover } from '../types/game';
import styles from './SetupScreen.module.css';

export function SetupScreen() {
  const { draft, wordSets, selectedSet, startError, goHome, setPlayerCount, setUndercoverCount, setSuspectsPerVote, setTieBehavior, setPlayerName, addPlayer, removePlayer, setWordSetId, startGame } =
    useGame();
  const undercoverMax = maxUndercover(draft.playerCount);
  const suggested = suggestedUndercover(draft.playerCount);
  const suggestion = suggested.min === suggested.max ? `${suggested.min}` : `${suggested.min}–${suggested.max}`;
  const canStart = playableGroups(selectedSet).length > 0;

  return (
    <ScreenShell
      title="New Game"
      subtitle="Name the players, then pass one phone around."
      onBack={goHome}
      footer={
        <button type="button" className={styles.start} onClick={startGame} disabled={!canStart}>
          Start Game
        </button>
      }
    >
      <Stepper
        label="Players"
        value={draft.playerCount}
        min={MIN_PLAYERS}
        max={MAX_PLAYERS}
        hint={`${MIN_PLAYERS}–${MAX_PLAYERS} people on this phone`}
        onChange={setPlayerCount}
      />
      <p className={styles.recommend} role="status">
        Players: {draft.playerCount}. Recommended undercover: {suggestion}.
      </p>
      <Stepper
        label="Undercover"
        value={draft.undercoverCount}
        min={MIN_UNDERCOVER}
        max={undercoverMax}
        hint="Manual override. At least two civilians stay in."
        onChange={setUndercoverCount}
      />
      <button type="button" className={styles.suggest} onClick={() => setUndercoverCount(suggested.min)}>
        Use suggested ({suggested.min})
      </button>
      <Stepper
        label="Suspects per vote"
        value={draft.suspectsPerVote}
        min={1}
        max={maxSuspects(draft.undercoverCount, draft.playerCount)}
        hint="Each voter picks this many other players. Default is 1."
        onChange={setSuspectsPerVote}
      />
      <div className={styles.block}>
        <h2>If the top vote is a tie</h2>
        <div className={styles.sets}>
          <button
            type="button"
            className={draft.tieBehavior === 'eliminate-none' ? styles.selected : styles.set}
            aria-pressed={draft.tieBehavior === 'eliminate-none'}
            onClick={() => setTieBehavior('eliminate-none')}
          >
            <strong>Eliminate nobody</strong>
            <span>Default. A tie means the undercover side survives.</span>
          </button>
          <button
            type="button"
            className={draft.tieBehavior === 'revote' ? styles.selected : styles.set}
            aria-pressed={draft.tieBehavior === 'revote'}
            onClick={() => setTieBehavior('revote')}
          >
            <strong>Offer a revote</strong>
            <span>Results still show the tie, with a button to vote again.</span>
          </button>
        </div>
      </div>

      <div className={styles.block}>
        <h2>Player names</h2>
        <ul className={styles.names}>
          {draft.players.map((player, index) => (
            <li key={player.id}>
              <label htmlFor={player.id}>Player {index + 1}</label>
              <div className={styles.nameRow}>
                <input
                  id={player.id}
                  value={player.name}
                  maxLength={24}
                  autoComplete="off"
                  aria-label={`Name for player ${index + 1}`}
                  placeholder={`Player ${index + 1}`}
                  onChange={(event) => setPlayerName(player.id, event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removePlayer(player.id)}
                  disabled={draft.playerCount <= MIN_PLAYERS}
                  aria-label={`Remove player ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className={styles.suggest} onClick={addPlayer} disabled={draft.playerCount >= MAX_PLAYERS}>
          Add player
        </button>
        <p className={styles.hint}>Blank names are saved as Player 1, Player 2, and so on.</p>
      </div>

      <div className={styles.block}>
        <h2>Word set</h2>
        <div className={styles.sets}>
          {wordSets.map((set) => {
            const selected = set.id === selectedSet.id;
            const ready = playableGroups(set).length;
            return (
              <button
                key={set.id}
                type="button"
                className={selected ? styles.selected : styles.set}
                onClick={() => setWordSetId(set.id)}
                aria-pressed={selected}
              >
                <strong>{set.name}</strong>
                <span>{set.description || (set.builtin ? 'Built-in set' : 'Custom set')}</span>
                <small>
                  {ready} playable groups{set.builtin ? ' · built-in' : ''}
                </small>
              </button>
            );
          })}
        </div>
      </div>
      {startError ? <p className={styles.error}>{startError}</p> : null}
    </ScreenShell>
  );
}

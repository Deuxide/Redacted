import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ScreenShell } from '../components/ScreenShell';
import { Stepper } from '../components/Stepper';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import { MAX_PLAYERS, MIN_PLAYERS, MIN_UNDERCOVER, civilianCount, maxDoesntKnow, maxSuspects, maxUndercover, playableGroups, suggestedUndercover } from '../types/game';
import styles from './SetupScreen.module.css';

export function SetupScreen() {
  const { draft, wordSets, selectedSet, startError, goHome, setPlayerCount, setUndercoverCount, setDoesntKnowCount, setSuspectsPerVote, setTieBehavior, setShowRoleDuringReveal, setPlayerName, addPlayer, removePlayer, setWordSetId, startGame } = useGame();
  const { t } = useI18n();
  const civilians = civilianCount(draft.playerCount, draft.undercoverCount, draft.doesntKnowCount);
  const undercoverMax = maxUndercover(draft.playerCount, draft.doesntKnowCount);
  const doesntKnowMax = maxDoesntKnow(draft.playerCount, draft.undercoverCount);
  const suggested = suggestedUndercover(draft.playerCount);
  const suggestion = suggested.min === suggested.max ? `${suggested.min}` : `${suggested.min}–${suggested.max}`;
  const canStart = playableGroups(selectedSet).length > 0;

  return (
    <ScreenShell
      title={t('setupTitle')}
      subtitle={t('setupSubtitle')}
      onBack={goHome}
      footer={
        <button type="button" className={styles.start} onClick={startGame} disabled={!canStart}>
          {t('startGame')}
        </button>
      }
    >
      <LanguageSwitcher />
      <Stepper label={t('players')} value={draft.playerCount} min={MIN_PLAYERS} max={MAX_PLAYERS} hint={t('playersHint', { min: MIN_PLAYERS, max: MAX_PLAYERS })} onChange={setPlayerCount} />
      <section className={styles.block} aria-label={t('roles')}>
        <h2>{t('roles')}</h2>
        <p className={styles.recommend} role="status">{t('civiliansStatus', { count: civilians })}</p>
        <Stepper label={t('undercover')} value={draft.undercoverCount} min={MIN_UNDERCOVER} max={undercoverMax} hint={t('undercoverHint', { count: draft.playerCount, suggestion })} onChange={setUndercoverCount} />
        <button type="button" className={styles.suggest} onClick={() => setUndercoverCount(Math.min(suggested.min, undercoverMax))}>
          {t('useSuggested', { count: Math.min(suggested.min, undercoverMax) })}
        </button>
        <Stepper label={t('doesntKnow')} value={draft.doesntKnowCount} min={0} max={doesntKnowMax} hint={t('doesntKnowHint')} onChange={setDoesntKnowCount} />
        {civilians <= 2 ? <p className={styles.error}>{t('unusualRoles', { count: civilians })}</p> : null}
      </section>
      <div className={styles.block}>
        <h2>{t('showRole')}</h2>
        <div className={styles.sets}>
          <button type="button" className={draft.showRoleDuringReveal ? styles.selected : styles.set} aria-pressed={draft.showRoleDuringReveal} onClick={() => setShowRoleDuringReveal(true)}>
            <strong>{t('showRoleOn')}</strong>
            <span>{t('showRoleOnHint')}</span>
          </button>
          <button type="button" className={draft.showRoleDuringReveal ? styles.set : styles.selected} aria-pressed={!draft.showRoleDuringReveal} onClick={() => setShowRoleDuringReveal(false)}>
            <strong>{t('showRoleOff')}</strong>
            <span>{t('showRoleOffHint')}</span>
          </button>
        </div>
      </div>
      <Stepper label={t('suspects')} value={draft.suspectsPerVote} min={1} max={maxSuspects(draft.undercoverCount + draft.doesntKnowCount, draft.playerCount)} hint={t('suspectsHint')} onChange={setSuspectsPerVote} />
      <div className={styles.block}>
        <h2>{t('tieTitle')}</h2>
        <div className={styles.sets}>
          <button type="button" className={draft.tieBehavior === 'eliminate-none' ? styles.selected : styles.set} aria-pressed={draft.tieBehavior === 'eliminate-none'} onClick={() => setTieBehavior('eliminate-none')}>
            <strong>{t('tieNone')}</strong>
            <span>{t('tieNoneHint')}</span>
          </button>
          <button type="button" className={draft.tieBehavior === 'revote' ? styles.selected : styles.set} aria-pressed={draft.tieBehavior === 'revote'} onClick={() => setTieBehavior('revote')}>
            <strong>{t('tieRevote')}</strong>
            <span>{t('tieRevoteHint')}</span>
          </button>
        </div>
      </div>
      <div className={styles.block}>
        <h2>{t('playerNames')}</h2>
        <ul className={styles.names}>
          {draft.players.map((player, index) => (
            <li key={player.id}>
              <label htmlFor={player.id}>{t('playerLabel', { n: index + 1 })}</label>
              <div className={styles.nameRow}>
                <input id={player.id} value={player.name} maxLength={24} autoComplete="off" aria-label={t('playerLabel', { n: index + 1 })} placeholder={t('playerLabel', { n: index + 1 })} onChange={(event) => setPlayerName(player.id, event.target.value)} />
                <button type="button" onClick={() => removePlayer(player.id)} disabled={draft.playerCount <= MIN_PLAYERS} aria-label={t('removePlayer', { n: index + 1 })}>
                  {t('remove')}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className={styles.suggest} onClick={addPlayer} disabled={draft.playerCount >= MAX_PLAYERS}>
          {t('addPlayer')}
        </button>
        <p className={styles.hint}>{t('blankNames')}</p>
      </div>
      <div className={styles.block}>
        <h2>{t('wordSet')}</h2>
        <div className={styles.sets}>
          {wordSets.map((set) => {
            const selected = set.id === selectedSet.id;
            const ready = playableGroups(set).length;
            return (
              <button key={set.id} type="button" className={selected ? styles.selected : styles.set} onClick={() => setWordSetId(set.id)} aria-pressed={selected}>
                <strong>{set.name}</strong>
                <span>{set.description || (set.builtin ? t('builtin') : t('customSet'))}</span>
                <small>{t('playableGroups', { count: ready })}</small>
              </button>
            );
          })}
        </div>
      </div>
      {startError ? <p className={styles.error}>{t(startError)}</p> : null}
    </ScreenShell>
  );
}

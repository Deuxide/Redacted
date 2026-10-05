import { useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ScreenShell } from '../components/ScreenShell';
import { Stepper } from '../components/Stepper';
import { ThemePicker } from '../components/ThemePicker';
import { useI18n } from '../i18n/LanguageProvider';
import { useGame } from '../state/GameProvider';
import { MAX_PLAYERS, MIN_PLAYERS, MIN_UNDERCOVER, civilianCount, maxDoesntKnow, maxSuspects, maxUndercover, playableGroups, suggestedUndercover } from '../types/game';
import styles from './SetupScreen.module.css';

export function SetupScreen() {
  const { draft, wordSets, selectedSet, startError, goHome, openWordSets, openImport, openExport, openEditor, setPlayerCount, setUndercoverCount, setDoesntKnowCount, setSuspectsPerVote, setTieBehavior, setShowRoleDuringReveal, setPlayerName, addPlayer, removePlayer, setWordSetId, startGame } = useGame();
  const { t } = useI18n();
  const [showSets, setShowSets] = useState(false);
  const civilians = civilianCount(draft.playerCount, draft.undercoverCount, draft.doesntKnowCount);
  const undercoverMax = maxUndercover(draft.playerCount, draft.doesntKnowCount);
  const doesntKnowMax = maxDoesntKnow(draft.playerCount, draft.undercoverCount);
  const suggested = suggestedUndercover(draft.playerCount);
  const suggestion = suggested.min === suggested.max ? `${suggested.min}` : `${suggested.min}–${suggested.max}`;
  const readyGroups = playableGroups(selectedSet).length;
  const canStart = readyGroups > 0 && draft.playerCount >= MIN_PLAYERS && civilians >= 1;
  const names = draft.players.map((player) => player.name.trim().toLocaleLowerCase()).filter(Boolean);
  const duplicate = names.length !== new Set(names).size;

  return (
    <ScreenShell
      title={t('homeTitle')}
      subtitle={t('setupSubtitle')}
      onBack={goHome}
      footer={
        <div className={styles.startBox}>
          <p>{t('setupSummary', { players: draft.playerCount, undercover: draft.undercoverCount, blank: draft.doesntKnowCount })}</p>
          <button type="button" className={styles.start} onClick={startGame} disabled={!canStart}>
            {t('startGame')}
          </button>
          {!canStart ? <p className={styles.error}>{t('startBlocked')}</p> : null}
        </div>
      }
    >
      <section className={styles.block} aria-label={t('players')}>
        <div className={styles.heading}>
          <h2>{t('players')}</h2>
          <span>{t('playerCountLabel', { count: draft.playerCount })}</span>
        </div>
        <p className={styles.hint}>{t('lobbyHint')}</p>
        <Stepper label={t('players')} value={draft.playerCount} min={MIN_PLAYERS} max={MAX_PLAYERS} hint={t('playersHint', { min: MIN_PLAYERS, max: MAX_PLAYERS })} onChange={setPlayerCount} />
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
        <button type="button" className={styles.secondary} onClick={addPlayer} disabled={draft.playerCount >= MAX_PLAYERS}>
          {t('addPlayer')}
        </button>
        <p className={styles.hint}>{t('blankNames')}</p>
        {draft.playerCount < MIN_PLAYERS ? <p className={styles.error}>{t('playersHint', { min: MIN_PLAYERS, max: MAX_PLAYERS })}</p> : null}
        {duplicate ? <p className={styles.error}>{t('duplicateNames')}</p> : null}
      </section>

      <section className={styles.block} aria-label={t('roles')}>
        <h2>{t('roles')}</h2>
        <p className={styles.countLine} role="status">{t('civiliansShort')}: {civilians}</p>
        <Stepper label={t('undercover')} value={draft.undercoverCount} min={MIN_UNDERCOVER} max={undercoverMax} hint={t('undercoverHint', { count: draft.playerCount, suggestion })} onChange={setUndercoverCount} />
        <button type="button" className={styles.secondary} onClick={() => setUndercoverCount(Math.min(suggested.min, undercoverMax))}>
          {t('useSuggested', { count: Math.min(suggested.min, undercoverMax) })}
        </button>
        <Stepper label={t('doesntKnow')} value={draft.doesntKnowCount} min={0} max={doesntKnowMax} hint={t('doesntKnowHint')} onChange={setDoesntKnowCount} />
        {civilians <= 2 ? <p className={styles.error}>{t('unusualRoles', { count: civilians })}</p> : null}
      </section>

      <section className={styles.block} aria-label={t('wordSet')}>
        <h2>{t('wordSet')}</h2>
        <p className={styles.current}>{t('currentSet')}</p>
        <strong className={styles.setName}>{selectedSet.name}</strong>
        <p className={styles.hint}>{t('playableGroups', { count: readyGroups })}</p>
        {startError ? <p className={styles.error}>{t(startError)}</p> : null}
        {!readyGroups ? <p className={styles.error}>{t('needWords')}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} aria-expanded={showSets} onClick={() => setShowSets((open) => !open)}>
            {t('changeWordSet')}
          </button>
          <button type="button" className={styles.ghost} onClick={openWordSets}>{t('manageWords')}</button>
          <button type="button" className={styles.ghost} onClick={openImport}>{t('importJson')}</button>
          <button type="button" className={styles.ghost} onClick={openExport}>{t('exportJson')}</button>
          {selectedSet.builtin ? null : <button type="button" className={styles.ghost} onClick={() => openEditor(selectedSet.id)}>{t('edit')}</button>}
        </div>
        {showSets ? (
          <div className={styles.sets}>
            {wordSets.map((set) => {
              const selected = set.id === selectedSet.id;
              return (
                <button key={set.id} type="button" className={selected ? styles.selected : styles.set} onClick={() => setWordSetId(set.id)} aria-pressed={selected}>
                  <strong>{set.name}</strong>
                  <span>{t('playableGroups', { count: playableGroups(set).length })}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <details className={styles.block}>
        <summary>{t('gameSettings')}</summary>
        <Stepper label={t('suspects')} value={draft.suspectsPerVote} min={1} max={maxSuspects(draft.undercoverCount + draft.doesntKnowCount, draft.playerCount)} hint={t('suspectsHint')} onChange={setSuspectsPerVote} />
        <div className={styles.sets}>
          <button type="button" className={draft.showRoleDuringReveal ? styles.selected : styles.set} aria-pressed={draft.showRoleDuringReveal} onClick={() => setShowRoleDuringReveal(true)}>
            <strong>{t('showRole')}</strong>
            <span>{t('showRoleOn')} — {t('showRoleOnHint')}</span>
          </button>
          <button type="button" className={draft.showRoleDuringReveal ? styles.set : styles.selected} aria-pressed={!draft.showRoleDuringReveal} onClick={() => setShowRoleDuringReveal(false)}>
            <strong>{t('showRole')}</strong>
            <span>{t('showRoleOff')} — {t('showRoleOffHint')}</span>
          </button>
          <button type="button" className={draft.tieBehavior === 'eliminate-none' ? styles.selected : styles.set} aria-pressed={draft.tieBehavior === 'eliminate-none'} onClick={() => setTieBehavior('eliminate-none')}>
            <strong>{t('tieNone')}</strong>
            <span>{t('tieNoneHint')}</span>
          </button>
          <button type="button" className={draft.tieBehavior === 'revote' ? styles.selected : styles.set} aria-pressed={draft.tieBehavior === 'revote'} onClick={() => setTieBehavior('revote')}>
            <strong>{t('tieRevote')}</strong>
            <span>{t('tieRevoteHint')}</span>
          </button>
        </div>
        <LanguageSwitcher />
        <ThemePicker />
      </details>
    </ScreenShell>
  );
}

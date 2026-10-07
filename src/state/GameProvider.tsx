import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ActiveGame, AppScreen, SetupDraft, WordSet } from '../types/game';
import { playableGroups } from '../types/game';
import { BUILTIN_WORD_SET } from '../data/builtinWordSets';
import { createActiveGame } from '../game/createGame';
import { applyRoundPoints, emptySession, loadPointSession, roundPointsFor, savePointSession, type PointSession } from '../game/sessionPoints';
import { SKIP_VOTE_ID, activePlayers, afterElimination, firstActiveIndex, nextActiveIndex, playerInOrder, resolveCompletedVote, wordsMatch } from '../game/results';
import { addPlayer, balanceRoles, clampSuspects, loadDraft, removePlayer, resizePlayers, saveDraft } from '../game/draft';
import { clearSessionGame, loadSessionGame, saveSessionGame, screenForPhase } from '../game/sessionGame';
import { useI18n } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { blankSet, duplicateSet } from '../wordSets/mutate';
import { createId } from '../wordSets/ids';
import { loadCustomSets, saveCustomSets } from '../wordSets/storage';

interface GameContextValue {
  screen: AppScreen;
  draft: SetupDraft;
  game: ActiveGame | null;
  session: PointSession | null;
  roundPoints: Record<string, number>;
  wordSets: WordSet[];
  selectedSet: WordSet;
  editingSet: WordSet | null;
  startError: MessageKey | null;
  goHome: () => void;
  openSetup: () => void;
  openSettings: () => void;
  openWordSets: () => void;
  openImport: () => void;
  openExport: () => void;
  openEditor: (setId: string) => void;
  setPlayerCount: (count: number) => void;
  addPlayer: () => void;
  removePlayer: (playerId: string) => void;
  setUndercoverCount: (count: number) => void;
  setDoesntKnowCount: (count: number) => void;
  setSuspectsPerVote: (count: number) => void;
  setTieBehavior: (tieBehavior: SetupDraft['tieBehavior']) => void;
  setShowRoleDuringReveal: (show: boolean) => void;
  setWordSetId: (wordSetId: string) => void;
  setPlayerName: (playerId: string, name: string) => void;
  startGame: () => void;
  markCurrentSeenAndAdvance: () => void;
  startVoting: () => void;
  castVote: (voterId: string, suspectIds: string[]) => void;
  continueAfterElimination: () => void;
  submitGuess: (playerId: string, guess: string) => void;
  revote: () => void;
  playAgain: () => void;
  continueSession: () => void;
  newGame: () => void;
  leaveGame: () => void;
  createCustomSet: () => void;
  duplicateWordSet: (setId: string) => void;
  deleteWordSet: (setId: string) => void;
  updateWordSet: (set: WordSet) => void;
  addImportedSets: (sets: WordSet[]) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function updateDraft(setter: (current: SetupDraft) => SetupDraft) {
  return (current: SetupDraft) => {
    const next = setter(current);
    saveDraft(next);
    return next;
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const restored = useMemo(() => loadSessionGame(), []);
  const [screen, setScreen] = useState<AppScreen>(() => (restored ? screenForPhase(restored.phase) : 'home'));
  const [draft, setDraft] = useState<SetupDraft>(() => loadDraft());
  const [game, setGame] = useState<ActiveGame | null>(restored);
  const [customSets, setCustomSets] = useState<WordSet[]>(() => loadCustomSets());
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [startError, setStartError] = useState<MessageKey | null>(null);
  const [session, setSession] = useState<PointSession | null>(() => loadPointSession());
  const [roundPoints, setRoundPoints] = useState<Record<string, number>>({});

  const wordSets = useMemo(() => [BUILTIN_WORD_SET, ...customSets], [customSets]);
  const selectedSet = wordSets.find((set) => set.id === draft.wordSetId) ?? BUILTIN_WORD_SET;
  const editingSet = customSets.find((set) => set.id === editingSetId) ?? null;

  useEffect(() => {
    savePointSession(session);
  }, [session]);

  useEffect(() => {
    if (game) saveSessionGame(game);
    else clearSessionGame();
  }, [game]);

  useEffect(() => {
    if (!game || game.phase !== 'results' || game.pointsAwarded) return;
    const earned = roundPointsFor(game);
    setRoundPoints(earned);
    setSession((current) => applyRoundPoints(current ?? emptySession(game.players), game, earned));
    setGame((current) => (current ? { ...current, pointsAwarded: true } : current));
  }, [game]);

  useEffect(() => {
    if (!game) return;
    const next = screenForPhase(game.phase);
    setScreen((current) =>
      current === 'reveal' || current === 'discussion' || current === 'voting' || current === 'elimination' || current === 'guess' || current === 'results' ? next : current,
    );
  }, [game]);

  useEffect(() => {
    if (!game || game.phase === 'results') return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [game]);

  function commitSets(next: WordSet[]) {
    setCustomSets(next);
    saveCustomSets(next);
  }

  function leaveGame() {
    if (game && game.phase !== 'results') {
      const leave = window.confirm(t('leaveConfirm'));
      if (!leave) return;
    }
    if (session && !window.confirm(t('leaveSession'))) return;
    setGame(null);
    setSession(null);
    setRoundPoints({});
    setScreen('home');
  }

  const value = useMemo<GameContextValue>(() => {
    return {
      screen,
      draft,
      game,
      session,
      roundPoints,
      wordSets,
      selectedSet,
      editingSet,
      startError,
      goHome: leaveGame,
      openSetup: () => {
        setStartError(null);
        setScreen('setup');
      },
      openSettings: () => setScreen('settings'),
      openWordSets: () => setScreen('word-sets'),
      openImport: () => setScreen('import'),
      openExport: () => setScreen('export'),
      openEditor: (setId) => {
        setEditingSetId(setId);
        setScreen('editor');
      },
      setPlayerCount: (count) => setDraft(updateDraft((current) => resizePlayers(current, count))),
      addPlayer: () => setDraft(updateDraft((current) => addPlayer(current))),
      removePlayer: (playerId) => setDraft(updateDraft((current) => removePlayer(current, playerId))),
      setUndercoverCount: (count) =>
        setDraft(
          updateDraft((current) => {
            const roles = balanceRoles(current.playerCount, count, current.doesntKnowCount, 'undercover');
            return {
              ...current,
              ...roles,
              suspectsPerVote: clampSuspects(current.suspectsPerVote, roles.undercoverCount + roles.doesntKnowCount, current.playerCount),
            };
          }),
        ),
      setDoesntKnowCount: (count) =>
        setDraft(
          updateDraft((current) => {
            const roles = balanceRoles(current.playerCount, current.undercoverCount, count, 'doesntKnow');
            return {
              ...current,
              ...roles,
              suspectsPerVote: clampSuspects(current.suspectsPerVote, roles.undercoverCount + roles.doesntKnowCount, current.playerCount),
            };
          }),
        ),
      setSuspectsPerVote: (count) =>
        setDraft(
          updateDraft((current) => ({
            ...current,
            suspectsPerVote: clampSuspects(count, current.undercoverCount + current.doesntKnowCount, current.playerCount),
          })),
        ),
      setTieBehavior: (tieBehavior) => setDraft(updateDraft((current) => ({ ...current, tieBehavior }))),
      setShowRoleDuringReveal: (show) => setDraft(updateDraft((current) => ({ ...current, showRoleDuringReveal: show }))),
      setWordSetId: (wordSetId) => {
        setStartError(null);
        setDraft(updateDraft((current) => ({ ...current, wordSetId })));
      },
      setPlayerName: (playerId, name) =>
        setDraft(
          updateDraft((current) => ({
            ...current,
            players: current.players.map((player) => (player.id === playerId ? { ...player, name } : player)),
          })),
        ),
      startGame: () => {
        if (!playableGroups(selectedSet).length) {
          setStartError('needWords');
          return;
        }
        const nextGame = createActiveGame({ ...draft, wordSetId: selectedSet.id }, selectedSet);
        if (!nextGame) {
          setStartError('pickFailed');
          return;
        }
        setStartError(null);
        setSession(emptySession(nextGame.players));
        setRoundPoints({});
        setGame(nextGame);
        setScreen('reveal');
      },
      markCurrentSeenAndAdvance: () => {
        setGame((current) => {
          if (!current || current.phase !== 'reveal') return current;
          const players = current.players.map((player) =>
            player.id === current.playerOrder[current.revealIndex] ? { ...player, hasSeenWord: true } : player,
          );
          const nextIndex = current.revealIndex + 1;
          if (nextIndex >= current.playerOrder.length) {
            return { ...current, players, phase: 'discussion', revealIndex: current.playerOrder.length - 1 };
          }
          return { ...current, players, revealIndex: nextIndex };
        });
      },
      startVoting: () => {
        setGame((current) => (current ? { ...current, phase: 'voting', voteIndex: firstActiveIndex(current.playerOrder, current.players), votes: {}, round: current.round || 1 } : current));
        setScreen('voting');
      },
      castVote: (voterId, suspectIds) => {
        setGame((current) => {
          if (!current || current.phase !== 'voting') return current;
          const voter = playerInOrder(current.players, current.playerOrder, current.voteIndex);
          const active = activePlayers(current.players);
          const needed = Math.min(current.suspectsPerVote, Math.max(1, active.length - 1));
          if (!voter || voter.eliminated || voter.id !== voterId || current.votes[voterId]) return current;
          const unique = [...new Set(suspectIds)].filter(
            (id) => id === SKIP_VOTE_ID || (id !== voterId && active.some((player) => player.id === id)),
          );
          if (unique.length !== needed) return current;
          const votes = { ...current.votes, [voterId]: unique };
          const voted = active.filter((player) => votes[player.id]).length;
          if (voted >= active.length) return resolveCompletedVote({ ...current, votes });
          return { ...current, votes, voteIndex: nextActiveIndex(current.playerOrder, current.players, current.voteIndex) };
        });
      },
      continueAfterElimination: () => {
        setGame((current) => (current && (current.phase === 'elimination' || current.phase === 'guess') ? afterElimination(current) : current));
      },
      submitGuess: (playerId, guess) => {
        setGame((current) => {
          if (!current || current.phase !== 'guess') return current;
          return {
            ...current,
            players: current.players.map((player) => {
              if (player.id !== playerId || player.doesntKnowGuess !== 'pending') return player;
              const correct = wordsMatch(guess, current.civilianWord);
              return { ...player, doesntKnowGuess: correct ? 'correct' : 'incorrect', individualWins: player.individualWins + (correct ? 1 : 0) };
            }),
          };
        });
      },
      revote: () => {
        setGame((current) =>
          current ? { ...current, phase: 'voting', voteIndex: firstActiveIndex(current.playerOrder, current.players), votes: {} } : current,
        );
        setScreen('voting');
      },
      playAgain: () => {
        const source = game;
        const set = wordSets.find((item) => item.id === source?.wordSetId) ?? selectedSet;
        if (!source || !playableGroups(set).length) return;
        const nextGame = createActiveGame(
          {
            playerCount: source.players.length,
            undercoverCount: source.players.filter((player) => player.role === 'undercover').length,
            doesntKnowCount: source.players.filter((player) => player.role === 'doesntKnow').length,
            suspectsPerVote: source.suspectsPerVote,
            tieBehavior: source.tieBehavior,
            showRoleDuringReveal: source.showRoleDuringReveal,
            wordSetId: set.id,
            players: source.players.map((player) => ({ id: player.id, name: player.name })),
          },
          set,
        );
        if (!nextGame) return;
        setRoundPoints({});
        setGame(nextGame);
        setScreen('reveal');
      },
      continueSession: () => {
        const source = game;
        const set = wordSets.find((item) => item.id === source?.wordSetId) ?? selectedSet;
        if (!source || !session || !playableGroups(set).length) return;
        const nextGame = createActiveGame(
          {
            playerCount: session.players.length,
            undercoverCount: source.players.filter((player) => player.role === 'undercover').length,
            doesntKnowCount: source.players.filter((player) => player.role === 'doesntKnow').length,
            suspectsPerVote: source.suspectsPerVote,
            tieBehavior: source.tieBehavior,
            showRoleDuringReveal: source.showRoleDuringReveal,
            wordSetId: set.id,
            players: session.players.map((player) => ({ id: player.id, name: player.name })),
          },
          set,
        );
        if (!nextGame) return;
        setRoundPoints({});
        setGame(nextGame);
        setScreen('reveal');
      },
      newGame: () => {
        if (session && !window.confirm(t('leaveSession'))) return;
        setSession(null);
        setRoundPoints({});
        setGame(null);
        setStartError(null);
        setScreen('setup');
      },
      leaveGame,
      createCustomSet: () => {
        const set = blankSet();
        commitSets([set, ...customSets]);
        setEditingSetId(set.id);
        setScreen('editor');
      },
      duplicateWordSet: (setId) => {
        const source = wordSets.find((set) => set.id === setId);
        if (!source) return;
        const copy = duplicateSet(source);
        commitSets([copy, ...customSets]);
        setEditingSetId(copy.id);
        setScreen('editor');
      },
      deleteWordSet: (setId) => {
        const next = customSets.filter((set) => set.id !== setId);
        commitSets(next);
        if (draft.wordSetId === setId) {
          setDraft(updateDraft((current) => ({ ...current, wordSetId: BUILTIN_WORD_SET.id })));
        }
        if (editingSetId === setId) setEditingSetId(null);
      },
      updateWordSet: (set) => {
        if (set.builtin) return;
        commitSets(customSets.map((current) => (current.id === set.id ? set : current)));
      },
      addImportedSets: (sets) => {
        const taken = new Set(wordSets.map((set) => set.id));
        const unique = sets.map((set) => {
          let id = set.id;
          if (taken.has(id)) id = createId('set');
          taken.add(id);
          return { ...set, id, builtin: false };
        });
        commitSets([...unique, ...customSets]);
        if (unique[0]) {
          setDraft(updateDraft((current) => ({ ...current, wordSetId: unique[0].id })));
        }
        setScreen('word-sets');
      },
    };
  }, [customSets, draft, editingSet, editingSetId, game, roundPoints, screen, selectedSet, session, startError, t, wordSets]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used within GameProvider');
  return value;
}

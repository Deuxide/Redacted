import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ActiveGame, AppScreen, SetupDraft, WordSet } from '../types/game';
import { playableGroups } from '../types/game';
import { BUILTIN_WORD_SET } from '../data/builtinWordSets';
import { createActiveGame } from '../game/createGame';
import { addPlayer, clampSuspects, clampUndercoverCount, loadDraft, removePlayer, resizePlayers, saveDraft } from '../game/draft';
import { clearSessionGame, loadSessionGame, saveSessionGame, screenForPhase } from '../game/sessionGame';
import { blankSet, duplicateSet } from '../wordSets/mutate';
import { createId } from '../wordSets/ids';
import { loadCustomSets, saveCustomSets } from '../wordSets/storage';

interface GameContextValue {
  screen: AppScreen;
  draft: SetupDraft;
  game: ActiveGame | null;
  wordSets: WordSet[];
  selectedSet: WordSet;
  editingSet: WordSet | null;
  startError: string | null;
  goHome: () => void;
  openSetup: () => void;
  openWordSets: () => void;
  openImport: () => void;
  openExport: () => void;
  openEditor: (setId: string) => void;
  setPlayerCount: (count: number) => void;
  addPlayer: () => void;
  removePlayer: (playerId: string) => void;
  setUndercoverCount: (count: number) => void;
  setSuspectsPerVote: (count: number) => void;
  setTieBehavior: (tieBehavior: SetupDraft['tieBehavior']) => void;
  setWordSetId: (wordSetId: string) => void;
  setPlayerName: (playerId: string, name: string) => void;
  startGame: () => void;
  markCurrentSeenAndAdvance: () => void;
  startVoting: () => void;
  castVote: (voterId: string, suspectIds: string[]) => void;
  revote: () => void;
  playAgain: () => void;
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
  const restored = useMemo(() => loadSessionGame(), []);
  const [screen, setScreen] = useState<AppScreen>(() => (restored ? screenForPhase(restored.phase) : 'home'));
  const [draft, setDraft] = useState<SetupDraft>(() => loadDraft());
  const [game, setGame] = useState<ActiveGame | null>(restored);
  const [customSets, setCustomSets] = useState<WordSet[]>(() => loadCustomSets());
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const wordSets = useMemo(() => [BUILTIN_WORD_SET, ...customSets], [customSets]);
  const selectedSet = wordSets.find((set) => set.id === draft.wordSetId) ?? BUILTIN_WORD_SET;
  const editingSet = customSets.find((set) => set.id === editingSetId) ?? null;

  useEffect(() => {
    if (game) saveSessionGame(game);
    else clearSessionGame();
  }, [game]);

  useEffect(() => {
    if (!game) return;
    const next = screenForPhase(game.phase);
    setScreen((current) =>
      current === 'reveal' || current === 'discussion' || current === 'voting' || current === 'results' ? next : current,
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
      const leave = window.confirm('Leave this game? The secret words will be cleared from the screen.');
      if (!leave) return;
    }
    setGame(null);
    setScreen('home');
  }

  const value = useMemo<GameContextValue>(() => {
    return {
      screen,
      draft,
      game,
      wordSets,
      selectedSet,
      editingSet,
      startError,
      goHome: leaveGame,
      openSetup: () => {
        setStartError(null);
        setScreen('setup');
      },
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
            const undercoverCount = clampUndercoverCount(count, current.playerCount);
            return {
              ...current,
              undercoverCount,
              suspectsPerVote: clampSuspects(current.suspectsPerVote, undercoverCount, current.playerCount),
            };
          }),
        ),
      setSuspectsPerVote: (count) =>
        setDraft(
          updateDraft((current) => ({
            ...current,
            suspectsPerVote: clampSuspects(count, current.undercoverCount, current.playerCount),
          })),
        ),
      setTieBehavior: (tieBehavior) => setDraft(updateDraft((current) => ({ ...current, tieBehavior }))),
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
          setStartError('This word set needs a group with at least 2 different words.');
          return;
        }
        const nextGame = createActiveGame({ ...draft, wordSetId: selectedSet.id }, selectedSet);
        if (!nextGame) {
          setStartError('Could not pick two different words from this set.');
          return;
        }
        setStartError(null);
        setGame(nextGame);
        setScreen('reveal');
      },
      markCurrentSeenAndAdvance: () => {
        setGame((current) => {
          if (!current || current.phase !== 'reveal') return current;
          const players = current.players.map((player, index) =>
            index === current.revealIndex ? { ...player, hasSeenWord: true } : player,
          );
          const nextIndex = current.revealIndex + 1;
          if (nextIndex >= players.length) {
            return { ...current, players, phase: 'discussion', revealIndex: players.length - 1 };
          }
          return { ...current, players, revealIndex: nextIndex };
        });
      },
      startVoting: () => {
        setGame((current) => (current ? { ...current, phase: 'voting', voteIndex: 0, votes: {} } : current));
        setScreen('voting');
      },
      castVote: (voterId, suspectIds) => {
        setGame((current) => {
          if (!current || current.phase !== 'voting') return current;
          const voter = current.players[current.voteIndex];
          if (!voter || voter.id !== voterId || current.votes[voterId]) return current;
          const unique = [...new Set(suspectIds)].filter(
            (id) => id !== voterId && current.players.some((player) => player.id === id),
          );
          if (unique.length !== current.suspectsPerVote) return current;
          const votes = { ...current.votes, [voterId]: unique };
          if (Object.keys(votes).length >= current.players.length) {
            return { ...current, votes, phase: 'results', voteIndex: current.players.length - 1 };
          }
          return { ...current, votes, voteIndex: current.voteIndex + 1 };
        });
      },
      revote: () => {
        setGame((current) =>
          current && current.phase === 'results' ? { ...current, phase: 'voting', voteIndex: 0, votes: {} } : current,
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
            suspectsPerVote: source.suspectsPerVote,
            tieBehavior: source.tieBehavior,
            wordSetId: set.id,
            players: source.players.map((player) => ({ id: player.id, name: player.name })),
          },
          set,
        );
        if (!nextGame) return;
        setGame(nextGame);
        setScreen('reveal');
      },
      newGame: () => {
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
  }, [customSets, draft, editingSet, editingSetId, game, screen, selectedSet, startError, wordSets]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used within GameProvider');
  return value;
}

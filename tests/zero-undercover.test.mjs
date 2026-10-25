import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let draftModule;
let createGameModule;
let resultsModule;
let pointsModule;
let builtinWordSet;

before(async () => {
  server = await createServer({
    configFile: 'vite.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  draftModule = await server.ssrLoadModule('/src/game/draft.ts');
  createGameModule = await server.ssrLoadModule('/src/game/createGame.ts');
  resultsModule = await server.ssrLoadModule('/src/game/results.ts');
  pointsModule = await server.ssrLoadModule('/src/game/sessionPoints.ts');
  ({ BUILTIN_WORD_SET: builtinWordSet } = await server.ssrLoadModule('/src/data/builtinWordSets.ts'));
});

after(async () => {
  await server?.close();
});

function makePlayer(id, role, overrides = {}) {
  return {
    id,
    name: id,
    role,
    word: role === 'civilian' ? 'Apple' : '',
    hasSeenWord: false,
    eliminated: false,
    individualWins: 0,
    ...overrides,
  };
}

test('role helpers preserve zero undercover and clamp the remaining roles sensibly', () => {
  assert.equal(draftModule.clampUndercoverCount(0, 4, 1), 0);
  assert.deepEqual(draftModule.balanceRoles(4, 0, 1), { undercoverCount: 0, doesntKnowCount: 1 });
  assert.deepEqual(draftModule.balanceRoles(4, 1, 3, 'doesntKnow'), { undercoverCount: 0, doesntKnowCount: 3 });
  assert.equal(draftModule.clampSuspects(4, 1, 4), 1);
  assert.equal(draftModule.clampSuspects(4, 2, 4), 2);
});

test('a saved zero-undercover draft loads without resetting the count', () => {
  const draft = {
    playerCount: 4,
    undercoverCount: 0,
    doesntKnowCount: 1,
    suspectsPerVote: 4,
    players: Array.from({ length: 4 }, (_, index) => ({ id: `p${index}`, name: `Player ${index + 1}` })),
  };
  globalThis.localStorage = { getItem: () => JSON.stringify(draft) };

  const loaded = draftModule.loadDraft();
  assert.equal(loaded.undercoverCount, 0);
  assert.equal(loaded.doesntKnowCount, 1);
  assert.equal(loaded.suspectsPerVote, 1);
});

test('game creation assigns civilians their shared word and never stores an undercover word for a player', () => {
  const players = Array.from({ length: 4 }, (_, index) => ({ id: `p${index}`, name: `Player ${index + 1}` }));
  const game = createGameModule.createActiveGame({
    playerCount: 4,
    undercoverCount: 0,
    doesntKnowCount: 1,
    suspectsPerVote: 1,
    tieBehavior: 'eliminate-none',
    showRoleDuringReveal: true,
    wordSetId: builtinWordSet.id,
    players,
  }, builtinWordSet);

  assert.ok(game);
  assert.equal(game.undercoverWord, '');
  assert.equal(game.players.filter((player) => player.role === 'civilian').length, 3);
  assert.equal(game.players.filter((player) => player.role === 'undercover').length, 0);
  assert.equal(game.players.filter((player) => player.role === 'doesntKnow').length, 1);
  for (const player of game.players) {
    assert.equal('undercoverWord' in player, false);
    assert.equal(player.word, player.role === 'doesntKnow' ? '' : game.civilianWord);
  }
});

test('zero-undercover games continue at the start and allow a vote with three active players', () => {
  const players = [
    makePlayer('c1', 'civilian'),
    makePlayer('c2', 'civilian'),
    makePlayer('c3', 'civilian'),
    makePlayer('dk', 'doesntKnow'),
  ];
  assert.deepEqual(resultsModule.evaluateGameState(players), { status: 'continue' });
  assert.equal(resultsModule.minActiveToContinue(players), 3);
  assert.equal(resultsModule.canVoteAgain([
    makePlayer('c1', 'civilian'),
    makePlayer('c2', 'civilian'),
    makePlayer('dk', 'doesntKnow'),
  ]), true);

  const eliminatedUndercoverGame = [
    makePlayer('c1', 'civilian'),
    makePlayer('c2', 'civilian'),
    makePlayer('dk', 'doesntKnow'),
    makePlayer('u', 'undercover', { eliminated: true }),
  ];
  assert.equal(resultsModule.canVoteAgain(eliminatedUndercoverGame), false);
});

test('zero-undercover win conditions require all Doesnt Know players out without a correct guess', () => {
  assert.deepEqual(resultsModule.evaluateGameState([
    makePlayer('c1', 'civilian'),
    makePlayer('c2', 'civilian'),
    makePlayer('dk', 'doesntKnow', { eliminated: true, doesntKnowGuess: 'incorrect' }),
  ]), { status: 'civilianWin' });

  assert.deepEqual(resultsModule.evaluateGameState([
    makePlayer('c1', 'civilian'),
    makePlayer('c2', 'civilian'),
    makePlayer('dk', 'doesntKnow', { eliminated: true, doesntKnowGuess: 'correct', individualWins: 1 }),
  ]), { status: 'continue' });
  assert.deepEqual(resultsModule.evaluateGameState([
    makePlayer('c1', 'civilian'),
    makePlayer('dk', 'doesntKnow'),
  ]), { status: 'continue' });

  assert.deepEqual(resultsModule.evaluateGameState([
    makePlayer('dk1', 'doesntKnow'),
    makePlayer('dk2', 'doesntKnow'),
    makePlayer('c1', 'civilian', { eliminated: true }),
  ]), { status: 'doesntKnowWin' });

  assert.deepEqual(resultsModule.evaluateGameState([
    makePlayer('dk1', 'doesntKnow'),
    makePlayer('dk2', 'doesntKnow', { eliminated: true, doesntKnowGuess: 'correct' }),
    makePlayer('c1', 'civilian', { eliminated: true }),
  ]), { status: 'continue' });

  assert.deepEqual(resultsModule.evaluateGameState([
    makePlayer('c1', 'civilian'),
    makePlayer('dk', 'doesntKnow', { eliminated: true, doesntKnowGuess: 'correct' }),
    makePlayer('u', 'undercover', { eliminated: true }),
  ]), { status: 'civilianWin' });

  assert.notDeepEqual(resultsModule.evaluateGameState([
    makePlayer('c1', 'civilian'),
    makePlayer('dk1', 'doesntKnow'),
  ]), { status: 'draw' });
});

test('zero-undercover round points award only the existing civilian and Doesnt Know faction points', () => {
  const civiliansWin = {
    players: [
      makePlayer('c1', 'civilian'),
      makePlayer('c2', 'civilian'),
      makePlayer('dk', 'doesntKnow', { eliminated: true, doesntKnowGuess: 'incorrect' }),
    ],
  };
  assert.deepEqual(pointsModule.roundPointsFor(civiliansWin), { c1: 1, c2: 1, dk: 0 });

  const doesntKnowWin = {
    players: [
      makePlayer('dk1', 'doesntKnow'),
      makePlayer('dk2', 'doesntKnow'),
      makePlayer('c1', 'civilian', { eliminated: true }),
    ],
  };
  assert.deepEqual(pointsModule.roundPointsFor(doesntKnowWin), { dk1: 2, dk2: 2, c1: 0 });
});

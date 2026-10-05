import type { ActiveGame } from '../types/game';

export interface VoteLeader {
  id: string;
  name: string;
  votes: number;
}

export interface VoteTally {
  counts: Record<string, number>;
  topCount: number;
  leaders: VoteLeader[];
  tied: boolean;
  eliminatedIds: string[];
  undercoverIds: string[];
  civiliansWin: boolean;
}

export function tallyVotes(game: ActiveGame): VoteTally {
  const counts: Record<string, number> = {};
  for (const player of game.players) counts[player.id] = 0;
  for (const [voterId, suspects] of Object.entries(game.votes)) {
    for (const suspectId of suspects) {
      if (suspectId !== voterId && suspectId in counts) counts[suspectId] += 1;
    }
  }
  const topCount = Math.max(0, ...Object.values(counts));
  const leaders = game.players
    .filter((player) => topCount > 0 && counts[player.id] === topCount)
    .map((player) => ({ id: player.id, name: player.name, votes: counts[player.id] ?? 0 }));
  const tied = leaders.length > 1;
  const eliminatedIds = tied ? [] : leaders.map((leader) => leader.id);
  const undercoverIds = game.players.filter((player) => player.role === 'undercover').map((player) => player.id);
  const civiliansWin = eliminatedIds.length > 0 && undercoverIds.every((id) => eliminatedIds.includes(id));
  return { counts, topCount, leaders, tied, eliminatedIds, undercoverIds, civiliansWin };
}

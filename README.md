# Undercover

A mobile-first, pass-and-play party game. One phone is shared by everyone. Players talk in real life. The site only assigns secret words, reveals them privately, and runs the vote.

There is no account, chat, or server. The game stays on the device.

## Play

```bash
npm install
npm run dev
```

Open the local address Vite prints. On a phone, use the same Wi-Fi and the network address.

```bash
npm run build
npm run preview
```

## How a round works

1. Name the players and pick a word set.
2. Pass the phone. Each player sees only their own word.
3. Talk out loud. Describe the word. Do not say it.
4. Vote for who does not match, or skip.
5. The top vote is eliminated. A tie or a skip eliminates nobody.
6. Keep voting until a side wins, or continue the session for another round.

Roles:

| Role | What they receive |
| --- | --- |
| Civilian | The shared civilian word |
| Undercover | A different but related word |
| Doesn't Know | No word. They must figure it out from the talk |

Suggested undercover count: 1 for 3–5 players, 1–2 for 6–10, 2–3 for 11–20. The host can still choose a valid number.

## Win rules

Only players still in the round are counted.

1. One Civilian, one Undercover, and one Doesn't Know is a draw.
2. No Undercover left, and at least one Civilian left, is a Civilian win.
3. Only Doesn't Know players left is a Doesn't Know win.
4. Undercover count at least equal to the Civilian count is an Undercover win.
5. Otherwise the vote continues.

A new vote needs 3 players, or 4 if a Doesn't Know player is still in. A vote never starts with 2 players.

A voted-out Doesn't Know player gets one guess at the civilian word. A correct guess is an individual win. It does not end the round.

Skip Vote is a choice, not a player. If Skip wins or ties for the top, nobody is eliminated.

## Session points

A new game from the menu starts everyone at 0.

| Result | Points |
| --- | --- |
| Civilian win | +1 to every Civilian |
| Undercover win | +2 to every Undercover |
| Doesn't Know faction win | +2 to each Doesn't Know player still in |
| Draw | no points |

Continue Game keeps the names and scores, then deals a new round. Back to the main menu asks first, then clears the session.

## Word sets

A group is a list of related words. The game picks two different words from one group: one for civilians, one for undercover.

Each group needs at least 2 different words. Empty words and repeats are ignored. Limits on import: 80 groups, 12 words in a group, 32 characters per word, 40 characters for the set name.

Preferred file:

```json
{
  "version": 1,
  "id": "animals-01",
  "name": "Animals",
  "description": "Related animals for Undercover.",
  "groups": [
    {
      "id": "pets",
      "label": "Pets",
      "words": ["Cat", "Dog", "Rabbit"]
    },
    {
      "id": "sea",
      "label": "Sea",
      "words": ["Shark", "Dolphin"]
    }
  ]
}
```

A list of sets, or `{ "sets": [ ... ] }`, also imports. A shorthand map works too:

```json
{
  "pets": ["Cat", "Dog", "Rabbit"],
  "sea": ["Shark", "Dolphin"]
}
```

Import and export are on the word-set screen. Nothing is uploaded.

## Example prompt for an AI word set

Copy this into another assistant, then import the JSON it returns.

```text
Create a JSON word set for the party game Undercover.

Rules:
- Return only valid JSON. No markdown.
- Use this shape:
  {
    "version": 1,
    "id": "short-kebab-id",
    "name": "Set name",
    "description": "One sentence.",
    "groups": [
      { "id": "group-id", "label": "Group label", "words": ["Word", "Word"] }
    ]
  }
- Make 20 groups.
- Every group needs 2 to 4 related words.
- Words in a group must be different, but close enough that a short hint could fit either word.
- Do not use the same word in more than one group.
- Keep every word under 32 characters.
- Keep the set name under 40 characters.
- Use title case.
- Audience: a family party. No violence, romance, or adult topics.
- Theme: everyday objects, food, animals, places, and school items.
```

## Languages and theme

English and Bahasa Indonesia are in Settings. The accent color is saved on the device and does not reset the round. Role colors stay fixed.

## Privacy

Secret words are shown only on that player's reveal, and on the final results. They are not put in the address bar. An in-progress round is kept in session storage so a refresh can resume with the word hidden. Leaving to the main menu clears the round and, after confirmation, the session score.

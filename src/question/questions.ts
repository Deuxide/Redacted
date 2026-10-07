export interface QuestionGroup {
  id: string;
  civilian: { en: string; id: string };
  undercover: { en: string; id: string };
}

export const QUESTION_GROUPS: QuestionGroup[] = [
  { id: 'afternoon', civilian: { en: 'What is the best way to spend a free afternoon?', id: 'Apa cara terbaik menghabiskan sore yang senggang?' }, undercover: { en: 'What is the best way to spend a free evening?', id: 'Apa cara terbaik menghabiskan malam yang senggang?' } },
  { id: 'trip', civilian: { en: 'Where would you go for a short trip?', id: 'Ke mana kamu pergi untuk perjalanan singkat?' }, undercover: { en: 'Where would you go for a long holiday?', id: 'Ke mana kamu pergi untuk liburan panjang?' } },
  { id: 'gift', civilian: { en: 'What gift would you give a friend?', id: 'Hadiah apa yang kamu berikan untuk teman?' }, undercover: { en: 'What gift would you give a teacher?', id: 'Hadiah apa yang kamu berikan untuk guru?' } },
  { id: 'snack', civilian: { en: 'What snack is best for a movie?', id: 'Camilan apa yang paling cocok untuk menonton film?' }, undercover: { en: 'What snack is best for a picnic?', id: 'Camilan apa yang paling cocok untuk piknik?' } },
  { id: 'weather', civilian: { en: 'What do you do on a rainy day?', id: 'Apa yang kamu lakukan saat hujan?' }, undercover: { en: 'What do you do on a very hot day?', id: 'Apa yang kamu lakukan saat hari sangat panas?' } },
  { id: 'school', civilian: { en: 'What is your favorite school subject?', id: 'Pelajaran sekolah apa yang paling kamu suka?' }, undercover: { en: 'What school subject do you find hardest?', id: 'Pelajaran sekolah apa yang paling sulit untukmu?' } },
];

export interface ChallengeCard {
  id: string;
  text: string;
  category: 'action' | 'social' | 'drinking' | 'fun';
  intensity: 1 | 2 | 3;
}

export const challengeCards: ChallengeCard[] = [
  // ── DRINKING ── intensity 1
  {
    id: 'd1-01',
    text: 'Take a sip for every year older you are than the youngest person here.',
    category: 'drinking',
    intensity: 1,
  },
  {
    id: 'd1-02',
    text: 'Everyone with a tattoo takes a drink.',
    category: 'drinking',
    intensity: 1,
  },
  {
    id: 'd1-03',
    text: 'If you can name all 50 US states in 30 seconds, everyone else drinks. If you fail, you drink.',
    category: 'drinking',
    intensity: 1,
  },
  {
    id: 'd1-04',
    text: 'Toast to the host! Everyone drinks.',
    category: 'drinking',
    intensity: 1,
  },
  {
    id: 'd1-05',
    text: 'The person who has traveled to the most countries drinks. If there\'s a tie, both drink.',
    category: 'drinking',
    intensity: 1,
  },
  {
    id: 'd1-06',
    text: 'Whoever has been awake the longest drinks.',
    category: 'drinking',
    intensity: 1,
  },
  {
    id: 'd1-07',
    text: 'The last person to check their phone drinks.',
    category: 'drinking',
    intensity: 1,
  },

  // ── DRINKING ── intensity 2
  {
    id: 'd2-01',
    text: 'Waterfall! Everyone starts drinking. You can only stop when the person to your right stops.',
    category: 'drinking',
    intensity: 2,
  },
  {
    id: 'd2-02',
    text: 'The person to your left assigns two drinks — to anyone, including you.',
    category: 'drinking',
    intensity: 2,
  },
  {
    id: 'd2-03',
    text: 'Categories: name a category (e.g. "beer brands"). Go around the circle — first person who blanks drinks.',
    category: 'drinking',
    intensity: 2,
  },
  {
    id: 'd2-04',
    text: 'The person who last posted on Instagram drinks twice.',
    category: 'drinking',
    intensity: 2,
  },
  {
    id: 'd2-05',
    text: 'Thumb Master: put your thumb on the table whenever you want. Last person to notice drinks. You hold the power until someone else gets this card.',
    category: 'drinking',
    intensity: 2,
  },
  {
    id: 'd2-06',
    text: 'Make a rule that everyone must follow for the next 5 minutes. Anyone who breaks it drinks.',
    category: 'drinking',
    intensity: 2,
  },
  {
    id: 'd2-07',
    text: 'Bus Driver: flip a card. Red = sip, Black = give a sip. Keep going until you get it wrong — then drink the whole round.',
    category: 'drinking',
    intensity: 2,
  },
  {
    id: 'd2-08',
    text: 'The two people who have known each other the longest must drink together.',
    category: 'drinking',
    intensity: 2,
  },

  // ── DRINKING ── intensity 3
  {
    id: 'd3-01',
    text: 'High or Low? Guess whether the next person\'s birth month is higher or lower than yours. Wrong guess = 3 drinks.',
    category: 'drinking',
    intensity: 3,
  },
  {
    id: 'd3-02',
    text: 'The person who has slept the least this week must finish their drink.',
    category: 'drinking',
    intensity: 3,
  },
  {
    id: 'd3-03',
    text: 'Sentence game: build a story one word at a time around the circle. Whoever hesitates or ends the sentence drinks 3.',
    category: 'drinking',
    intensity: 3,
  },
  {
    id: 'd3-04',
    text: 'Power Hour tribute: everyone drinks for 10 full seconds simultaneously.',
    category: 'drinking',
    intensity: 3,
  },
  {
    id: 'd3-05',
    text: 'Reverse Waterfall — start from the left instead. Anyone who stops before the person to their LEFT stops takes 3 drinks.',
    category: 'drinking',
    intensity: 3,
  },

  // ── ACTION ── intensity 1
  {
    id: 'a1-01',
    text: 'Everyone switch seats!',
    category: 'action',
    intensity: 1,
  },
  {
    id: 'a1-02',
    text: 'Stand up and do 10 jumping jacks. First person to finish picks someone to drink.',
    category: 'action',
    intensity: 1,
  },
  {
    id: 'a1-03',
    text: 'Trade phones with the person to your right for the next 2 minutes.',
    category: 'action',
    intensity: 1,
  },
  {
    id: 'a1-04',
    text: 'Everyone put your left hand on someone else\'s shoulder — last person to do it drinks.',
    category: 'action',
    intensity: 1,
  },
  {
    id: 'a1-05',
    text: 'Take a photo with the person sitting furthest from you and post it to your story.',
    category: 'action',
    intensity: 1,
  },
  {
    id: 'a1-06',
    text: 'Swap one item of clothing with the person to your left. You\'re keeping it for 5 minutes.',
    category: 'action',
    intensity: 1,
  },
  {
    id: 'a1-07',
    text: 'Everyone stands up. Sit down if you\'ve never been to Europe. Last person standing drinks.',
    category: 'action',
    intensity: 1,
  },

  // ── ACTION ── intensity 2
  {
    id: 'a2-01',
    text: 'Mime something embarrassing that happened to you this year — no words allowed. First person to guess correctly gives out 2 drinks.',
    category: 'action',
    intensity: 2,
  },
  {
    id: 'a2-02',
    text: 'Flip Cup — split into two teams. Losers each drink.',
    category: 'action',
    intensity: 2,
  },
  {
    id: 'a2-03',
    text: 'Everyone write down the weirdest thing in their search history on a piece of paper. Read them all out — most voted weirdest drinks.',
    category: 'action',
    intensity: 2,
  },
  {
    id: 'a2-04',
    text: 'Impromptu speech! You have 30 seconds to give a convincing TED Talk on a topic the group picks. Audience votes thumbs up or down — thumbs down = drink.',
    category: 'action',
    intensity: 2,
  },
  {
    id: 'a2-05',
    text: 'Human knot! Everyone grab two different hands across the circle. Untangle without letting go. If you break the chain, the whole group drinks.',
    category: 'action',
    intensity: 2,
  },
  {
    id: 'a2-06',
    text: 'Speed round: go around the circle saying one thing you\'ve never told anyone here. You have 5 seconds each — hesitate and drink.',
    category: 'action',
    intensity: 2,
  },

  // ── ACTION ── intensity 3
  {
    id: 'a3-01',
    text: 'Finger on the nose! Everyone tap their nose. Last person to do it has to text someone in their contacts list a compliment — then drinks.',
    category: 'action',
    intensity: 3,
  },
  {
    id: 'a3-02',
    text: 'Call a friend not at the party and convince them the group is at a celebrity\'s house. Everyone listens. Couldn\'t keep a straight face? Drink.',
    category: 'action',
    intensity: 3,
  },
  {
    id: 'a3-03',
    text: 'Arm wrestle the person to your right. Loser drinks, winner picks someone else to drink.',
    category: 'action',
    intensity: 3,
  },
  {
    id: 'a3-04',
    text: 'Roast the person to your left in 30 seconds — no holding back. They rate it 1-10. Under 6? You drink.',
    category: 'action',
    intensity: 3,
  },
  {
    id: 'a3-05',
    text: 'Everyone do their best celebrity impression at the same time. Group votes on the best and worst. Worst impression drinks 3.',
    category: 'action',
    intensity: 3,
  },

  // ── SOCIAL ── intensity 1
  {
    id: 's1-01',
    text: 'Toast to someone in the room — say something genuinely nice about them.',
    category: 'social',
    intensity: 1,
  },
  {
    id: 's1-02',
    text: 'Go around the circle: everyone share the best thing that happened to them this week.',
    category: 'social',
    intensity: 1,
  },
  {
    id: 's1-03',
    text: 'Compliment the outfit of the person directly across from you.',
    category: 'social',
    intensity: 1,
  },
  {
    id: 's1-04',
    text: 'Everyone share a fun fact about themselves that they\'re pretty sure nobody here knows.',
    category: 'social',
    intensity: 1,
  },
  {
    id: 's1-05',
    text: 'The two people who met most recently introduce themselves to everyone as if they\'ve been best friends for 20 years.',
    category: 'social',
    intensity: 1,
  },
  {
    id: 's1-06',
    text: 'Give a shoutout to someone not at the party — tell everyone why they\'d fit in here.',
    category: 'social',
    intensity: 1,
  },

  // ── SOCIAL ── intensity 2
  {
    id: 's2-01',
    text: 'Hot Takes! Go around the circle — each person gives an unpopular opinion. Anyone who agrees with a hot take drinks.',
    category: 'social',
    intensity: 2,
  },
  {
    id: 's2-02',
    text: 'Two Truths and a Lie. Read your three statements — group votes on which is the lie. Fool the most people and pick someone to drink.',
    category: 'social',
    intensity: 2,
  },
  {
    id: 's2-03',
    text: 'The person to your left says something they\'ve always wanted to do but been too scared to. Everyone who\'d be scared too takes a drink.',
    category: 'social',
    intensity: 2,
  },
  {
    id: 's2-04',
    text: 'Rank the people here by who you\'d want to call at 3am in an emergency. Most votes = power to assign 2 drinks.',
    category: 'social',
    intensity: 2,
  },
  {
    id: 's2-05',
    text: 'Everyone secretly write down "the most [person here] thing" about each person. Read them all aloud — no names on the guesses.',
    category: 'social',
    intensity: 2,
  },
  {
    id: 's2-06',
    text: 'The person who last sent a meme in the group chat stands up and explains it to someone who wasn\'t in the chat.',
    category: 'social',
    intensity: 2,
  },
  {
    id: 's2-07',
    text: 'Debate round: two random people argue opposite sides of a ridiculous topic chosen by the group. 60 seconds each — group votes on the winner.',
    category: 'social',
    intensity: 2,
  },

  // ── SOCIAL ── intensity 3
  {
    id: 's3-01',
    text: 'Most likely to… The group picks a scenario. Everyone points at whoever they think is most likely — most votes drinks.',
    category: 'social',
    intensity: 3,
  },
  {
    id: 's3-02',
    text: 'Confessional: say something you\'ve never admitted out loud at a party before. The group decides if it earns 1 drink (mild) or 3 (wild).',
    category: 'social',
    intensity: 3,
  },
  {
    id: 's3-03',
    text: 'Anonymous questions: everyone writes a question for the group on their phone and passes it to the person on their right to read aloud. No skipping.',
    category: 'social',
    intensity: 3,
  },
  {
    id: 's3-04',
    text: 'Expose yourself: show the group your camera roll from exactly 2 years ago today. No cropping allowed.',
    category: 'social',
    intensity: 3,
  },
  {
    id: 's3-05',
    text: 'Speed dating mode: 60 seconds, everyone pairs up and asks each other the most interesting question they can think of. The worst question drinks.',
    category: 'social',
    intensity: 3,
  },

  // ── FUN ── intensity 1
  {
    id: 'f1-01',
    text: 'The person who last watched a reality TV show picks the next song.',
    category: 'fun',
    intensity: 1,
  },
  {
    id: 'f1-02',
    text: 'Emoji story: the person to your left texts you 5 emojis — you have to tell a story using all of them.',
    category: 'fun',
    intensity: 1,
  },
  {
    id: 'f1-03',
    text: 'Who in this room would survive a zombie apocalypse longest? Everyone vote — most votes picks a drink for someone.',
    category: 'fun',
    intensity: 1,
  },
  {
    id: 'f1-04',
    text: 'Name that tune: hum 5 seconds of any song — first to guess it gives out a drink.',
    category: 'fun',
    intensity: 1,
  },
  {
    id: 'f1-05',
    text: 'Everyone say their favorite movie at the same time. Whoever shares a movie with someone else drinks.',
    category: 'fun',
    intensity: 1,
  },
  {
    id: 'f1-06',
    text: 'Backwards name game: everyone say their full name backwards. Slowest one drinks.',
    category: 'fun',
    intensity: 1,
  },

  // ── FUN ── intensity 2
  {
    id: 'f2-01',
    text: 'Never Have I Ever: been kicked out of a bar. Everyone who has, drinks.',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-02',
    text: 'Never Have I Ever: lied about being busy to avoid going out. Drinkers must explain.',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-03',
    text: 'Accent challenge: everyone picks an accent and can only speak in it for the next 3 minutes. First person to break character drinks.',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-04',
    text: 'The person who last laughed at something they shouldn\'t have tells the story. Group decides if they drink 1 or 3.',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-05',
    text: 'Spicy prediction: write down something you predict will happen in this group in the next year. Read them aloud. Most dramatic prediction drinks (in honor).',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-06',
    text: 'The person who last texted you picks your next drink.',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-07',
    text: 'Soundtrack of your life: each person names a song that would play as their entrance music. Group votes on the best — winner picks someone to drink.',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-08',
    text: 'Alphabet game: pick a category (celebrities, cities, movies). Go around naming one per letter in order. Miss a letter or repeat = drink.',
    category: 'fun',
    intensity: 2,
  },
  {
    id: 'f2-09',
    text: 'Last screenshot game: everyone shows the last screenshot on their phone. Whoever\'s is the most embarrassing gets to assign 2 drinks.',
    category: 'fun',
    intensity: 2,
  },

  // ── FUN ── intensity 3
  {
    id: 'f3-01',
    text: 'Trivia blitz: first person to answer 3 trivia questions in a row (asked by the group) wins — everyone else drinks. If you answer wrong, you drink.',
    category: 'fun',
    intensity: 3,
  },
  {
    id: 'f3-02',
    text: 'Dance battle — pick your opponent. 30 seconds each, group votes. Loser drinks, winner picks 2 people to drink.',
    category: 'fun',
    intensity: 3,
  },
  {
    id: 'f3-03',
    text: 'Wikipedia roulette: open Wikipedia on your phone, go to random article, explain how it connects to the Power Hour. Funniest explanation picks someone to drink.',
    category: 'fun',
    intensity: 3,
  },
  {
    id: 'f3-04',
    text: 'The group picks a villain from a movie. Everyone has 45 seconds to argue that the villain was actually right. Best argument gets to skip their next drink.',
    category: 'fun',
    intensity: 3,
  },
  {
    id: 'f3-05',
    text: 'Alias round: everyone gets a new nickname from the person to their right. You must use that nickname for the rest of the game — first person to slip up drinks.',
    category: 'fun',
    intensity: 3,
  },
  {
    id: 'f3-06',
    text: 'Time capsule message: each person records a 15-second voice memo to their future self, to be played at the next group hangout. Most cringe at playback drinks.',
    category: 'fun',
    intensity: 3,
  },
];

/**
 * Returns a random unused ChallengeCard from the deck,
 * or null if all cards have been used.
 */
export function getRandomChallenge(usedIds: Set<string>): ChallengeCard | null {
  const available = challengeCards.filter((card) => !usedIds.has(card.id));
  if (available.length === 0) return null;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

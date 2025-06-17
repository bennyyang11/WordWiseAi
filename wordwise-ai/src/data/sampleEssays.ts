export const sampleEssays = [
  {
    id: 'essay-1',
    title: 'Technology in Education',
    type: 'argumentative' as const,
    content: `I think that technology is very good for education. It can help students learning more better and make the education more interesting. Many schools are now using computers and internet to teach their students.

However, there is also some problems with technology in education. Some students might become too dependent on it and don't learn to think by themselves. Also, not all students have access to good technology at home.

In conclusion, I believe that technology can be helpful for education if we use it in the right way. Teachers should guide students how to use technology properly and make sure that all students have equal opportunities to access it.`,
    targetWordCount: 500,
    difficulty: 'intermediate' as const
  },
  {
    id: 'essay-2',
    title: 'Climate Change Solutions',
    type: 'expository' as const,
    content: `Climate change is a big problem that affects everyone in the world. The temperature is getting more higher every year, and this causes many problems for animals and people.

There is several things we can do to help solve this problem. First, we should use less energy in our homes. We can turn off the lights when we don't need them and use public transportation instead of driving cars.

Another solution is to plant more trees. Trees help to clean the air and reduce the carbon dioxide. Governments should also make more strict laws about pollution.

In my opinion, everyone has to work together to solve this problem. If we all do our part, we can make the earth more healthy for future generations.`,
    targetWordCount: 400,
    difficulty: 'intermediate' as const
  },
  {
    id: 'essay-3',
    title: 'The Benefits of Learning a Second Language',
    type: 'argumentative' as const,
    content: `Learning an another language is one of the most valuable things a person can do. There are many reasons why people should learn more than one language.

First reason is that it opens up job opportunities. Many companies today work internationally, so they need employees who can speak different languages. A person who speaks multiple languages will have more better chances to get a good job.

Second, learning languages helps improve brain function. Studies shows that bilingual people are better at problem-solving and multitasking. It also can help prevent Alzheimer's disease in old age.

Furthermore, knowing another language allows people to understand different cultures. When you can speak someone's language, you can communicate with them more deeply and learn about their traditions and way of thinking.

In conclusion, I believe that everyone should try to learn at least one additional language. It provides practical benefits for career and also makes you a more understanding person.`,
    targetWordCount: 600,
    difficulty: 'advanced' as const
  }
];

export const commonMistakes = {
  grammar: [
    'Subject-verb disagreement (there is several things)',
    'Incorrect comparative forms (more better, more higher)',
    'Article usage (an another language)',
    'Verb form errors (help students learning)'
  ],
  vocabulary: [
    'Informal words in academic writing (very good → excellent)',
    'Simple words that could be academic (big → significant)',
    'Repetitive word choice (good used multiple times)'
  ],
  style: [
    'Contractions in formal writing (don\'t → do not)',
    'Informal transitions (First reason is that)',
    'Personal opinions without academic backing (I think, I believe)'
  ]
}; 
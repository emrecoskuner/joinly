export type UserComment = {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
};

export type UserProfile = {
  id: string;
  name: string;
  initials: string;
  shortInfo: string;
  rating: number;
  photoUrl: string;
  bio: string;
  interestLabels: string[];
  hostedCount: number;
  joinedCount: number;
  comments: UserComment[];
};

export const CURRENT_USER_ID = 'user-maya-ceylan';

export const mockUserProfiles: UserProfile[] = [
  {
    id: 'user-maya-ceylan',
    name: 'Maya Ceylan',
    initials: 'MC',
    shortInfo: 'Student, 21',
    rating: 4.3,
    photoUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    bio: 'I love small-group plans where everyone feels comfortable showing up as themselves. My favorite meetups are early coffee walks, reading sessions, and low-pressure wellness plans with thoughtful people.',
    interestLabels: ['Coffee', 'Food', 'Run', 'Walk', 'Reading', 'Wellness'],
    hostedCount: 12,
    joinedCount: 28,
    comments: [
      {
        id: 'maya-comment-1',
        reviewerName: 'Lina Park',
        rating: 4.8,
        text: 'Maya is one of the easiest hosts to trust. She sets a calm tone and makes everyone feel included right away.',
      },
      {
        id: 'maya-comment-2',
        reviewerName: 'Omar Kaya',
        rating: 4.2,
        text: 'Very reliable and thoughtful with details. The meetup felt safe, clear, and exactly as described.',
      },
    ],
  },
  {
    id: 'user-lina-park',
    name: 'Lina Park',
    initials: 'LP',
    shortInfo: 'Product Designer, 27',
    rating: 4.9,
    photoUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    bio: 'I host early-morning plans for people who like calm structure, kind energy, and a clear plan before the day begins.',
    interestLabels: ['Run', 'Coffee', 'Walk', 'Wellness'],
    hostedCount: 18,
    joinedCount: 14,
    comments: [
      {
        id: 'lina-comment-1',
        reviewerName: 'Maya Ceylan',
        rating: 4.9,
        text: 'Always thoughtful and organized. Lina makes active meetups feel easy to join.',
      },
    ],
  },
  {
    id: 'user-emir-demir',
    name: 'Emir Demir',
    initials: 'ED',
    shortInfo: 'Barista, 29',
    rating: 4.8,
    photoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    bio: 'I like hosting small coffee gatherings where everyone brings a favorite place, bean, or ritual to share.',
    interestLabels: ['Coffee', 'Food', 'Reading'],
    hostedCount: 11,
    joinedCount: 19,
    comments: [
      {
        id: 'emir-comment-1',
        reviewerName: 'Lena Hart',
        rating: 4.7,
        text: 'Warm host, good pacing, and always chooses a place where conversation feels easy.',
      },
    ],
  },
  {
    id: 'user-nora-chen',
    name: 'Nora Chen',
    initials: 'NC',
    shortInfo: 'Consultant, 30',
    rating: 4.7,
    photoUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    bio: 'I organize active plans that stay social, welcoming, and low-pressure for both regulars and first-timers.',
    interestLabels: ['Sport', 'Run', 'Wellness'],
    hostedCount: 16,
    joinedCount: 12,
    comments: [
      {
        id: 'nora-comment-1',
        reviewerName: 'Theo Park',
        rating: 4.8,
        text: 'Nora is excellent at keeping sports sessions inclusive and fun for mixed skill levels.',
      },
    ],
  },
  {
    id: 'user-mert-kaya',
    name: 'Mert Kaya',
    initials: 'MK',
    shortInfo: 'Creative Lead, 31',
    rating: 4.9,
    photoUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    bio: 'I host relaxed evening plans with a good crowd, thoughtful pacing, and enough structure for everyone to feel comfortable.',
    interestLabels: ['Food', 'Reading', 'Wellness'],
    hostedCount: 21,
    joinedCount: 17,
    comments: [
      {
        id: 'mert-comment-1',
        reviewerName: 'Aylin Demir',
        rating: 4.9,
        text: 'Mert creates very safe social energy. Great host if you want something low-pressure and polished.',
      },
    ],
  },
  {
    id: 'user-noah-chen',
    name: 'Noah Chen',
    initials: 'NC',
    shortInfo: 'Student, 24',
    rating: 4.7,
    photoUrl:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
    bio: 'Usually joins active and coffee plans. Friendly, respectful, and very easy to coordinate with.',
    interestLabels: ['Run', 'Coffee', 'Walk'],
    hostedCount: 2,
    joinedCount: 16,
    comments: [],
  },
  {
    id: 'user-aylin-demir',
    name: 'Aylin Demir',
    initials: 'AD',
    shortInfo: 'Marketing Intern, 23',
    rating: 4.8,
    photoUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80',
    bio: 'I gravitate toward calm social plans, especially coffee, food, and walk-based meetups.',
    interestLabels: ['Coffee', 'Food', 'Walk'],
    hostedCount: 4,
    joinedCount: 22,
    comments: [],
  },
  {
    id: 'user-lena-hart',
    name: 'Lena Hart',
    initials: 'LH',
    shortInfo: 'Editor, 28',
    rating: 4.7,
    photoUrl:
      'https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=900&q=80',
    bio: 'Often joins reading and coffee plans. I appreciate hosts who care about pacing and comfort.',
    interestLabels: ['Reading', 'Coffee', 'Food'],
    hostedCount: 3,
    joinedCount: 18,
    comments: [],
  },
  {
    id: 'user-theo-park',
    name: 'Theo Park',
    initials: 'TP',
    shortInfo: 'Engineer, 26',
    rating: 4.6,
    photoUrl:
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=900&q=80',
    bio: 'Usually joins sport and coffee plans. Easygoing, punctual, and good with mixed groups.',
    interestLabels: ['Sport', 'Run', 'Coffee'],
    hostedCount: 1,
    joinedCount: 20,
    comments: [],
  },
  {
    id: 'user-omar-kaya',
    name: 'Omar Kaya',
    initials: 'OK',
    shortInfo: 'Analyst, 29',
    rating: 4.8,
    photoUrl:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=900&q=80',
    bio: 'I join active plans with thoughtful hosts and usually bring a steady, reliable energy to the group.',
    interestLabels: ['Run', 'Sport', 'Wellness'],
    hostedCount: 5,
    joinedCount: 15,
    comments: [],
  },
  {
    id: 'user-mina-ates',
    name: 'Mina Ates',
    initials: 'MA',
    shortInfo: 'Student, 22',
    rating: 4.6,
    photoUrl:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    bio: 'Mostly into wellness and sport meetups with a friendly pace and clear communication.',
    interestLabels: ['Wellness', 'Sport', 'Walk'],
    hostedCount: 1,
    joinedCount: 13,
    comments: [],
  },
];

export function getMockUserProfileById(id: string) {
  return mockUserProfiles.find((profile) => profile.id === id);
}

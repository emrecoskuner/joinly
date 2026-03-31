import type { Activity } from '@/store/activity-store';
import { formatActivitySchedule } from '@/store/activity-store';

export const profileData = {
  name: 'Maya Ceylan',
  rating: 4.3,
  shortInfo: 'Student, 21',
  tagline: 'Quietly social, always on time, and happiest over good coffee.',
  photoUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
  hostedBaseCount: 12,
  joinedCount: 28,
  bio:
    'I love small-group plans where everyone feels comfortable showing up as themselves. My favorite meetups are early coffee walks, reading sessions, and low-pressure wellness plans with thoughtful people.',
  initialInterestCategoryIds: ['Coffee', 'Food', 'Run', 'Walk', 'Reading', 'Wellness'],
  comments: [
    {
      id: 'comment-1',
      reviewerName: 'Lina Park',
      rating: 4.8,
      text: 'Maya is one of the easiest hosts to trust. She sets a calm tone and makes everyone feel included right away.',
    },
    {
      id: 'comment-2',
      reviewerName: 'Omar Kaya',
      rating: 4.2,
      text: 'Very reliable and thoughtful with details. The meetup felt safe, clear, and exactly as described.',
    },
    {
      id: 'comment-3',
      reviewerName: 'Nora Chen',
      rating: 4.5,
      text: 'Warm energy, good communication, and a genuinely considerate host. I would happily join another activity.',
    },
  ],
};

export type ProfileActivityItem = {
  id: string;
  title: string;
  schedule: string;
  location: string;
  hostedByMe: boolean;
  joinedByMe: boolean;
  isPast: boolean;
  isUpcoming: boolean;
};

const profileActivities: ProfileActivityItem[] = [
  {
    id: 'profile-activity-1',
    title: 'Sunday coffee tasting in Moda',
    schedule: 'Sun, Apr 6 • 10:00',
    location: 'Walter’s Coffee Roastery',
    hostedByMe: true,
    joinedByMe: false,
    isPast: false,
    isUpcoming: true,
  },
  {
    id: 'profile-activity-2',
    title: 'Midweek reading hour at Minoa',
    schedule: 'Wed, Apr 9 • 19:30',
    location: 'Minoa Pera',
    hostedByMe: false,
    joinedByMe: true,
    isPast: false,
    isUpcoming: true,
  },
  {
    id: 'profile-activity-3',
    title: 'Bosphorus sunrise walk',
    schedule: 'Sat, Mar 22 • 08:15',
    location: 'Arnavutkoy Coast',
    hostedByMe: true,
    joinedByMe: false,
    isPast: true,
    isUpcoming: false,
  },
  {
    id: 'profile-activity-4',
    title: 'Balat brunch table',
    schedule: 'Sun, Mar 16 • 11:00',
    location: 'Forno Balat',
    hostedByMe: true,
    joinedByMe: false,
    isPast: true,
    isUpcoming: false,
  },
  {
    id: 'profile-activity-5',
    title: 'Evening reformer session',
    schedule: 'Thu, Mar 20 • 18:45',
    location: 'NisantasI Studio',
    hostedByMe: false,
    joinedByMe: true,
    isPast: true,
    isUpcoming: false,
  },
  {
    id: 'profile-activity-6',
    title: 'Karakoy dinner club',
    schedule: 'Fri, Mar 14 • 20:00',
    location: 'Karakoy Lokantasi',
    hostedByMe: false,
    joinedByMe: true,
    isPast: true,
    isUpcoming: false,
  },
];

export function getProfileActivityCollections(createdActivities: Activity[]) {
  const combinedActivities = [
    ...createdActivities.map((activity) => mapCreatedActivityToProfileItem(activity)),
    ...profileActivities,
  ];

  return {
    upcoming: combinedActivities.filter(
      (activity) =>
        (activity.hostedByMe && activity.isUpcoming) || (activity.joinedByMe && activity.isUpcoming)
    ),
    hostedHistory: combinedActivities.filter((activity) => activity.hostedByMe && activity.isPast),
    pastJoined: combinedActivities.filter((activity) => activity.joinedByMe && activity.isPast),
  };
}

function mapCreatedActivityToProfileItem(activity: Activity): ProfileActivityItem {
  const activityDate = new Date(activity.date);
  const isUpcoming = activityDate.getTime() >= Date.now();

  return {
    id: activity.id,
    title: activity.title,
    schedule: formatActivitySchedule(activity),
    location: activity.location,
    hostedByMe: true,
    joinedByMe: false,
    isPast: !isUpcoming,
    isUpcoming,
  };
}

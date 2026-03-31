import type { Activity } from '@/store/activity-store';

export type ActivityHubItem = {
  id: string;
  title: string;
  dateTimeIso: string;
  timeLabel: string;
  shortLocation: string;
  hostedByMe: boolean;
  joinedByMe: boolean;
  isPending: boolean;
  isPast: boolean;
  participantCount?: number;
  hostName?: string;
  hostInitials?: string;
  detailRoute: '/activity/[id]' | '/event/[id]';
};

const mockActivityHubItems: ActivityHubItem[] = [
  {
    id: 'event-1',
    title: 'Sunrise Run & Matcha',
    dateTimeIso: '2026-04-01T07:00:00.000Z',
    timeLabel: 'Today • 7:00 AM',
    shortLocation: 'Moda Coast Trail',
    hostedByMe: false,
    joinedByMe: true,
    isPending: false,
    isPast: false,
    participantCount: 8,
    hostName: 'Lina Park',
    hostInitials: 'LP',
    detailRoute: '/event/[id]',
  },
  {
    id: 'event-4',
    title: 'Rooftop Games & Good Talk',
    dateTimeIso: '2026-04-02T20:00:00.000Z',
    timeLabel: 'Tomorrow • 8:00 PM',
    shortLocation: 'Cihangir Terrace',
    hostedByMe: false,
    joinedByMe: true,
    isPending: false,
    isPast: false,
    participantCount: 12,
    hostName: 'Mert Kaya',
    hostInitials: 'MK',
    detailRoute: '/event/[id]',
  },
  {
    id: 'event-2',
    title: 'Neighborhood Coffee Swap',
    dateTimeIso: '2026-04-01T11:30:00.000Z',
    timeLabel: 'Today • 11:30 AM',
    shortLocation: 'Karakoy Roasters',
    hostedByMe: false,
    joinedByMe: false,
    isPending: true,
    isPast: false,
    participantCount: 6,
    hostName: 'Emir Demir',
    hostInitials: 'ED',
    detailRoute: '/event/[id]',
  },
  {
    id: 'event-5',
    title: 'Seaside Reading Circle',
    dateTimeIso: '2026-03-18T18:30:00.000Z',
    timeLabel: 'Wed, Mar 18 • 18:30',
    shortLocation: 'Caddebostan Coast',
    hostedByMe: true,
    joinedByMe: false,
    isPending: false,
    isPast: true,
    participantCount: 5,
    detailRoute: '/event/[id]',
  },
  {
    id: 'event-6',
    title: 'Studio Stretch Session',
    dateTimeIso: '2026-03-10T19:00:00.000Z',
    timeLabel: 'Tue, Mar 10 • 19:00',
    shortLocation: 'Nisantasi Flow Studio',
    hostedByMe: false,
    joinedByMe: true,
    isPending: false,
    isPast: true,
    participantCount: 7,
    hostName: 'Mina Ates',
    hostInitials: 'MA',
    detailRoute: '/event/[id]',
  },
];

export function getActivityHubItems(createdActivities: Activity[]) {
  return [
    ...createdActivities.map((activity) => {
      const dateTimeIso = buildCreatedActivityDateTime(activity);
      const isPast = new Date(dateTimeIso).getTime() < Date.now();

      return {
        id: activity.id,
        title: activity.title,
        dateTimeIso,
        timeLabel: formatDateTimeLabel(dateTimeIso),
        shortLocation: activity.location,
        hostedByMe: true,
        joinedByMe: false,
        isPending: false,
        isPast,
        participantCount: activity.approvedParticipants.length,
        detailRoute: '/activity/[id]' as const,
      };
    }),
    ...mockActivityHubItems,
  ];
}

function buildCreatedActivityDateTime(activity: Activity) {
  const dateValue = new Date(activity.date);
  const timeValue = new Date(activity.time);

  dateValue.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);

  return dateValue.toISOString();
}

function formatDateTimeLabel(dateTimeIso: string) {
  const date = new Date(dateTimeIso);

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

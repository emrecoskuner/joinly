import { allEvents } from '@/components/home/mock-data';
import {
  buildCreatedActivityDateTime,
  type Activity,
  type ParticipationStatus,
  resolveEventParticipationStatus,
} from '@/store/activity-store';

export type ActivityHubItem = {
  id: string;
  title: string;
  dateTimeIso: string;
  timeLabel: string;
  shortLocation: string;
  participationStatus: Exclude<ParticipationStatus, 'none'>;
  isPast: boolean;
  participantCount?: number;
  hostName?: string;
  hostInitials?: string;
  detailRoute: '/activity/[id]' | '/event/[id]';
};

export function getActivityHubItems(
  createdActivities: Activity[] = [],
  participationByEventId: Record<string, Exclude<ParticipationStatus, 'hosting'>> = {}
) {
  const safeCreatedActivities = Array.isArray(createdActivities) ? createdActivities : [];
  const safeEvents = Array.isArray(allEvents) ? allEvents : [];

  return [
    ...safeCreatedActivities.map((activity) => {
      const dateTimeIso = buildCreatedActivityDateTime(activity);
      const isPast = new Date(dateTimeIso).getTime() < Date.now();

      return {
        id: activity.id,
        title: activity.title,
        dateTimeIso,
        timeLabel: formatDateTimeLabel(dateTimeIso),
        shortLocation: activity.location,
        participationStatus: 'hosting' as const,
        isPast,
        participantCount: activity.approvedParticipants.length,
        detailRoute: '/activity/[id]' as const,
      };
    }),
    ...safeEvents
      .map((event) => {
        const participationStatus = resolveEventParticipationStatus(event, participationByEventId);

        if (participationStatus === 'none') {
          return null;
        }

        return {
          id: event.id,
          title: event.title,
          dateTimeIso: event.dateTimeIso,
          timeLabel: `${event.dateLabel} • ${event.timeLabel}`,
          shortLocation: event.location,
          participationStatus,
          isPast: new Date(event.dateTimeIso).getTime() < Date.now(),
          participantCount: event.participantCount,
          hostName: event.hostName,
          hostInitials: event.hostInitials,
          detailRoute: '/event/[id]' as const,
        };
      })
      .filter((item): item is ActivityHubItem => item !== null),
  ];
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

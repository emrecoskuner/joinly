import type { EventItem } from '@/components/home/types';
import { getActivityTimeState, isHappeningNow, isPastActivity } from '@/lib/activity-time';
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
  isHappeningNow: boolean;
  participantCount?: number;
  hostName?: string;
  hostInitials?: string;
  detailRoute: '/activity/[id]' | '/event/[id]';
};

export function getActivityHubItems(
  events: EventItem[] = [],
  createdActivities: Activity[] = [],
  participationByEventId: Record<string, Exclude<ParticipationStatus, 'hosting'>> = {},
  currentUserId = '',
  currentTime = Date.now()
) {
  const safeCreatedActivities = Array.isArray(createdActivities) ? createdActivities : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const joinedItems: ActivityHubItem[] = [];

  safeEvents.forEach((event) => {
    const participationStatus = resolveEventParticipationStatus(
      event,
      participationByEventId,
      currentUserId
    );

    if (participationStatus === 'none') {
      return;
    }

    joinedItems.push({
      id: event.id,
      title: event.title,
      dateTimeIso: event.dateTimeIso,
      timeLabel: `${event.dateLabel} • ${event.timeLabel}`,
      shortLocation: event.location,
      participationStatus,
      isPast: isPastActivity({ startsAt: event.dateTimeIso, status: event.status }, currentTime),
      isHappeningNow: isHappeningNow(
        { startsAt: event.dateTimeIso, status: event.status },
        currentTime
      ),
      participantCount: event.participantCount,
      hostName: event.hostName,
      hostInitials: event.hostInitials,
      detailRoute: '/event/[id]',
    });
  });

  return [
    ...safeCreatedActivities.map((activity) => {
      const dateTimeIso = buildCreatedActivityDateTime(activity);
      const timeState = getActivityTimeState(
        { startsAt: dateTimeIso, status: activity.status },
        currentTime
      );

      return {
        id: activity.id,
        title: activity.title,
        dateTimeIso,
        timeLabel: formatDateTimeLabel(dateTimeIso),
        shortLocation: activity.location,
        participationStatus: 'hosting' as const,
        isPast: timeState === 'past',
        isHappeningNow: timeState === 'happening-now',
        participantCount: activity.approvedParticipants.length,
        detailRoute: '/activity/[id]' as const,
      };
    }),
    ...joinedItems,
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

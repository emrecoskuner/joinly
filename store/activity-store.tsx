import { createContext, type ReactNode, useContext, useState } from 'react';

import type { EventItem, PrivacyType } from '@/components/home/types';
import {
  CURRENT_USER_ID,
  getMockUserProfileById,
} from '@/components/profile/mock-user-profiles';

export type ApprovalMode = 'auto' | 'approval';
export type Visibility = 'public' | 'private';
export type Participant = {
  id: string;
  name: string;
  initials: string;
  rating: number;
};

export type ParticipationStatus = 'none' | 'pending' | 'joined' | 'hosting';
export type ActivityMessage = {
  id: string;
  activityId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  type: string;
  title: string;
  date: string;
  time: string;
  location: string;
  participantLimit: number;
  approvalMode: ApprovalMode;
  visibility: Visibility;
  description: string;
  createdAt: string;
  hostName: string;
  hostInitials: string;
  approvedParticipants: Participant[];
  pendingParticipants: Participant[];
};

type ActivityStoreValue = {
  currentUserId: string;
  createdActivities: Activity[];
  participationByEventId: Record<string, Exclude<ParticipationStatus, 'hosting'>>;
  messagesByActivityId: Record<string, ActivityMessage[]>;
  addActivity: (activity: Activity) => void;
  updateActivity: (activityId: string, updates: Partial<Activity>) => void;
  approveParticipant: (activityId: string, participantId: string) => boolean;
  rejectParticipant: (activityId: string, participantId: string) => void;
  removeParticipant: (activityId: string, participantId: string) => void;
  joinEvent: (eventId: string) => void;
  requestToJoinEvent: (eventId: string) => void;
  sendMessage: (activityId: string, text: string) => void;
};

const ActivityStoreContext = createContext<ActivityStoreValue | null>(null);

export function ActivityStoreProvider({ children }: { children: ReactNode }) {
  const [createdActivities, setCreatedActivities] = useState<Activity[]>([]);
  const [participationByEventId, setParticipationByEventId] = useState<
    Record<string, Exclude<ParticipationStatus, 'hosting'>>
  >({});
  const [messagesByActivityId, setMessagesByActivityId] = useState<Record<string, ActivityMessage[]>>(
    {}
  );

  const addActivity = (activity: Activity) => {
    setCreatedActivities((currentValue) => [activity, ...currentValue]);
  };

  const updateActivity = (activityId: string, updates: Partial<Activity>) => {
    setCreatedActivities((currentValue) =>
      currentValue.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              ...updates,
            }
          : activity
      )
    );
  };

  const approveParticipant = (activityId: string, participantId: string) => {
    let wasApproved = false;

    setCreatedActivities((currentValue) =>
      currentValue.map((activity) => {
        if (activity.id !== activityId) {
          return activity;
        }

        if (activity.approvedParticipants.length >= activity.participantLimit) {
          return activity;
        }

        const participant = activity.pendingParticipants.find((item) => item.id === participantId);

        if (!participant) {
          return activity;
        }

        wasApproved = true;

        return {
          ...activity,
          approvedParticipants: [...activity.approvedParticipants, participant],
          pendingParticipants: activity.pendingParticipants.filter((item) => item.id !== participantId),
        };
      })
    );

    return wasApproved;
  };

  const rejectParticipant = (activityId: string, participantId: string) => {
    setCreatedActivities((currentValue) =>
      currentValue.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              pendingParticipants: activity.pendingParticipants.filter((item) => item.id !== participantId),
            }
          : activity
      )
    );
  };

  const removeParticipant = (activityId: string, participantId: string) => {
    setCreatedActivities((currentValue) =>
      currentValue.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              approvedParticipants: activity.approvedParticipants.filter((item) => item.id !== participantId),
            }
          : activity
      )
    );
  };

  const joinEvent = (eventId: string) => {
    setParticipationByEventId((currentValue) => ({
      ...currentValue,
      [eventId]: 'joined',
    }));
  };

  const requestToJoinEvent = (eventId: string) => {
    setParticipationByEventId((currentValue) => ({
      ...currentValue,
      [eventId]: 'pending',
    }));
  };

  const sendMessage = (activityId: string, text: string) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    const currentUserProfile = getMockUserProfileById(CURRENT_USER_ID);

    setMessagesByActivityId((currentValue) => ({
      ...currentValue,
      [activityId]: [
        ...(currentValue[activityId] ?? []),
        {
          id: `${activityId}-${Date.now()}`,
          activityId,
          senderId: CURRENT_USER_ID,
          senderName: currentUserProfile?.name ?? 'You',
          senderAvatar: currentUserProfile?.photoUrl ?? '',
          text: trimmedText,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  return (
    <ActivityStoreContext.Provider
      value={{
        currentUserId: CURRENT_USER_ID,
        createdActivities,
        participationByEventId,
        messagesByActivityId,
        addActivity,
        updateActivity,
        approveParticipant,
        rejectParticipant,
        removeParticipant,
        joinEvent,
        requestToJoinEvent,
        sendMessage,
      }}>
      {children}
    </ActivityStoreContext.Provider>
  );
}

export function useActivityStore() {
  const contextValue = useContext(ActivityStoreContext);

  if (!contextValue) {
    throw new Error('useActivityStore must be used within an ActivityStoreProvider');
  }

  return contextValue;
}

export function mapActivityToEventItem(activity: Activity): EventItem {
  return {
    id: activity.id,
    title: activity.title,
    dateTimeIso: buildCreatedActivityDateTime(activity),
    category: activity.type,
    activityType: formatActivityType(activity.type),
    time: formatActivitySchedule(activity),
    dateLabel: formatDateLabel(new Date(activity.date)),
    timeLabel: formatTimeLabel(new Date(activity.time)),
    location: activity.location,
    description: activity.description,
    notes: activity.description,
    hostId: CURRENT_USER_ID,
    hostName: activity.hostName,
    hostInitials: activity.hostInitials,
    hostBio: 'Trusted Joinly host with a clear plan and a thoughtful group vibe.',
    hostPhotoUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    participantCount: activity.approvedParticipants.length,
    participantLimit: activity.participantLimit,
    participants: activity.approvedParticipants.map((participant) => ({
      id: participant.id,
      userId: participant.id,
      name: participant.name,
      initials: participant.initials,
      rating: participant.rating,
    })),
    privacyType: mapPrivacyType(activity),
    rating: 5,
    accentColor: getActivityAccentColor(activity.type),
  };
}

export function resolveEventParticipationStatus(
  event: Pick<EventItem, 'id' | 'hostId'>,
  participationByEventId: Record<string, Exclude<ParticipationStatus, 'hosting'>> = {}
): ParticipationStatus {
  if (event.hostId === CURRENT_USER_ID) {
    return 'hosting';
  }

  return participationByEventId[event.id] ?? 'none';
}

export function canAccessActivityChat(participationStatus: ParticipationStatus) {
  return participationStatus === 'joined' || participationStatus === 'hosting';
}

export function isActivityPast(dateTimeIso: string) {
  return new Date(dateTimeIso).getTime() < Date.now();
}

export function formatActivitySchedule(activity: Activity) {
  return `${formatDateLabel(new Date(activity.date))} • ${formatTimeLabel(new Date(activity.time))}`;
}

export function buildCreatedActivityDateTime(activity: Activity) {
  const dateValue = new Date(activity.date);
  const timeValue = new Date(activity.time);

  dateValue.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);

  return dateValue.toISOString();
}

export function getActivityAccentColor(type: string) {
  switch (type) {
    case 'Coffee':
      return '#8C5A3C';
    case 'Food':
      return '#C46D3A';
    case 'Run':
      return '#D9A441';
    case 'Walk':
      return '#5A7A62';
    case 'Reading':
      return '#6D5B8C';
    case 'Sport':
      return '#3F7C74';
    case 'Wellness':
      return '#6F9078';
    default:
      return '#6E6256';
  }
}

export function buildMockParticipants(participantLimit: number) {
  const approvedPool: Participant[] = [
    { id: 'approved-1', name: 'Aylin Demir', initials: 'AD', rating: 4.9 },
    { id: 'approved-2', name: 'Omar Kaya', initials: 'OK', rating: 4.8 },
    { id: 'approved-3', name: 'Lena Hart', initials: 'LH', rating: 4.7 },
  ];
  const pendingPool: Participant[] = [
    { id: 'pending-1', name: 'Noah Chen', initials: 'NC', rating: 4.8 },
    { id: 'pending-2', name: 'Mina Ates', initials: 'MA', rating: 4.6 },
    { id: 'pending-3', name: 'Theo Park', initials: 'TP', rating: 4.7 },
  ];
  const approvedCount = participantLimit <= 2 ? 1 : Math.min(2, participantLimit - 1);

  return {
    approvedParticipants: approvedPool.slice(0, approvedCount).map((participant, index) => ({
      ...participant,
      id: `${participant.id}-${index + 1}-${participantLimit}`,
    })),
    pendingParticipants: pendingPool.slice(0, 2).map((participant, index) => ({
      ...participant,
      id: `${participant.id}-${index + 1}-${participantLimit}`,
    })),
  };
}

function mapPrivacyType(activity: Activity): PrivacyType {
  if (activity.visibility === 'private') {
    return 'Private';
  }

  if (activity.approvalMode === 'approval') {
    return 'Invite-only';
  }

  return 'Public';
}

function formatActivityType(type: string) {
  switch (type) {
    case 'Coffee':
      return 'Coffee Meetup';
    case 'Food':
      return 'Food Meetup';
    case 'Run':
      return 'Running Club';
    case 'Walk':
      return 'Walk';
    case 'Reading':
      return 'Reading Circle';
    case 'Sport':
      return 'Sports';
    case 'Wellness':
      return 'Wellness Session';
    default:
      return type;
  }
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

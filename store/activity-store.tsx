import { createContext, type ReactNode, useContext, useState } from 'react';

import type { EventItem, PrivacyType } from '@/components/home/types';

export type ApprovalMode = 'auto' | 'approval';
export type Visibility = 'public' | 'private';
export type Participant = {
  id: string;
  name: string;
  initials: string;
  rating: number;
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
  createdActivities: Activity[];
  addActivity: (activity: Activity) => void;
  updateActivity: (activityId: string, updates: Partial<Activity>) => void;
  approveParticipant: (activityId: string, participantId: string) => boolean;
  rejectParticipant: (activityId: string, participantId: string) => void;
  removeParticipant: (activityId: string, participantId: string) => void;
};

const ActivityStoreContext = createContext<ActivityStoreValue | null>(null);

export function ActivityStoreProvider({ children }: { children: ReactNode }) {
  const [createdActivities, setCreatedActivities] = useState<Activity[]>([]);

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

  return (
    <ActivityStoreContext.Provider
      value={{
        createdActivities,
        addActivity,
        updateActivity,
        approveParticipant,
        rejectParticipant,
        removeParticipant,
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
    activityType: formatActivityType(activity.type),
    time: formatActivitySchedule(activity),
    location: activity.location,
    description: activity.description,
    hostName: activity.hostName,
    hostInitials: activity.hostInitials,
    participantCount: activity.approvedParticipants.length,
    privacyType: mapPrivacyType(activity),
    rating: 5,
    accentColor: getActivityAccentColor(activity.type),
  };
}

export function formatActivitySchedule(activity: Activity) {
  return `${formatDateLabel(new Date(activity.date))} • ${formatTimeLabel(new Date(activity.time))}`;
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

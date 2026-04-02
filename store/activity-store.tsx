import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import type { EventItem, PrivacyType } from '@/components/home/types';
import { useAuth } from '@/context/AuthContext';
import {
  createActivity as createActivityService,
  endActivity as endActivityService,
  getAccentColor,
  getActivities,
  type ActivityParticipant,
  type ActivityRecord,
  type ApprovalMode,
  type CreateActivityPayload,
  type ProfileSummary,
  type Visibility,
  updateActivity as updateActivityService,
} from '@/services/activities';
import {
  approveParticipant as approveParticipantService,
  joinOrRequestActivity,
  leaveActivity as leaveActivityService,
  rejectParticipant as rejectParticipantService,
  removeParticipant as removeParticipantService,
} from '@/services/participants';
import { useProfileStore } from '@/store/profile-store';

export type Participant = {
  id: string;
  userId?: string;
  name: string;
  initials: string;
  rating: number;
};

export type ParticipationStatus = 'none' | 'pending' | 'joined' | 'hosting';

export type Activity = {
  id: string;
  hostId?: string;
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
  hostBio?: string;
  hostPhotoUrl?: string;
  hostRating?: number;
  approvedParticipants: Participant[];
  pendingParticipants: Participant[];
};

type MutationResponse = {
  error: Error | null;
};

type ActivityStoreValue = {
  currentUserId: string;
  currentUserParticipant: Participant | null;
  browseEvents: EventItem[];
  createdActivities: Activity[];
  participationByEventId: Record<string, Exclude<ParticipationStatus, 'hosting'>>;
  endedActivitiesById: Record<string, EventItem>;
  isLoadingActivities: boolean;
  refreshActivities: () => Promise<void>;
  addActivity: (activity: Activity) => Promise<MutationResponse>;
  updateActivity: (activityId: string, updates: Partial<Activity>) => Promise<MutationResponse>;
  approveParticipant: (activityId: string, participantId: string) => Promise<boolean>;
  rejectParticipant: (activityId: string, participantId: string) => Promise<MutationResponse>;
  removeParticipant: (activityId: string, participantId: string) => Promise<MutationResponse>;
  joinEvent: (eventId: string) => Promise<MutationResponse>;
  requestToJoinEvent: (eventId: string) => Promise<MutationResponse>;
  leaveActivity: (eventId: string) => Promise<MutationResponse>;
  endActivity: (event: EventItem) => Promise<MutationResponse>;
};

const ActivityStoreContext = createContext<ActivityStoreValue | null>(null);

export function ActivityStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfileStore();
  const currentUserId = user?.id ?? '';
  const currentUserProfile = useMemo(
    () =>
      profile
        ? ({
            id: profile.id,
            fullName: profile.fullName,
            initials: profile.initials,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            rating: profile.ratingAvg,
          } satisfies ProfileSummary)
        : null,
    [profile]
  );
  const currentUserParticipant = useMemo(
    () =>
      currentUserProfile
        ? {
            id: currentUserProfile.id,
            userId: currentUserProfile.id,
            name: currentUserProfile.fullName,
            initials: currentUserProfile.initials,
            rating: currentUserProfile.rating,
          }
        : null,
    [currentUserProfile]
  );
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([]);
  const [endedActivitiesById, setEndedActivitiesById] = useState<Record<string, EventItem>>({});
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const refreshActivities = async () => {
    setIsLoadingActivities(true);
    const { data, error } = await getActivities(currentUserId || undefined);

    if (error) {
      console.log('refreshActivities error', error);
      setActivityRecords([]);
      setIsLoadingActivities(false);
      return;
    }

    setActivityRecords(data ?? []);
    setIsLoadingActivities(false);
  };

  useEffect(() => {
    void refreshActivities();
  }, [currentUserId]);

  const createdActivities = useMemo(
    () =>
      activityRecords
        .filter((activity) => activity.hostId === currentUserId)
        .map(mapActivityRecordToManagedActivity),
    [activityRecords, currentUserId]
  );

  const browseEvents = useMemo(
    () =>
      activityRecords
        .filter((activity) => activity.hostId !== currentUserId)
        .map(mapActivityRecordToEventItem),
    [activityRecords, currentUserId]
  );

  const participationByEventId = useMemo(
    () =>
      activityRecords.reduce<Record<string, Exclude<ParticipationStatus, 'hosting'>>>((acc, activity) => {
        if (!currentUserId || activity.hostId === currentUserId || activity.currentUserStatus === 'none') {
          return acc;
        }

        acc[activity.id] = activity.currentUserStatus;
        return acc;
      }, {}),
    [activityRecords, currentUserId]
  );

  const addActivity = async (activity: Activity) => {
    if (!currentUserId) {
      return { error: new Error('You must be signed in to create an activity.') };
    }

    const startsAt = buildCreatedActivityDateTime(activity);
    const { error } = await createActivityService({
      title: activity.title,
      description: activity.description,
      type: activity.type,
      locationName: activity.location,
      startsAt,
      capacity: activity.participantLimit,
      endsAt: null,
      approvalMode: activity.approvalMode,
      visibility: activity.visibility,
      hostId: currentUserId,
    });

    if (error) {
      console.log('addActivity error', error);
      return { error };
    }

    await refreshActivities();
    return { error: null };
  };

  const updateActivity = async (activityId: string, updates: Partial<Activity>) => {
    const currentActivity = createdActivities.find((activity) => activity.id === activityId);

    if (!currentActivity) {
      return { error: new Error('Activity not found.') };
    }

    const mergedActivity = {
      ...currentActivity,
      ...updates,
    };

    const { error } = await updateActivityService(activityId, {
      title: mergedActivity.title,
      description: mergedActivity.description,
      type: mergedActivity.type,
      locationName: mergedActivity.location,
      startsAt: buildCreatedActivityDateTime(mergedActivity),
      endsAt: null,
      capacity: mergedActivity.participantLimit,
      approvalMode: mergedActivity.approvalMode,
      visibility: mergedActivity.visibility,
    });

    if (error) {
      console.log('updateActivity error', error);
      return { error };
    }

    await refreshActivities();
    return { error: null };
  };

  const approveParticipant = async (activityId: string, participantId: string) => {
    const activity = activityRecords.find((item) => item.id === activityId);
    const participant = activity?.pendingParticipants.find((item) => item.id === participantId);

    if (!activity || !participant) {
      return false;
    }

    if (activity.approvedParticipants.length >= activity.participantLimit) {
      return false;
    }

    const { error } = await approveParticipantService(activityId, participant.userId);

    if (error) {
      console.log('approveParticipant error', error);
      return false;
    }

    await refreshActivities();
    return true;
  };

  const rejectParticipant = async (activityId: string, participantId: string) => {
    const participant = activityRecords
      .find((item) => item.id === activityId)
      ?.pendingParticipants.find((item) => item.id === participantId);

    if (!participant) {
      return { error: new Error('Participant not found.') };
    }

    const { error } = await rejectParticipantService(activityId, participant.userId);

    if (error) {
      console.log('rejectParticipant error', error);
      return { error };
    }

    await refreshActivities();
    return { error: null };
  };

  const removeParticipant = async (activityId: string, participantId: string) => {
    const participant = activityRecords
      .find((item) => item.id === activityId)
      ?.approvedParticipants.find((item) => item.id === participantId);

    if (!participant) {
      return { error: new Error('Participant not found.') };
    }

    const { error } = await removeParticipantService(activityId, participant.userId);

    if (error) {
      console.log('removeParticipant error', error);
      return { error };
    }

    await refreshActivities();
    return { error: null };
  };

  const joinEvent = async (eventId: string) => {
    if (!currentUserId) {
      return { error: new Error('You must be signed in to join an activity.') };
    }

    const activity = activityRecords.find((item) => item.id === eventId);

    if (!activity) {
      return { error: new Error('Activity not found.') };
    }

    const { error } = await joinOrRequestActivity(eventId, currentUserId, activity.approvalMode);

    if (error) {
      console.log('joinEvent error', error);
      return { error };
    }

    await refreshActivities();
    return { error: null };
  };

  const requestToJoinEvent = async (eventId: string) => {
    if (!currentUserId) {
      return { error: new Error('You must be signed in to request an activity.') };
    }

    const activity = activityRecords.find((item) => item.id === eventId);

    if (!activity) {
      return { error: new Error('Activity not found.') };
    }

    const { error } = await joinOrRequestActivity(eventId, currentUserId, 'manual');

    if (error) {
      console.log('requestToJoinEvent error', error);
      return { error };
    }

    await refreshActivities();
    return { error: null };
  };

  const leaveActivity = async (eventId: string) => {
    if (!currentUserId) {
      return { error: new Error('You must be signed in to leave an activity.') };
    }

    const { error } = await leaveActivityService(eventId, currentUserId);

    if (error) {
      console.log('leaveActivity error', error);
      return { error };
    }

    await refreshActivities();
    return { error: null };
  };

  const endActivity = async (event: EventItem) => {
    const { error } = await endActivityService(event.id);

    if (error) {
      console.log('endActivity error', error);
      return { error };
    }

    setEndedActivitiesById((currentValue) => ({
      ...currentValue,
      [event.id]: {
        ...event,
        participants: [],
        participantCount: 0,
      },
    }));
    await refreshActivities();
    return { error: null };
  };

  return (
    <ActivityStoreContext.Provider
      value={{
        currentUserId,
        currentUserParticipant,
        browseEvents,
        createdActivities,
        participationByEventId,
        endedActivitiesById,
        isLoadingActivities,
        refreshActivities,
        addActivity,
        updateActivity,
        approveParticipant,
        rejectParticipant,
        removeParticipant,
        joinEvent,
        requestToJoinEvent,
        leaveActivity,
        endActivity,
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
    activityType: activity.type,
    time: formatActivitySchedule(activity),
    dateLabel: formatDateLabel(new Date(activity.date)),
    timeLabel: formatTimeLabel(new Date(activity.time)),
    location: activity.location,
    description: activity.description,
    notes: activity.description,
    hostId: activity.hostId ?? '',
    hostName: activity.hostName,
    hostInitials: activity.hostInitials,
    hostBio: activity.hostBio ?? 'No bio yet',
    hostPhotoUrl: activity.hostPhotoUrl ?? '',
    participantCount: activity.approvedParticipants.length,
    participantLimit: activity.participantLimit,
    participants: activity.approvedParticipants.map((participant) => ({
      id: participant.id,
      userId: participant.userId ?? participant.id,
      name: participant.name,
      initials: participant.initials,
      rating: participant.rating,
    })),
    privacyType: mapPrivacyType(activity),
    rating: activity.hostRating ?? 0,
    accentColor: getAccentColor(activity.type),
  };
}

export function resolveEventParticipationStatus(
  event: Pick<EventItem, 'id' | 'hostId'>,
  participationByEventId: Record<string, Exclude<ParticipationStatus, 'hosting'>> = {},
  currentUserId = ''
): ParticipationStatus {
  if (currentUserId && event.hostId === currentUserId) {
    return 'hosting';
  }

  return participationByEventId[event.id] ?? 'none';
}

export function syncEventParticipationForCurrentUser(
  event: EventItem,
  participationByEventId: Record<string, Exclude<ParticipationStatus, 'hosting'>> = {},
  currentUserId = '',
  currentUserParticipant?: Participant | null
) {
  const participationStatus = resolveEventParticipationStatus(event, participationByEventId, currentUserId);

  if (participationStatus === 'hosting' || !currentUserId) {
    return event;
  }

  const participantsWithoutCurrentUser = event.participants.filter(
    (participant) => participant.userId !== currentUserId
  );

  if (participationStatus !== 'joined') {
    return {
      ...event,
      participants: participantsWithoutCurrentUser,
      participantCount: participantsWithoutCurrentUser.length,
    };
  }

  if (participantsWithoutCurrentUser.length !== event.participants.length || !currentUserParticipant) {
    return event;
  }

  const nextParticipants = [
    ...participantsWithoutCurrentUser,
    {
      id: `${event.id}-${currentUserId}`,
      userId: currentUserId,
      name: currentUserParticipant.name,
      initials: currentUserParticipant.initials,
      rating: currentUserParticipant.rating,
    },
  ];

  return {
    ...event,
    participants: nextParticipants,
    participantCount: nextParticipants.length,
  };
}

export function canAccessActivityChat(participationStatus: ParticipationStatus) {
  return participationStatus === 'joined' || participationStatus === 'hosting';
}

export function isActivityPast(dateTimeIso: string) {
  return new Date(dateTimeIso).getTime() < Date.now();
}

export function isActivityEnded(
  eventId: string,
  endedActivitiesById: Record<string, EventItem> = {}
) {
  return Boolean(endedActivitiesById[eventId]);
}

export function formatActivitySchedule(activity: Activity) {
  return `${formatDateLabel(new Date(activity.date))} • ${formatTimeLabel(new Date(activity.time))}`;
}

export function buildCreatedActivityDateTime(activity: Pick<Activity, 'date' | 'time'>) {
  const dateValue = new Date(activity.date);
  const timeValue = new Date(activity.time);

  dateValue.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);

  return dateValue.toISOString();
}

export function buildMockParticipants(_participantLimit?: number) {
  return {
    approvedParticipants: [],
    pendingParticipants: [],
  };
}

function mapActivityRecordToManagedActivity(activity: ActivityRecord): Activity {
  return {
    id: activity.id,
    hostId: activity.hostId,
    type: activity.category,
    title: activity.title,
    date: activity.startsAt,
    time: activity.startsAt,
    location: activity.location,
    participantLimit: activity.participantLimit,
    approvalMode: activity.approvalMode,
    visibility: activity.visibility,
    description: activity.description,
    createdAt: activity.createdAt,
    hostName: activity.host.fullName,
    hostInitials: activity.host.initials,
    hostBio: activity.host.bio,
    hostPhotoUrl: activity.host.avatarUrl,
    hostRating: activity.host.rating,
    approvedParticipants: activity.approvedParticipants.map(mapRemoteParticipantToParticipant),
    pendingParticipants: activity.pendingParticipants.map(mapRemoteParticipantToParticipant),
  };
}

function mapActivityRecordToEventItem(activity: ActivityRecord): EventItem {
  const eventDate = new Date(activity.startsAt);

  return {
    id: activity.id,
    title: activity.title,
    dateTimeIso: activity.startsAt,
    category: activity.category,
    activityType: activity.category,
    time: `${formatDateLabel(eventDate)} • ${formatTimeLabel(eventDate)}`,
    dateLabel: formatDateLabel(eventDate),
    timeLabel: formatTimeLabel(eventDate),
    location: activity.location,
    description: activity.description,
    notes: activity.description,
    hostId: activity.hostId,
    hostName: activity.host.fullName,
    hostInitials: activity.host.initials,
    hostBio: activity.host.bio,
    hostPhotoUrl: activity.host.avatarUrl,
    participantCount: activity.approvedParticipants.length,
    participantLimit: activity.participantLimit,
    participants: activity.approvedParticipants.map((participant) => ({
      id: participant.id,
      userId: participant.userId,
      name: participant.profile.fullName,
      initials: participant.profile.initials,
      rating: participant.profile.rating,
    })),
    privacyType: mapPrivacyType(activity),
    rating: activity.host.rating,
    accentColor: getAccentColor(activity.category),
  };
}

function mapRemoteParticipantToParticipant(participant: ActivityParticipant): Participant {
  return {
    id: participant.id,
    userId: participant.userId,
    name: participant.profile.fullName,
    initials: participant.profile.initials,
    rating: participant.profile.rating,
  };
}

function mapPrivacyType(activity: Pick<ActivityRecord, 'approvalMode' | 'visibility'> | Activity) {
  if (activity.visibility === 'private') {
    return 'Private' satisfies PrivacyType;
  }

  if (activity.approvalMode === 'manual') {
    return 'Invite-only' satisfies PrivacyType;
  }

  return 'Public' satisfies PrivacyType;
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

export const getActivityAccentColor = getAccentColor;

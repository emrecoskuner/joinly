import { getActivityCategoryByLabel } from '@/constants/activity-categories';
import { supabase } from '@/lib/supabase';

export type ApprovalMode = 'auto' | 'manual';
export type Visibility = 'public' | 'private';
export type ParticipantStatus = 'approved' | 'pending';

export type ProfileSummary = {
  id: string;
  fullName: string;
  initials: string;
  avatarUrl: string;
  bio: string;
  rating: number;
};

export type ActivityParticipant = {
  id: string;
  userId: string;
  status: ParticipantStatus;
  profile: ProfileSummary;
};

export type ActivityRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: string;
  endsAt?: string | null;
  participantLimit: number;
  approvalMode: ApprovalMode;
  visibility: Visibility;
  createdAt: string;
  hostId: string;
  host: ProfileSummary;
  approvedParticipants: ActivityParticipant[];
  pendingParticipants: ActivityParticipant[];
  currentUserStatus: 'none' | 'pending' | 'joined';
};

export type CreateActivityPayload = {
  title: string;
  description: string;
  type: string;
  locationName: string;
  startsAt: string;
  endsAt?: string | null;
  capacity: number;
  approvalMode: ApprovalMode;
  visibility: Visibility;
  hostId: string;
};

type ActivityRow = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at?: string | null;
  participant_limit: number | null;
  approval_mode: string | null;
  visibility: string | null;
  status: string | null;
  created_at: string | null;
  host_id: string | null;
};

type ParticipantRow = {
  id: string;
  activity_id: string;
  user_id: string;
  status: string | null;
  role?: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating_avg: number | null;
  rating_count?: number | null;
};

type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

export async function getActivities(currentUserId?: string): Promise<ServiceResponse<ActivityRecord[]>> {
  try {
    const { data: activityRows, error: activityError } = await supabase
      .from('activities')
      .select(
        'id, title, description, category:type, location:location_name, starts_at, ends_at, participant_limit:capacity, approval_mode, visibility, status, created_at, host_id'
      )
      .eq('status', 'active')
      .order('starts_at', { ascending: true });

    if (activityError) {
      console.log('getActivities.activities error', activityError);
      return { data: null, error: activityError };
    }

    const safeActivities = ((activityRows ?? []) as ActivityRow[]).filter(
      (activity): activity is ActivityRow & { host_id: string; starts_at: string } =>
        Boolean(activity.host_id && activity.starts_at)
    );

    if (safeActivities.length === 0) {
      return { data: [], error: null };
    }

    const activityIds = safeActivities.map((activity) => activity.id);
    const hostIds = [...new Set(safeActivities.map((activity) => activity.host_id))];

    const [{ data: participantRows, error: participantError }, { data: hostRows, error: hostError }] =
      await Promise.all([
        supabase
          .from('activity_participants')
          .select('id, activity_id, user_id, status, role')
          .in('activity_id', activityIds),
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio, rating_avg, rating_count')
          .in('id', hostIds),
      ]);

    if (participantError) {
      console.log('getActivities.participants error', participantError);
      return { data: null, error: participantError };
    }

    if (hostError) {
      console.log('getActivities.hosts error', hostError);
      return { data: null, error: hostError };
    }

    const safeParticipants = (participantRows ?? []) as ParticipantRow[];
    const participantUserIds = [...new Set(safeParticipants.map((participant) => participant.user_id))];

    const { data: participantProfileRows, error: participantProfileError } = participantUserIds.length
      ? await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio, rating_avg, rating_count')
          .in('id', participantUserIds)
      : { data: [], error: null };

    if (participantProfileError) {
      console.log('getActivities.participantProfiles error', participantProfileError);
      return { data: null, error: participantProfileError };
    }

    const profileMap = new Map<string, ProfileSummary>();

    [...((hostRows ?? []) as ProfileRow[]), ...((participantProfileRows ?? []) as ProfileRow[])].forEach(
      (profile) => {
        profileMap.set(profile.id, mapProfile(profile));
      }
    );

    const participantsByActivityId = new Map<string, ParticipantRow[]>();

    safeParticipants.forEach((participant) => {
      const activityParticipants = participantsByActivityId.get(participant.activity_id) ?? [];
      activityParticipants.push(participant);
      participantsByActivityId.set(participant.activity_id, activityParticipants);
    });

    const data = safeActivities.map((activity) => {
      const host = profileMap.get(activity.host_id) ?? buildFallbackProfile(activity.host_id);
      const rawParticipants = participantsByActivityId.get(activity.id) ?? [];
      const approvedParticipants = rawParticipants
        .filter(
          (participant) =>
            participant.user_id !== activity.host_id && isJoinedStatus(participant.status)
        )
        .map((participant) => mapParticipant(participant, profileMap));
      const pendingParticipants = rawParticipants
        .filter(
          (participant) =>
            participant.user_id !== activity.host_id && isPendingStatus(participant.status)
        )
        .map((participant) => mapParticipant(participant, profileMap));
      const currentUserParticipant = currentUserId
        ? rawParticipants.find((participant) => participant.user_id === currentUserId)
        : undefined;

      return {
        id: activity.id,
        title: activity.title ?? 'Untitled activity',
        description: activity.description ?? '',
        category: activity.category ?? 'Activity',
        location: activity.location ?? 'Location TBD',
        startsAt: activity.starts_at,
        endsAt: activity.ends_at ?? null,
        participantLimit: activity.participant_limit ?? Math.max(approvedParticipants.length, 1),
        approvalMode: normalizeApprovalMode(activity.approval_mode),
        visibility: normalizeVisibility(activity.visibility),
        createdAt: activity.created_at ?? new Date().toISOString(),
        hostId: activity.host_id,
        host,
        approvedParticipants,
        pendingParticipants,
        currentUserStatus: resolveCurrentUserStatus(currentUserId, activity.host_id, currentUserParticipant),
      };
    });

    return { data, error: null };
  } catch (error) {
    console.log('getActivities unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function createActivity(
  payload: CreateActivityPayload
): Promise<ServiceResponse<ActivityRecord>> {
  try {
    console.log('createActivity payload', payload);

    const { data: activityRow, error: activityError } = await supabase
      .from('activities')
      .insert({
        title: payload.title,
        description: payload.description,
        type: payload.type,
        location_name: payload.locationName,
        starts_at: payload.startsAt,
        ends_at: payload.endsAt ?? null,
        capacity: payload.capacity,
        approval_mode: normalizeApprovalMode(payload.approvalMode),
        visibility: payload.visibility,
        status: 'active',
        host_id: payload.hostId,
      })
      .select(
        'id, title, description, category:type, location:location_name, starts_at, ends_at, participant_limit:capacity, approval_mode, visibility, status, created_at, host_id'
      )
      .single();

    console.log('createActivity insert result', activityRow);

    if (activityError) {
      console.log('createActivity.insert error', activityError);
      return { data: null, error: activityError };
    }

    const { error: participantError } = await supabase.from('activity_participants').upsert(
      {
        activity_id: activityRow.id,
        user_id: payload.hostId,
        role: 'host',
        status: 'joined',
      },
      {
        onConflict: 'activity_id,user_id',
      }
    );

    if (participantError) {
      console.log('createActivity.hostParticipant error', participantError);
      return { data: null, error: participantError };
    }

    const { data, error } = await getActivities(payload.hostId);

    if (error) {
      return { data: null, error };
    }

    const createdActivity = data?.find((activity) => activity.id === activityRow.id) ?? null;

    return { data: createdActivity, error: createdActivity ? null : new Error('Activity was created but could not be reloaded.') };
  } catch (error) {
    console.log('createActivity unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function updateActivity(
  activityId: string,
  updates: Partial<CreateActivityPayload>
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const nextValues: Record<string, string | number | null> = {};

    if (typeof updates.title === 'string') {
      nextValues.title = updates.title;
    }
    if (typeof updates.description === 'string') {
      nextValues.description = updates.description;
    }
    if (typeof updates.type === 'string') {
      nextValues.type = updates.type;
    }
    if (typeof updates.locationName === 'string') {
      nextValues.location_name = updates.locationName;
    }
    if (typeof updates.startsAt === 'string') {
      nextValues.starts_at = updates.startsAt;
    }
    if (typeof updates.endsAt === 'string') {
      nextValues.ends_at = updates.endsAt;
    }
    if (updates.endsAt === null) {
      nextValues.ends_at = updates.endsAt;
    }
    if (typeof updates.capacity === 'number') {
      nextValues.capacity = updates.capacity;
    }
    if (typeof updates.approvalMode === 'string') {
      nextValues.approval_mode = normalizeApprovalMode(updates.approvalMode);
    }
    if (typeof updates.visibility === 'string') {
      nextValues.visibility = updates.visibility;
    }

    const { error } = await supabase.from('activities').update(nextValues).eq('id', activityId);

    if (error) {
      console.log('updateActivity error', error);
      return { data: null, error };
    }

    return { data: { id: activityId }, error: null };
  } catch (error) {
    console.log('updateActivity unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function endActivity(activityId: string): Promise<ServiceResponse<{ id: string }>> {
  try {
    const { error } = await supabase
      .from('activities')
      .update({
        status: 'ended',
      })
      .eq('id', activityId);

    if (error) {
      console.log('endActivity error', error);
      return { data: null, error };
    }

    return { data: { id: activityId }, error: null };
  } catch (error) {
    console.log('endActivity unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

function mapProfile(profile: ProfileRow): ProfileSummary {
  const fullName = profile.full_name?.trim() || 'Joinly Member';

  return {
    id: profile.id,
    fullName,
    initials: getInitials(fullName),
    avatarUrl: profile.avatar_url ?? '',
    bio: profile.bio ?? 'Joinly member',
    rating: profile.rating_avg ?? 5,
  };
}

function mapParticipant(
  participant: ParticipantRow,
  profileMap: Map<string, ProfileSummary>
): ActivityParticipant {
  return {
    id: participant.id,
    userId: participant.user_id,
    status: participant.status === 'pending' ? 'pending' : 'approved',
    profile: profileMap.get(participant.user_id) ?? buildFallbackProfile(participant.user_id),
  };
}

function resolveCurrentUserStatus(
  currentUserId: string | undefined,
  hostId: string,
  currentUserParticipant?: ParticipantRow
): 'none' | 'pending' | 'joined' {
  if (!currentUserId || currentUserId === hostId) {
    return 'none';
  }

  if (!currentUserParticipant) {
    return 'none';
  }

  return isPendingStatus(currentUserParticipant.status) ? 'pending' : 'joined';
}

function isJoinedStatus(status: string | null) {
  return status === 'joined' || status === 'approved';
}

function isPendingStatus(status: string | null) {
  return status === 'pending' || status === 'requested';
}

function buildFallbackProfile(id: string): ProfileSummary {
  const fullName = 'Joinly Member';

  return {
    id,
    fullName,
    initials: getInitials(fullName),
    avatarUrl: '',
    bio: 'Joinly member',
    rating: 5,
  };
}

function getInitials(fullName: string) {
  const parts = fullName
    .split(' ')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'JM';
  }

  return parts.map((value) => value[0]?.toUpperCase() ?? '').join('');
}

function normalizeApprovalMode(value: string | null): ApprovalMode {
  return value === 'auto' ? 'auto' : 'manual';
}

function normalizeVisibility(value: string | null): Visibility {
  return value === 'private' ? 'private' : 'public';
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown service error');
}

export function getAccentColor(category: string) {
  return getActivityCategoryByLabel(category).color;
}

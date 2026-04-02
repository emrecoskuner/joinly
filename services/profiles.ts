import { supabase } from '@/lib/supabase';

export type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  age: number | null;
  occupation: string | null;
  interests: string[] | null;
  rating_avg: number | null;
  rating_count: number | null;
  hosted_count: number | null;
  joined_count: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProfileRecord = {
  id: string;
  fullName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  age: number | null;
  occupation: string;
  interests: string[];
  ratingAvg: number;
  ratingCount: number;
  hostedCount: number;
  joinedCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  initials: string;
  isComplete: boolean;
};

export type ProfileUpdatePayload = {
  fullName: string;
  username: string;
  bio: string;
  age: number | null;
  occupation: string;
  interests: string[];
  avatarUrl: string;
};

export type ProfileActivityItem = {
  id: string;
  title: string;
  startsAt: string;
  schedule: string;
  location: string;
  hostedByMe: boolean;
  joinedByMe: boolean;
  isPast: boolean;
  isUpcoming: boolean;
};

type ActivityRow = {
  id: string;
  title: string | null;
  location_name: string | null;
  starts_at: string | null;
  status: string | null;
  host_id: string | null;
};

type ActivityParticipantRow = {
  activity_id: string;
  role: string | null;
};

type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

const PROFILE_SELECT =
  'id, full_name, username, bio, avatar_url, age, occupation, interests, rating_avg, rating_count, hosted_count, joined_count, created_at, updated_at';

export async function getCurrentProfile(userId: string): Promise<ServiceResponse<ProfileRecord>> {
  return getProfileById(userId);
}

export async function getProfileById(userId: string): Promise<ServiceResponse<ProfileRecord>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .maybeSingle<ProfileRow>();

    if (error) {
      console.log('getProfileById error', error);
      return { data: null, error };
    }

    if (!data) {
      return { data: buildEmptyProfile(userId), error: null };
    }

    return { data: mapProfileRow(data), error: null };
  } catch (error) {
    console.log('getProfileById unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function updateProfile(
  userId: string,
  payload: ProfileUpdatePayload
): Promise<ServiceResponse<ProfileRecord>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: normalizeNullableText(payload.fullName),
          username: normalizeUsername(payload.username),
          bio: normalizeNullableText(payload.bio),
          age: payload.age,
          occupation: normalizeNullableText(payload.occupation),
          interests: payload.interests,
          avatar_url: normalizeNullableText(payload.avatarUrl),
        },
        {
          onConflict: 'id',
        }
      )
      .select(PROFILE_SELECT)
      .single<ProfileRow>();

    if (error) {
      console.log('updateProfile error', error);
      return { data: null, error };
    }

    return { data: mapProfileRow(data), error: null };
  } catch (error) {
    console.log('updateProfile unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function getProfileActivityCollections(
  userId: string
): Promise<
  ServiceResponse<{
    upcoming: ProfileActivityItem[];
    hostedHistory: ProfileActivityItem[];
    pastJoined: ProfileActivityItem[];
  }>
> {
  try {
    const [{ data: hostedRows, error: hostedError }, { data: participantRows, error: participantError }] =
      await Promise.all([
        supabase
          .from('activities')
          .select('id, title, location_name, starts_at, status, host_id')
          .eq('host_id', userId)
          .order('starts_at', { ascending: false }),
        supabase
          .from('activity_participants')
          .select('activity_id, role')
          .eq('user_id', userId)
          .neq('role', 'host'),
      ]);

    if (hostedError) {
      console.log('getProfileActivityCollections.hosted error', hostedError);
      return { data: null, error: hostedError };
    }

    if (participantError) {
      console.log('getProfileActivityCollections.participants error', participantError);
      return { data: null, error: participantError };
    }

    const joinedIds = [...new Set(((participantRows ?? []) as ActivityParticipantRow[]).map((row) => row.activity_id))];
    const { data: joinedActivityRows, error: joinedActivitiesError } = joinedIds.length
      ? await supabase
          .from('activities')
          .select('id, title, location_name, starts_at, status, host_id')
          .in('id', joinedIds)
          .order('starts_at', { ascending: false })
      : { data: [], error: null };

    if (joinedActivitiesError) {
      console.log('getProfileActivityCollections.joinedActivities error', joinedActivitiesError);
      return { data: null, error: joinedActivitiesError };
    }

    const hostedItems = ((hostedRows ?? []) as ActivityRow[]).map((activity) =>
      mapActivityRowToProfileItem(activity, { hostedByMe: true, joinedByMe: false })
    );
    const joinedItems = ((joinedActivityRows ?? []) as ActivityRow[])
      .filter((activity) => activity.host_id !== userId)
      .map((activity) =>
        mapActivityRowToProfileItem(activity, { hostedByMe: false, joinedByMe: true })
      );

    return {
      data: {
        upcoming: sortByDateAsc(
          [...hostedItems, ...joinedItems].filter((activity) => activity.isUpcoming)
        ),
        hostedHistory: sortByDateDesc(hostedItems.filter((activity) => activity.isPast)),
        pastJoined: sortByDateDesc(joinedItems.filter((activity) => activity.isPast)),
      },
      error: null,
    };
  } catch (error) {
    console.log('getProfileActivityCollections unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export function buildEmptyProfile(userId: string): ProfileRecord {
  return {
    id: userId,
    fullName: 'New user',
    username: 'newuser',
    bio: 'No bio yet',
    avatarUrl: '',
    age: null,
    occupation: '',
    interests: [],
    ratingAvg: 0,
    ratingCount: 0,
    hostedCount: 0,
    joinedCount: 0,
    createdAt: null,
    updatedAt: null,
    initials: 'NU',
    isComplete: false,
  };
}

export function formatProfileHandle(username: string) {
  return `@${username || 'newuser'}`;
}

export function formatProfileShortInfo(profile: Pick<ProfileRecord, 'occupation' | 'age' | 'username'>) {
  const parts = [profile.occupation.trim(), profile.age ? `${profile.age}` : ''].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return formatProfileHandle(profile.username);
}

function mapProfileRow(row: ProfileRow): ProfileRecord {
  const rawFullName = row.full_name?.trim() ?? '';
  const rawUsername = normalizeUsername(row.username ?? '');
  const rawBio = row.bio?.trim() ?? '';
  const fullName = rawFullName || 'New user';
  const username = rawUsername || 'newuser';
  const bio = rawBio || 'No bio yet';

  return {
    id: row.id,
    fullName,
    username,
    bio,
    avatarUrl: row.avatar_url?.trim() ?? '',
    age: row.age ?? null,
    occupation: row.occupation?.trim() ?? '',
    interests: Array.isArray(row.interests) ? row.interests.filter(Boolean) : [],
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: row.rating_count ?? 0,
    hostedCount: row.hosted_count ?? 0,
    joinedCount: row.joined_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    initials: getInitials(fullName),
    isComplete: Boolean(rawFullName && rawUsername && rawBio),
  };
}

function mapActivityRowToProfileItem(
  activity: ActivityRow,
  flags: { hostedByMe: boolean; joinedByMe: boolean }
): ProfileActivityItem {
  const startsAt = activity.starts_at ?? new Date().toISOString();
  const timestamp = new Date(startsAt).getTime();
  const isUpcoming = (activity.status ?? '') === 'active' && timestamp >= Date.now();

  return {
    id: activity.id,
    title: activity.title?.trim() || 'Untitled activity',
    startsAt,
    schedule: formatActivitySchedule(startsAt),
    location: activity.location_name?.trim() || 'Location TBD',
    hostedByMe: flags.hostedByMe,
    joinedByMe: flags.joinedByMe,
    isPast: !isUpcoming,
    isUpcoming,
  };
}

function sortByDateAsc(items: ProfileActivityItem[]) {
  return [...items].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

function sortByDateDesc(items: ProfileActivityItem[]) {
  return [...items].sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());
}

function formatActivitySchedule(startsAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(startsAt));
}

function normalizeNullableText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

function getInitials(fullName: string) {
  const parts = fullName
    .split(' ')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'NU';
  }

  return parts.map((value) => value[0]?.toUpperCase() ?? '').join('');
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown profile service error');
}

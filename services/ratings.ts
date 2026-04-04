import { isPastActivity } from '@/lib/activity-time';
import { supabase } from '@/lib/supabase';
import { getActivities } from '@/services/activities';

type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

type ParticipantPromptRow = {
  activity_id: string;
  status: string | null;
  role: string | null;
  rating_prompt_dismissed_at?: string | null;
  rating_prompt_submitted_at?: string | null;
};

type ActivityRow = {
  id: string;
  title: string | null;
  starts_at: string | null;
  status: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ActivityRatingRow = {
  id: string;
  activity_id: string;
  from_user_id: string;
  to_user_id: string;
  score: number | null;
  comment: string | null;
  created_at: string | null;
};

export type RatingPromptTarget = {
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl: string;
  existingScore: number;
  existingComment: string;
};

export type RatingPromptActivity = {
  activityId: string;
  activityTitle: string;
  startsAt: string;
  targets: RatingPromptTarget[];
};

export type RatingSubmissionEntry = {
  toUserId: string;
  score: number;
  comment?: string | null;
};

export type TrustFeedbackItem = {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
  reviewerId: string;
  reviewerName: string;
  reviewerInitials: string;
  reviewerAvatarUrl: string;
  activityTitle?: string;
  activityStartsAt?: string;
};

export type ReceivedRatingSummary = {
  ratingAvg: number;
  ratingCount: number;
};

export async function getEligibleRatingPrompts(
  userId: string
): Promise<ServiceResponse<RatingPromptActivity[]>> {
  try {
    const { data: participantRows, error: participantError } = await supabase
      .from('activity_participants')
      .select(
        'activity_id, status, role, rating_prompt_dismissed_at, rating_prompt_submitted_at'
      )
      .eq('user_id', userId);

    if (participantError) {
      console.log('getEligibleRatingPrompts.participants error', participantError);
      return { data: null, error: participantError };
    }

    const eligibleParticipantRows = ((participantRows ?? []) as ParticipantPromptRow[]).filter(
      (participant) =>
        isJoinedStatus(participant.status) &&
        !participant.rating_prompt_dismissed_at &&
        !participant.rating_prompt_submitted_at
    );

    if (eligibleParticipantRows.length === 0) {
      return { data: [], error: null };
    }

    const activityIds = [...new Set(eligibleParticipantRows.map((participant) => participant.activity_id))];
    const [
      { data: activityRecords, error: activityRecordsError },
      { data: activityRows, error: activityError },
      { data: ratingRows, error: ratingError },
    ] = await Promise.all([
      getActivities(userId),
      supabase
        .from('activities')
        .select('id, title, starts_at, status')
        .in('id', activityIds),
      supabase
        .from('activity_ratings')
        .select('id, activity_id, from_user_id, to_user_id, score, comment, created_at')
        .eq('from_user_id', userId)
        .in('activity_id', activityIds),
    ]);

    if (activityRecordsError) {
      console.log('getEligibleRatingPrompts.activityRecords error', activityRecordsError);
      return { data: null, error: activityRecordsError };
    }

    if (activityError) {
      console.log('getEligibleRatingPrompts.activities error', activityError);
      return { data: null, error: activityError };
    }

    if (ratingError) {
      console.log('getEligibleRatingPrompts.ratings error', ratingError);
      return { data: null, error: ratingError };
    }

    const safeActivities = ((activityRows ?? []) as ActivityRow[]).filter(
      (activity): activity is ActivityRow & { starts_at: string } =>
        Boolean(activity.starts_at) &&
        activity.status === 'active' &&
        isPastActivity({ startsAt: activity.starts_at, status: activity.status })
    );

    if (safeActivities.length === 0) {
      return { data: [], error: null };
    }

    const safeActivityIds = safeActivities.map((activity) => activity.id);
    const activityRecordMap = new Map(
      (activityRecords ?? [])
        .filter((activity) => safeActivityIds.includes(activity.id))
        .map((activity) => [activity.id, activity] as const)
    );

    const ratingsByActivityAndTarget = new Map<string, ActivityRatingRow>();
    ((ratingRows ?? []) as ActivityRatingRow[]).forEach((rating) => {
      ratingsByActivityAndTarget.set(`${rating.activity_id}:${rating.to_user_id}`, rating);
    });

    const prompts = safeActivities
      .map((activity) => {
        const activityRecord = activityRecordMap.get(activity.id);

        if (!activityRecord) {
          return null;
        }

        const targetSummaries = [
          {
            id: activityRecord.host.id,
            fullName: activityRecord.host.fullName,
            initials: activityRecord.host.initials,
            avatarUrl: activityRecord.host.avatarUrl,
          },
          ...activityRecord.approvedParticipants.map((participant) => ({
            id: participant.userId,
            fullName: participant.profile.fullName,
            initials: participant.profile.initials,
            avatarUrl: participant.profile.avatarUrl,
          })),
        ];
        const uniqueTargets = new Map<string, (typeof targetSummaries)[number]>();
        targetSummaries.forEach((target) => {
          if (!target.id || target.id === userId) {
            return;
          }

          uniqueTargets.set(target.id, target);
        });
        const targets = [...uniqueTargets.values()].map((target) => {
          const existingRating = ratingsByActivityAndTarget.get(`${activity.id}:${target.id}`);

          return {
            userId: target.id,
            fullName: target.fullName?.trim() || 'Joinly member',
            initials: target.initials || getInitials(target.fullName ?? target.id),
            avatarUrl: target.avatarUrl?.trim() || '',
            existingScore: existingRating?.score ?? 0,
            existingComment: existingRating?.comment?.trim() ?? '',
          } satisfies RatingPromptTarget;
        });

        return {
          activityId: activity.id,
          activityTitle: activity.title?.trim() || 'Recent activity',
          startsAt: activity.starts_at,
          targets,
        } satisfies RatingPromptActivity;
      })
      .filter(isPromptWithTargets)
      .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());

    return { data: prompts, error: null };
  } catch (error) {
    console.log('getEligibleRatingPrompts unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function submitActivityRatings(
  activityId: string,
  fromUserId: string,
  entries: RatingSubmissionEntry[]
): Promise<ServiceResponse<null>> {
  try {
    const sanitizedEntries = entries
      .filter((entry) => entry.toUserId !== fromUserId && entry.score >= 1 && entry.score <= 5)
      .map((entry) => ({
        activity_id: activityId,
        from_user_id: fromUserId,
        to_user_id: entry.toUserId,
        score: entry.score,
        comment: normalizeNullableText(entry.comment),
      }));

    if (sanitizedEntries.length > 0) {
      const { error: upsertError } = await supabase.from('activity_ratings').upsert(sanitizedEntries, {
        onConflict: 'activity_id,from_user_id,to_user_id',
      });

      if (upsertError) {
        console.log('submitActivityRatings.upsert error', upsertError);
        return { data: null, error: upsertError };
      }
    }

    const { error: participantError } = await supabase
      .from('activity_participants')
      .update({
        rating_prompt_submitted_at: new Date().toISOString(),
      })
      .eq('activity_id', activityId)
      .eq('user_id', fromUserId);

    if (participantError) {
      console.log('submitActivityRatings.participant error', participantError);
      return { data: null, error: participantError };
    }

    return { data: null, error: null };
  } catch (error) {
    console.log('submitActivityRatings unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function dismissActivityRatingPrompt(
  activityId: string,
  userId: string
): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase
      .from('activity_participants')
      .update({
        rating_prompt_dismissed_at: new Date().toISOString(),
      })
      .eq('activity_id', activityId)
      .eq('user_id', userId);

    if (error) {
      console.log('dismissActivityRatingPrompt error', error);
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    console.log('dismissActivityRatingPrompt unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function getTrustFeedbackForUser(
  userId: string
): Promise<ServiceResponse<TrustFeedbackItem[]>> {
  try {
    const { data: ratingRows, error: ratingError } = await supabase
      .from('activity_ratings')
      .select('id, activity_id, from_user_id, to_user_id, score, comment, created_at')
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false });

    if (ratingError) {
      console.log('getTrustFeedbackForUser.ratings error', ratingError);
      return { data: null, error: ratingError };
    }

    const safeRatings = ((ratingRows ?? []) as ActivityRatingRow[]).filter(
      (rating) => Boolean(rating.comment?.trim())
    );

    if (safeRatings.length === 0) {
      return { data: [], error: null };
    }

    const reviewerIds = [...new Set(safeRatings.map((rating) => rating.from_user_id))];
    const activityIds = [...new Set(safeRatings.map((rating) => rating.activity_id))];
    const [
      { data: reviewerRows, error: reviewerError },
      { data: activityRows, error: activityError },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url').in('id', reviewerIds),
      supabase.from('activities').select('id, title, starts_at').in('id', activityIds),
    ]);

    if (reviewerError) {
      console.log('getTrustFeedbackForUser.reviewers error', reviewerError);
      return { data: null, error: reviewerError };
    }

    if (activityError) {
      console.log('getTrustFeedbackForUser.activities error', activityError);
      return { data: null, error: activityError };
    }

    const reviewerMap = new Map<string, ProfileRow>();
    ((reviewerRows ?? []) as ProfileRow[]).forEach((reviewer) => reviewerMap.set(reviewer.id, reviewer));

    const activityMap = new Map<string, { title: string | null; starts_at: string | null }>();
    (((activityRows ?? []) as Array<{ id: string; title: string | null; starts_at: string | null }>)).forEach(
      (activity) => activityMap.set(activity.id, activity)
    );

    const feedback = safeRatings.map((rating) => {
      const reviewer = reviewerMap.get(rating.from_user_id);
      const activity = activityMap.get(rating.activity_id);

      return {
        id: rating.id,
        score: rating.score ?? 0,
        comment: rating.comment?.trim() ?? '',
        createdAt: rating.created_at ?? new Date().toISOString(),
        reviewerId: rating.from_user_id,
        reviewerName: reviewer?.full_name?.trim() || 'Joinly member',
        reviewerInitials: getInitials(reviewer?.full_name ?? rating.from_user_id),
        reviewerAvatarUrl: reviewer?.avatar_url?.trim() || '',
        activityTitle: activity?.title?.trim() || undefined,
        activityStartsAt: activity?.starts_at ?? undefined,
      } satisfies TrustFeedbackItem;
    });

    return { data: feedback, error: null };
  } catch (error) {
    console.log('getTrustFeedbackForUser unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function getReceivedRatingSummary(
  userId: string
): Promise<ServiceResponse<ReceivedRatingSummary>> {
  try {
    const { data, error } = await supabase
      .from('activity_ratings')
      .select('score')
      .eq('to_user_id', userId)
      .not('score', 'is', null);

    if (error) {
      console.log('getReceivedRatingSummary error', error);
      return { data: null, error };
    }

    const scores = ((data ?? []) as Array<{ score: number | null }>)
      .map((row) => Number(row.score ?? 0))
      .filter((value) => value > 0);

    if (scores.length === 0) {
      return {
        data: {
          ratingAvg: 0,
          ratingCount: 0,
        },
        error: null,
      };
    }

    const total = scores.reduce((sum, value) => sum + value, 0);

    return {
      data: {
        ratingAvg: total / scores.length,
        ratingCount: scores.length,
      },
      error: null,
    };
  } catch (error) {
    console.log('getReceivedRatingSummary unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

function isJoinedStatus(status: string | null) {
  return status === 'joined' || status === 'approved';
}

function isPromptWithTargets(
  prompt: RatingPromptActivity | null
): prompt is RatingPromptActivity {
  return Boolean(prompt && prompt.targets.length > 0);
}

function getInitials(fullName: string) {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return 'JM';
  }

  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((value) => value[0]?.toUpperCase() ?? '').join('');
}

function normalizeNullableText(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown ratings service error');
}

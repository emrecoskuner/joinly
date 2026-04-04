export const ACTIVITY_HAPPENING_WINDOW_HOURS = 6;

const ACTIVITY_HAPPENING_WINDOW_MS = ACTIVITY_HAPPENING_WINDOW_HOURS * 60 * 60 * 1000;

export type ActivityLifecycleInput = {
  startsAt?: string | null;
  status?: string | null;
};

export type ActivityTimeState = 'upcoming' | 'happening-now' | 'past';

export function getActivityTimeState(
  activity: ActivityLifecycleInput,
  now = Date.now()
): ActivityTimeState {
  if (isInactiveActivityStatus(activity.status)) {
    return 'past';
  }

  const startsAtTimestamp = getActivityStartsAtTimestamp(activity.startsAt);

  if (startsAtTimestamp === null) {
    return 'past';
  }

  if (now < startsAtTimestamp) {
    return 'upcoming';
  }

  if (now < startsAtTimestamp + ACTIVITY_HAPPENING_WINDOW_MS) {
    return 'happening-now';
  }

  return 'past';
}

export function isHappeningNow(activity: ActivityLifecycleInput, now = Date.now()) {
  return getActivityTimeState(activity, now) === 'happening-now';
}

export function isPastActivity(activity: ActivityLifecycleInput, now = Date.now()) {
  return getActivityTimeState(activity, now) === 'past';
}

export function isUpcomingActivity(activity: ActivityLifecycleInput, now = Date.now()) {
  return getActivityTimeState(activity, now) === 'upcoming';
}

export function canJoinActivity(activity: ActivityLifecycleInput, now = Date.now()) {
  return getActivityTimeState(activity, now) === 'upcoming';
}

export function shouldAppearInDiscovery(activity: ActivityLifecycleInput, now = Date.now()) {
  const state = getActivityTimeState(activity, now);
  return state === 'upcoming' || state === 'happening-now';
}

export function hasActivityStarted(activity: ActivityLifecycleInput, now = Date.now()) {
  return !isUpcomingActivity(activity, now);
}

function isInactiveActivityStatus(status?: string | null) {
  return status === 'ended' || status === 'cancelled';
}

function getActivityStartsAtTimestamp(startsAt?: string | null) {
  if (!startsAt) {
    return null;
  }

  const timestamp = new Date(startsAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export type ActivityCategory = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: 'coffee', label: 'Coffee', icon: 'local-cafe', color: '#C8A27A' },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#FF8C42' },
  { id: 'run', label: 'Run', icon: 'directions-run', color: '#FFD60A' },
  { id: 'walk', label: 'Walk', icon: 'directions-walk', color: '#4CAF50' },
  { id: 'reading', label: 'Reading', icon: 'menu-book', color: '#5E60CE' },
  { id: 'sport', label: 'Sport', icon: 'sports-tennis', color: '#1E90FF' },
  { id: 'wellness', label: 'Wellness', icon: 'self-improvement', color: '#FF6B9D' },
  { id: 'games', label: 'Games', icon: 'sports-esports', color: '#9B5DE5' },
];

export const FALLBACK_ACTIVITY_CATEGORY: ActivityCategory = {
  id: 'unknown',
  label: 'Activity',
  icon: 'category',
  color: '#8F877C',
};

export function getActivityTypeById(typeId: string) {
  return ACTIVITY_CATEGORIES.find((category) => category.id === typeId) ?? FALLBACK_ACTIVITY_CATEGORY;
}

export function getActivityCategoryByLabel(label: string) {
  return ACTIVITY_CATEGORIES.find((category) => category.label === label) ?? FALLBACK_ACTIVITY_CATEGORY;
}

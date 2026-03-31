export type ActivityCategory = {
  id: string;
  label: 'Coffee' | 'Food' | 'Run' | 'Walk' | 'Reading' | 'Sport' | 'Wellness';
  icon: string;
};

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: 'coffee', label: 'Coffee', icon: 'local-cafe' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'run', label: 'Run', icon: 'directions-run' },
  { id: 'walk', label: 'Walk', icon: 'directions-walk' },
  { id: 'reading', label: 'Reading', icon: 'menu-book' },
  { id: 'sport', label: 'Sport', icon: 'sports-tennis' },
  { id: 'wellness', label: 'Wellness', icon: 'self-improvement' },
];

export function getActivityCategoryByLabel(label: string) {
  return ACTIVITY_CATEGORIES.find((category) => category.label === label);
}

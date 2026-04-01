export type PrivacyType = 'Public' | 'Private' | 'Invite-only';

export type ActivityFilter = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export type EventParticipant = {
  id: string;
  userId: string;
  name: string;
  initials: string;
  rating: number;
};

export type EventItem = {
  id: string;
  title: string;
  dateTimeIso: string;
  category: string;
  activityType: string;
  time: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  description?: string;
  notes?: string;
  hostId: string;
  hostName: string;
  hostInitials: string;
  hostBio: string;
  hostPhotoUrl: string;
  participantCount: number;
  participantLimit: number;
  participants: EventParticipant[];
  privacyType: PrivacyType;
  rating: number;
  accentColor: string;
};

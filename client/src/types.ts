// Shared data shapes. The backend returns these exact JSON shapes (see docs/api.md).

export const ACTIVITIES = ['Running', 'Walking', 'Strength', 'Cycling', 'Yoga', 'Other'] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const GROUP_CATEGORIES = ['Running', 'Strength', 'Walking', 'Mobility'] as const;

export interface ReminderSettings {
  daily: boolean;
  /** 24-hour "HH:MM", e.g. "19:00" */
  time: string;
  /** 0 = Monday … 6 = Sunday */
  days: number[];
  weeklySummaryEmail: boolean;
  commentNotifications: boolean;
  newMemberNotifications: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  weeklyGoal: number;
  bio: string;
  favoriteActivities: Activity[];
  reminders: ReminderSettings;
  createdAt: string;
}

export interface PersonSummary {
  id: string;
  name: string;
  initials: string;
}

export interface Group {
  id: string;
  name: string;
  initials: string;
  category: string;
  level: string;
  description: string;
  tagline: string;
  imageUrl: string;
  typicalGoal: number;
  memberCount: number;
  checkInsThisWeek: number;
  activeMembersThisWeek: number;
  isMember: boolean;
}

export interface GroupDetail extends Group {
  members: PersonSummary[];
}

export interface CheckIn {
  id: string;
  /** null = a private check-in only the author can see */
  group: { id: string; name: string } | null;
  author: PersonSummary;
  activity: Activity;
  durationMin: number;
  reflection: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

export interface Comment {
  id: string;
  checkInId: string;
  author: PersonSummary;
  text: string;
  createdAt: string;
}

export interface WeekEntry {
  id: string;
  activity: Activity;
  durationMin: number;
  createdAt: string;
  groupName: string | null;
}

export interface WeekSummary {
  /** ISO timestamp of Monday 00:00 (local time) */
  weekStart: string;
  goal: number;
  count: number;
  totalMinutes: number;
  /** 7 numbers, Monday first */
  minutesByDay: number[];
  /** 7 booleans, Monday first */
  activeDays: boolean[];
  entries: WeekEntry[];
}

export interface Session {
  token: string;
  user: User;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  weeklyGoal: number;
}

export interface NewCheckIn {
  groupId: string | null;
  activity: Activity;
  durationMin: number;
  reflection: string;
}

export type UserPatch = Partial<Pick<User, 'name' | 'weeklyGoal' | 'bio' | 'favoriteActivities' | 'reminders'>>;

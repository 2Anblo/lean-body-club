// Shared domain values. They match client/src/types.ts and docs/api.md.
export const ACTIVITIES = ['Running', 'Walking', 'Strength', 'Cycling', 'Yoga', 'Other'];
export const GROUP_CATEGORIES = ['Running', 'Strength', 'Walking', 'Mobility'];

export const LIMITS = {
  nameMax: 60,
  passwordMin: 8,
  passwordMax: 128, // bcrypt only reads the first 72 bytes; cap input so long strings can't slow the server down
  goalMin: 1,
  goalMax: 14,
  bioMax: 160,
  durationMin: 1,
  durationMax: 600,
  reflectionMax: 280,
  commentMax: 500,
};

export const ILLINOIS_EMAIL = /^[^\s@]+@illinois\.edu$/i;
export const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultReminders() {
  return {
    daily: true,
    time: '19:00',
    days: [0, 1, 2, 3, 4],
    weeklySummaryEmail: true,
    commentNotifications: true,
    newMemberNotifications: false,
  };
}

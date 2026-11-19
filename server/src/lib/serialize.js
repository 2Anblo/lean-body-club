// Turns database documents into the JSON shapes in docs/api.md.
// Shared by every route so the client always sees the same field names.

export function initialsOf(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function toUser(u) {
  const r = u.reminders ?? {};
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    weeklyGoal: u.weeklyGoal,
    bio: u.bio ?? '',
    favoriteActivities: [...(u.favoriteActivities ?? [])],
    reminders: {
      daily: Boolean(r.daily),
      time: r.time ?? '19:00',
      days: [...(r.days ?? [])],
      weeklySummaryEmail: Boolean(r.weeklySummaryEmail),
      commentNotifications: Boolean(r.commentNotifications),
      newMemberNotifications: Boolean(r.newMemberNotifications),
    },
    createdAt: new Date(u.createdAt).toISOString(),
  };
}

/** PersonSummary. Pass a populated user, or null when the account was deleted. */
export function toPerson(u, fallbackId = '') {
  if (!u) return { id: String(fallbackId), name: 'Former member', initials: 'FM' };
  return { id: String(u._id), name: u.name, initials: initialsOf(u.name) };
}

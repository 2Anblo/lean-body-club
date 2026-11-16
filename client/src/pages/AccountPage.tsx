import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_MODE, api } from '../api';
import { ConfirmModal, EditGoalModal, EditProfileModal, RemindersModal } from '../components/AccountModals';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/Progress';
import { useAuth, useCurrentUser } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { DAY_SHORT, formatClock, monthYear } from '../lib/dates';
import { plural } from '../lib/people';
import './AccountPage.css';

type Dialog = 'goal' | 'profile' | 'reminders' | 'reset' | null;

function daysLabel(days: number[]): string {
  const d = [...new Set(days)].sort((a, b) => a - b);
  if (d.length === 0) return 'No days';
  if (d.length === 7) return 'Every day';
  if (d.join() === '0,1,2,3,4') return 'Weekdays';
  if (d.join() === '5,6') return 'Weekends';
  const inARow = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
  if (inARow && d.length >= 3) return `${DAY_SHORT[d[0]]}–${DAY_SHORT[d[d.length - 1]]}`;
  return d.map((x) => DAY_SHORT[x]).join(', ');
}

function RowValue({ children }: { children: string }) {
  return (
    <span className="settings__value">
      <span className="settings__value-text">{children}</span>
      <Icon name="chevron" size={16} />
    </span>
  );
}

export default function AccountPage() {
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const week = useApi(() => api.myWeek(), []);
  const groups = useApi(() => api.listGroups(), []);
  const [dialog, setDialog] = useState<Dialog>(null);

  const myGroups = (groups.data ?? []).filter((g) => g.isMember);
  const remindersValue = user.reminders.daily ? `${daysLabel(user.reminders.days)}, ${formatClock(user.reminders.time)}` : 'Off';
  const emailValue = user.reminders.weeklySummaryEmail ? 'Weekly summary' : 'Off';

  async function logOut() {
    await signOut();
    navigate('/signin', { replace: true });
  }

  const rows = [
    { label: 'Weekly goal', value: `${plural(user.weeklyGoal, 'workout')} / week`, onClick: () => setDialog('goal') },
    { label: 'Reminders', value: remindersValue, onClick: () => setDialog('reminders') },
    { label: 'Email notifications', value: emailValue, onClick: () => setDialog('reminders') },
  ];

  return (
    <div className="account-page">
      <PageHeader eyebrow="Profile & settings" title="Account" />
      <div className="two-col">
        <div className="stack">
          <section className="card profile-card" aria-label="Profile">
            <Avatar name={user.name} size={80} tone="soft" />
            <div className="profile-card__text">
              <p className="profile-card__name">{user.name}</p>
              <p className="meta">{user.email}</p>
              <p className="meta">
                Member since {monthYear(user.createdAt)} · {plural(myGroups.length, 'group')}
              </p>
              {user.bio && <p className="profile-card__bio">{user.bio}</p>}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDialog('profile')}>
              Edit profile
            </Button>
          </section>

          <section className="card settings" aria-labelledby="settings-title">
            <h2 id="settings-title" className="section-title settings__title">
              Settings
            </h2>
            <ul>
              <li>
                <button type="button" className="settings__row" onClick={rows[0].onClick}>
                  <span className="settings__label">{rows[0].label}</span>
                  <RowValue>{rows[0].value}</RowValue>
                </button>
              </li>
              <li>
                <Link to="/groups" className="settings__row">
                  <span className="settings__label">My groups</span>
                  <RowValue>{myGroups.length ? myGroups.map((g) => g.name).join(', ') : 'None yet'}</RowValue>
                </Link>
              </li>
              {rows.slice(1).map((r) => (
                <li key={r.label}>
                  <button type="button" className="settings__row" onClick={r.onClick}>
                    <span className="settings__label">{r.label}</span>
                    <RowValue>{r.value}</RowValue>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="stack-sm">
          {week.data && (
            <Link to="/progress" className="card week-mini">
              <div className="row-between">
                <h2 className="section-title">This week</h2>
                <span className="section-title">
                  {week.data.count} / {week.data.goal}
                </span>
              </div>
              <ProgressBar value={week.data.count} max={week.data.goal} label="Weekly goal progress" />
              <p className="meta">
                {week.data.count >= week.data.goal
                  ? 'Goal reached — nice consistency!'
                  : `${plural(week.data.goal - week.data.count, 'more workout')} to hit your goal`}
              </p>
            </Link>
          )}
          <section className="card session-card" aria-labelledby="session-title">
            <h2 id="session-title" className="section-title">
              Signed in
            </h2>
            <p className="meta">You’re signed in as {user.email.split('@')[0]} on this browser.</p>
            <Button variant="secondary" block icon="logout" onClick={logOut}>
              Log out
            </Button>
          </section>
          {API_MODE === 'mock' && (
            <button type="button" className="text-link account-page__reset" onClick={() => setDialog('reset')}>
              Reset demo data
            </button>
          )}
        </div>
      </div>

      {dialog === 'goal' && <EditGoalModal onClose={() => setDialog(null)} />}
      {dialog === 'profile' && <EditProfileModal onClose={() => setDialog(null)} />}
      {dialog === 'reminders' && <RemindersModal onClose={() => setDialog(null)} />}
      {dialog === 'reset' && (
        <ConfirmModal
          title="Reset demo data?"
          message="This puts every group, check-in, like and comment back to the starting demo. Accounts you created here will be removed."
          confirmLabel="Reset"
          onConfirm={async () => {
            await api.resetDemo?.();
            window.location.assign('/');
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

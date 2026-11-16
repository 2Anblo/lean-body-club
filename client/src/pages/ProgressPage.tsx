import { useState } from 'react';
import { api } from '../api';
import { EditGoalModal } from '../components/AccountModals';
import { Button } from '../components/Button';
import { EmptyState, PageLoading } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { MinutesChart, ProgressRing } from '../components/Progress';
import { useUI } from '../context/UIContext';
import { useApi } from '../hooks/useApi';
import { DAY_SHORT, dayIndex, weekRangeLabel } from '../lib/dates';
import { plural } from '../lib/people';
import './ProgressPage.css';

export default function ProgressPage() {
  const week = useApi(() => api.myWeek(), []);
  const { openCheckIn } = useUI();
  const [editing, setEditing] = useState(false);

  if (!week.data) return <PageLoading label="Loading your week…" />;
  const w = week.data;
  const left = Math.max(0, w.goal - w.count);

  return (
    <div className="progress-page">
      <PageHeader
        eyebrow={weekRangeLabel(w.weekStart)}
        title="Weekly progress"
        actions={
          <Button variant="secondary" size="sm" className="hide-mobile" onClick={() => setEditing(true)}>
            Edit goal
          </Button>
        }
      />
      <div className="progress-grid">
        <section className="card ring-card" aria-label="Goal progress">
          <ProgressRing value={w.count} max={w.goal} size={190} />
          <p className="ring-card__title">{left === 0 ? 'Goal reached this week' : `${left} more to go — you’ve got this`}</p>
          <p className="ring-card__text">
            {left === 0
              ? `You showed up ${plural(w.count, 'time')}. Keep it going next week.`
              : 'Any activity counts: a walk, a run, or a gym session.'}
          </p>
        </section>

        <section className="card chart-card" aria-labelledby="minutes-title">
          <div className="row-between">
            <h2 id="minutes-title" className="section-title">
              Active minutes
            </h2>
            <span className="meta">{w.totalMinutes} min this week</span>
          </div>
          <MinutesChart minutesByDay={w.minutesByDay} />
        </section>

        <section className="card goal-summary" aria-label="Weekly goal">
          <div>
            <p className="meta">Weekly goal</p>
            <p className="goal-summary__value">{plural(w.goal, 'workout')} / week</p>
          </div>
          <button type="button" className="text-link" onClick={() => setEditing(true)}>
            Edit
          </button>
        </section>

        <section className="history" aria-labelledby="history-title">
          <h2 id="history-title" className="section-title">
            This week
          </h2>
          {w.entries.length === 0 ? (
            <EmptyState
              title="No workouts yet this week"
              action={<Button onClick={() => openCheckIn()}>Log a workout</Button>}
            >
              A 15-minute walk counts. Start small.
            </EmptyState>
          ) : (
            <ul className="card history__list">
              {w.entries.map((e) => (
                <li key={e.id} className="history__row">
                  <div>
                    <p className="history__activity">{e.activity}</p>
                    <p className="meta">
                      {DAY_SHORT[dayIndex(new Date(e.createdAt))]} · {e.groupName ?? 'Only you'}
                    </p>
                  </div>
                  <span className="history__min">{e.durationMin} min</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {editing && <EditGoalModal onClose={() => setEditing(false)} />}
    </div>
  );
}

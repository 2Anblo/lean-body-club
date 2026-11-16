import { Link } from 'react-router-dom';
import { api } from '../api';
import { Avatar } from '../components/Avatar';
import { Button, LinkButton } from '../components/Button';
import { CheckInCard } from '../components/CheckInCard';
import { EmptyState } from '../components/EmptyState';
import { GroupCard } from '../components/GroupCard';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/Progress';
import { WeeklyGoalCard } from '../components/WeeklyGoalCard';
import { useCurrentUser } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useApi } from '../hooks/useApi';
import { cx } from '../lib/cx';
import { longDate } from '../lib/dates';
import { firstName, plural } from '../lib/people';
import './HomePage.css';

export default function HomePage() {
  const user = useCurrentUser();
  const { openCheckIn } = useUI();
  const week = useApi(() => api.myWeek(), []);
  const groups = useApi(() => api.listGroups(), []);
  const feed = useApi(() => api.homeFeed(), []);

  const myGroups = (groups.data ?? []).filter((g) => g.isMember);
  const suggested = (groups.data ?? []).filter((g) => !g.isMember).slice(0, 2);
  const goalReached = week.data ? week.data.count >= week.data.goal : false;

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <p className="eyebrow">{longDate()}</p>
          <h1 className="page-title">Hi, {firstName(user.name)}</h1>
        </div>
        <Link to="/account" className="home__avatar hide-desktop" aria-label="Your account">
          <Avatar name={user.name} size={44} tone="soft" />
        </Link>
        <Button className="hide-mobile" icon="plus" onClick={() => openCheckIn()}>
          Log a workout
        </Button>
      </header>

      <div className="home__grid">
        <div className="home__primary stack-sm">
          {week.data ? <WeeklyGoalCard summary={week.data} /> : <div className="skeleton" style={{ height: 232 }} />}
          <Button block className="hide-desktop" onClick={() => openCheckIn()}>
            {goalReached ? 'Log another workout' : 'Log a workout'}
          </Button>
        </div>

        <div className="home__side stack">
          <section className="stack-sm" aria-labelledby="my-groups">
            <div className="row-between">
              <h2 id="my-groups" className="section-title">
                My groups
              </h2>
              {myGroups.length > 0 && (
                <Link to="/groups" className="text-link">
                  Browse
                </Link>
              )}
            </div>
            {!groups.data ? (
              <div className="skeleton" style={{ height: 82 }} />
            ) : myGroups.length === 0 ? (
              <EmptyState
                title="No groups yet"
                action={
                  <LinkButton to="/groups" variant="secondary">
                    Browse groups
                  </LinkButton>
                }
              >
                Join a small group to share check-ins and cheer each other on.
              </EmptyState>
            ) : (
              myGroups.map((g) => <GroupCard key={g.id} group={g} />)
            )}
          </section>

          {suggested.length > 0 && (
            <section className="stack-sm" aria-labelledby="suggested">
              <h2 id="suggested" className="section-title">
                Suggested for you
              </h2>
              {suggested.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </section>
          )}
        </div>

        {feed.data && feed.data.length > 0 ? (
          <section className="home__recent stack-sm" aria-labelledby="recent">
            <h2 id="recent" className="section-title">
              Recent in your groups
            </h2>
            <div className="post-grid">
              {feed.data.slice(0, 4).map((c) => (
                <CheckInCard key={c.id} checkIn={c} showGroup />
              ))}
            </div>
          </section>
        ) : (
          feed.data &&
          week.data &&
          groups.data && (
            <GettingStarted
              joined={myGroups.length > 0}
              logged={week.data.count > 0}
              reached={goalReached}
              goal={week.data.goal}
              onLog={() => openCheckIn()}
            />
          )
        )}
      </div>
    </div>
  );
}

interface GettingStartedProps {
  joined: boolean;
  logged: boolean;
  reached: boolean;
  goal: number;
  onLog(): void;
}

/** Shown until the user has a group feed: the three things to do first. */
function GettingStarted({ joined, logged, reached, goal, onLog }: GettingStartedProps) {
  const steps = [
    {
      done: joined,
      title: 'Join a group',
      text: 'Pick a small group that trains like you.',
      action: (
        <Link to="/groups" className="text-link">
          Browse groups
        </Link>
      ),
    },
    {
      done: logged,
      title: 'Log a workout',
      text: 'Any activity counts — even a 15-minute walk.',
      action: (
        <button type="button" className="text-link" onClick={onLog}>
          Check in
        </button>
      ),
    },
    {
      done: reached,
      title: 'Hit your weekly goal',
      text: `${plural(goal, 'workout')} this week.`,
      action: (
        <Link to="/progress" className="text-link">
          See progress
        </Link>
      ),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <section className="home__recent card getting-started" aria-labelledby="get-started">
      <div className="row-between">
        <h2 id="get-started" className="section-title">
          Get started
        </h2>
        <span className="meta">{doneCount} of 3 done</span>
      </div>
      <ProgressBar value={doneCount} max={steps.length} label="Getting started progress" />
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s.title} className={cx('step', s.done && 'step--done')}>
            <span className="step__mark" aria-hidden="true">
              {s.done ? <Icon name="check" size={16} /> : i + 1}
            </span>
            <div className="step__body">
              <p className="step__title">
                {s.title}
                {s.done && <span className="sr-only"> (done)</span>}
              </p>
              <p className="step__text">{s.text}</p>
              {!s.done && s.action}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

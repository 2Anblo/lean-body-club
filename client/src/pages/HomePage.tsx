import { Link } from 'react-router-dom';
import { api } from '../api';
import { Avatar } from '../components/Avatar';
import { Button, LinkButton } from '../components/Button';
import { CheckInCard } from '../components/CheckInCard';
import { EmptyState } from '../components/EmptyState';
import { GroupCard } from '../components/GroupCard';
import { WeeklyGoalCard } from '../components/WeeklyGoalCard';
import { useCurrentUser } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useApi } from '../hooks/useApi';
import { longDate } from '../lib/dates';
import { firstName } from '../lib/people';
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

        {feed.data && feed.data.length > 0 && (
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
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar } from '../components/Avatar';
import { Button, LinkButton } from '../components/Button';
import { CheckInCard } from '../components/CheckInCard';
import { EmptyState, PageLoading } from '../components/EmptyState';
import { GroupSidebar } from '../components/GroupSidebar';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { useCurrentUser } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useApi } from '../hooks/useApi';
import { useJoinGroup } from '../hooks/useJoinGroup';
import type { GroupDetail } from '../types';
import './GroupPage.css';

export default function GroupPage() {
  const { groupId = '' } = useParams();
  const user = useCurrentUser();
  const { openCheckIn } = useUI();
  const join = useJoinGroup();
  const groupQ = useApi(() => api.getGroup(groupId), [groupId]);
  const feedQ = useApi(() => api.groupFeed(groupId), [groupId]);
  const [joining, setJoining] = useState(false);

  if (groupQ.error) {
    return (
      <div>
        <PageHeader backTo="/groups" title="Group not found" />
        <EmptyState
          title="We couldn’t find that group"
          action={
            <LinkButton to="/groups" variant="secondary">
              Back to groups
            </LinkButton>
          }
        >
          It may have been removed, or the link is wrong.
        </EmptyState>
      </div>
    );
  }

  const group = groupQ.data;
  if (!group) return <PageLoading label="Loading group…" />;

  const posts = feedQ.data ?? [];

  async function onJoin(g: GroupDetail) {
    setJoining(true);
    await join(g);
    setJoining(false);
  }

  if (!group.isMember) {
    return (
      <div className="group-page">
        <PageHeader
          backTo="/groups"
          eyebrow="Group"
          title={group.name}
          actions={
            <Button className="hide-mobile" onClick={() => onJoin(group)} loading={joining} loadingText="Joining…">
              Join group
            </Button>
          }
        />
        <div className="two-col">
          <div className="stack">
            <img className="group-cover" src={group.imageUrl} alt={`${group.name}`} />
            <div className="group-intro">
              <p className="meta">
                {group.category} · {group.memberCount} members · {group.level}
              </p>
              <p className="group-intro__desc">{group.description}</p>
            </div>
            <dl className="stat-tiles">
              <div className="stat-tile">
                <dt className="meta">check-ins this week</dt>
                <dd>{group.checkInsThisWeek}</dd>
              </div>
              <div className="stat-tile">
                <dt className="meta">typical weekly goal</dt>
                <dd>{group.typicalGoal}×</dd>
              </div>
              <div className="stat-tile">
                <dt className="meta">members</dt>
                <dd>{group.memberCount}</dd>
              </div>
            </dl>
            <section className="stack-sm" aria-labelledby="recent-checkins">
              <h2 id="recent-checkins" className="section-title">
                Recent check-ins
              </h2>
              {posts.length === 0 && feedQ.data ? (
                <p className="meta">No check-ins yet — be the first after you join.</p>
              ) : (
                posts.slice(0, 3).map((c) => <CheckInCard key={c.id} checkIn={c} />)
              )}
            </section>
          </div>
          <div className="hide-mobile">
            <GroupSidebar group={group} showPhoto={false} />
          </div>
        </div>
        <div className="sticky-action hide-desktop">
          <Button block onClick={() => onJoin(group)} loading={joining} loadingText="Joining…">
            Join group
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-page">
      <PageHeader
        backTo="/groups"
        eyebrow={
          <>
            <Link to="/groups" className="crumb">
              Groups
            </Link>{' '}
            › {group.category} · {group.memberCount} members
          </>
        }
        title={group.name}
        actions={
          <span className="pill pill--dark">
            <Icon name="check" size={14} /> Joined
          </span>
        }
      />
      <div className="two-col">
        <section className="stack-sm" aria-label="Group feed">
          <button type="button" className="composer" onClick={() => openCheckIn(group.id)}>
            <Avatar name={user.name} size={40} tone="soft" />
            <span className="composer__field">Share today’s workout…</span>
          </button>
          <p className="meta">
            This week · {group.checkInsThisWeek} check-ins from {group.activeMembersThisWeek} members
          </p>
          {!feedQ.data ? (
            <div className="skeleton" style={{ height: 170 }} />
          ) : posts.length === 0 ? (
            <EmptyState title="No check-ins yet">Be the first — share today’s workout.</EmptyState>
          ) : (
            posts.map((c) => <CheckInCard key={c.id} checkIn={c} />)
          )}
        </section>
        <GroupSidebar group={group} />
      </div>
    </div>
  );
}

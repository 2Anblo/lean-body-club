import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Group } from '../types';
import { useJoinGroup } from '../hooks/useJoinGroup';
import { assetUrl } from '../lib/asset';
import './GroupCard.css';

/** Row card for a group. The whole card opens the group; "Join" joins without leaving the page. */
export function GroupCard({ group }: { group: Group }) {
  const join = useJoinGroup();
  const [joining, setJoining] = useState(false);

  async function onJoin() {
    setJoining(true);
    await join(group);
    setJoining(false);
  }

  return (
    <article className="group-card">
      <img className="group-card__thumb" src={assetUrl(group.imageUrl)} alt="" loading="lazy" />
      <div className="group-card__info">
        <h3 className="group-card__name">
          <Link to={`/groups/${group.id}`} className="stretched-link">
            {group.name}
          </Link>
        </h3>
        <p className="meta">
          {group.category} · {group.memberCount} members
        </p>
        <p className="group-card__line">
          {group.isMember ? `${group.checkInsThisWeek} check-ins this week` : group.tagline}
        </p>
      </div>
      {group.isMember ? (
        <span className="pill pill--soft group-card__action" aria-hidden="true">
          Open
        </span>
      ) : (
        <button
          type="button"
          className="pill pill--dark group-card__action"
          onClick={onJoin}
          disabled={joining}
          aria-label={`Join ${group.name}`}
        >
          {joining ? 'Joining…' : 'Join'}
        </button>
      )}
    </article>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import type { GroupDetail } from '../types';
import { assetUrl } from '../lib/asset';
import { ConfirmModal } from './AccountModals';
import { Avatar } from './Avatar';
import { ProgressBar } from './Progress';
import './GroupSidebar.css';

interface Props {
  group: GroupDetail;
  showPhoto?: boolean;
}

/** Right column on group and check-in pages: about, your week, members. */
export function GroupSidebar({ group, showPhoto = true }: Props) {
  const week = useApi(() => api.myWeek(), []);
  const { refresh } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const shown = group.members.slice(0, 6);
  const more = group.memberCount - shown.length;

  async function leave() {
    try {
      await api.leaveGroup(group.id);
      setConfirmLeave(false);
      refresh();
      showToast(`You left ${group.name}`);
      navigate('/groups');
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  }

  return (
    <aside className="group-side" aria-label={`About ${group.name}`}>
      <section className="card group-side__card">
        {showPhoto && <img className="group-side__photo" src={assetUrl(group.imageUrl)} alt="" />}
        <h2 className="section-title">About</h2>
        <p className="group-side__desc">{group.description}</p>
        <dl className="stats">
          <div>
            <dt className="meta">check-ins</dt>
            <dd>{group.checkInsThisWeek}</dd>
          </div>
          <div>
            <dt className="meta">weekly goal</dt>
            <dd>{group.typicalGoal}×</dd>
          </div>
          <div>
            <dt className="meta">members</dt>
            <dd>{group.memberCount}</dd>
          </div>
        </dl>
      </section>

      {group.isMember && week.data && (
        <section className="card group-side__card">
          <div className="row-between">
            <h2 className="section-title">Your week</h2>
            <span className="section-title">
              {week.data.count} / {week.data.goal}
            </span>
          </div>
          <ProgressBar value={week.data.count} max={week.data.goal} label="Your weekly goal progress" />
          <p className="meta">
            {week.data.count >= week.data.goal
              ? 'Goal reached — nice consistency!'
              : `${week.data.goal - week.data.count} more to hit your goal`}
          </p>
        </section>
      )}

      <section className="card group-side__card">
        <h2 className="section-title">Members · {group.memberCount}</h2>
        <ul className="avatar-stack" aria-label="Some members">
          {shown.map((m) => (
            <li key={m.id} title={m.name}>
              <Avatar name={m.name} size={36} />
              <span className="sr-only">{m.name}</span>
            </li>
          ))}
          {more > 0 && (
            <li>
              <span className="avatar-stack__more">+{more}</span>
            </li>
          )}
        </ul>
        {group.isMember && (
          <button type="button" className="text-link group-side__leave" onClick={() => setConfirmLeave(true)}>
            Leave group
          </button>
        )}
      </section>

      {confirmLeave && (
        <ConfirmModal
          title={`Leave ${group.name}?`}
          message="You’ll stop seeing this group’s check-ins. Your past check-ins stay in the group, and you can rejoin anytime."
          confirmLabel="Leave group"
          onConfirm={leave}
          onClose={() => setConfirmLeave(false)}
        />
      )}
    </aside>
  );
}

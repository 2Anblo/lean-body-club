import { useId, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useCurrentUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { ACTIVITIES, type Activity } from '../types';
import { Button } from './Button';
import { Chip, ChipGroup } from './Chip';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { TextField } from './TextField';
import './Forms.css';

const DURATIONS = [15, 30, 45, 60];
const ONLY_ME = '__only_me__';

interface Props {
  /** undefined = pick the first group you belong to */
  initialGroupId?: string | null;
  onClose(): void;
}

export function CheckInModal({ initialGroupId, onClose }: Props) {
  const user = useCurrentUser();
  const { refresh } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const selectId = useId();

  const groups = useApi(() => api.listGroups(), []);
  const week = useApi(() => api.myWeek(), []);
  const myGroups = (groups.data ?? []).filter((g) => g.isMember);

  const [pickedGroup, setPickedGroup] = useState<string | null | undefined>(initialGroupId);
  const groupId = pickedGroup === undefined ? (myGroups[0]?.id ?? null) : pickedGroup;
  const [activity, setActivity] = useState<Activity>(user.favoriteActivities[0] ?? 'Running');
  const [duration, setDuration] = useState(30);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const created = await api.createCheckIn({ groupId, activity, durationMin: duration, reflection });
      const before = week.data?.count ?? 0;
      const goal = week.data?.goal ?? user.weeklyGoal;
      const after = before + 1;
      refresh();
      showToast(
        after === goal ? `Check-in posted · ${after}/${goal} goal reached!` : `Check-in posted · ${after}/${goal} this week`,
      );
      onClose();
      if (created.group && location.pathname !== `/groups/${created.group.id}`) {
        navigate(`/groups/${created.group.id}`);
      }
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  const formId = 'checkin-form';

  return (
    <Modal
      title="New check-in"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="modal__cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving} loadingText="Posting…">
            Post check-in
          </Button>
        </>
      }
    >
      <form id={formId} className="form-stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor={selectId} className="field__label">
            Posting to
          </label>
          <div className="select-wrap">
            <select
              id={selectId}
              className="select"
              value={groupId ?? ONLY_ME}
              onChange={(e) => setPickedGroup(e.target.value === ONLY_ME ? null : e.target.value)}
            >
              {myGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
              <option value={ONLY_ME}>Only me (private)</option>
            </select>
            <Icon name="chevron" size={18} className="select-wrap__icon" />
          </div>
          {groups.data && myGroups.length === 0 && (
            <span className="field__hint">Join a group to share check-ins with others.</span>
          )}
        </div>

        <ChipGroup label="Activity">
          {ACTIVITIES.map((a) => (
            <Chip key={a} selected={activity === a} onClick={() => setActivity(a)}>
              {a}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Duration">
          {DURATIONS.map((d) => (
            <Chip key={d} selected={duration === d} onClick={() => setDuration(d)}>
              {d === 60 ? '60+ min' : `${d} min`}
            </Chip>
          ))}
        </ChipGroup>

        <TextField
          label="How did it feel? (optional)"
          value={reflection}
          onChange={setReflection}
          multiline
          rows={3}
          maxLength={280}
          showCount
          placeholder="Felt slow at first but finished strong."
        />

        {week.data && (
          <p className="note">
            <Icon name="check" size={18} />
            <span>
              Counts toward your weekly goal ({week.data.count}/{week.data.goal} → {week.data.count + 1}/{week.data.goal})
            </span>
          </p>
        )}

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

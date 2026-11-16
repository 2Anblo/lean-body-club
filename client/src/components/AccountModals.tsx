import { useState, type FormEvent } from 'react';
import { errorMessage } from '../api';
import { useAuth, useCurrentUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { ACTIVITIES, type Activity, type ReminderSettings } from '../types';
import { DAY_SHORT, formatClock } from '../lib/dates';
import { plural } from '../lib/people';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Chip, ChipGroup } from './Chip';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { TextField } from './TextField';
import { Toggle } from './Toggle';
import './Forms.css';

interface ModalProps {
  onClose(): void;
}

function Footer({ formId, saving, label, onCancel }: { formId: string; saving: boolean; label: string; onCancel(): void }) {
  return (
    <>
      <Button variant="secondary" className="modal__cancel" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" form={formId} loading={saving} loadingText="Saving…">
        {label}
      </Button>
    </>
  );
}

/** Shared save logic: update the user, refresh screens, toast, close. */
function useSave(onClose: () => void) {
  const { updateUser } = useAuth();
  const { refresh } = useData();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(patch: Parameters<typeof updateUser>[0], message: string) {
    setSaving(true);
    setError('');
    try {
      await updateUser(patch);
      refresh();
      showToast(message);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return { save, saving, error };
}

export function EditGoalModal({ onClose }: ModalProps) {
  const user = useCurrentUser();
  const [goal, setGoal] = useState(user.weeklyGoal);
  const { save, saving, error } = useSave(onClose);
  const formId = 'goal-form';

  function submit(e: FormEvent) {
    e.preventDefault();
    void save({ weeklyGoal: goal }, `Weekly goal set to ${plural(goal, 'workout')}`);
  }

  return (
    <Modal title="Weekly goal" onClose={onClose} footer={<Footer formId={formId} saving={saving} label="Save goal" onCancel={onClose} />}>
      <form id={formId} className="form-stack" onSubmit={submit}>
        <div className="stepper-card">
          <p className="meta">How many workouts per week?</p>
          <div className="stepper">
            <button
              type="button"
              className="stepper__btn"
              onClick={() => setGoal((g) => Math.max(1, g - 1))}
              disabled={goal <= 1}
              aria-label="Decrease goal"
            >
              <Icon name="minus" size={22} />
            </button>
            <output className="stepper__value" aria-live="polite" aria-label={`${goal} workouts per week`}>
              {goal}
            </output>
            <button
              type="button"
              className="stepper__btn stepper__btn--primary"
              onClick={() => setGoal((g) => Math.min(14, g + 1))}
              disabled={goal >= 14}
              aria-label="Increase goal"
            >
              <Icon name="plus" size={22} />
            </button>
          </div>
          <p className="meta">workouts / week</p>
        </div>
        <ChipGroup label="Quick pick">
          {[2, 3, 4, 5].map((n) => (
            <Chip key={n} selected={goal === n} onClick={() => setGoal(n)} ariaLabel={`${n} times per week`}>
              {n}× / week
            </Chip>
          ))}
        </ChipGroup>
        <p className="note">
          <Icon name="check" size={18} />
          <span>Most beginners aim for 3. Changes apply starting this week.</span>
        </p>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

export function EditProfileModal({ onClose }: ModalProps) {
  const user = useCurrentUser();
  const { showToast } = useToast();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [favorites, setFavorites] = useState<Activity[]>(user.favoriteActivities);
  const [nameError, setNameError] = useState('');
  const { save, saving, error } = useSave(onClose);
  const formId = 'profile-form';

  function toggleFavorite(a: Activity) {
    setFavorites((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Please enter your name.');
      return;
    }
    setNameError('');
    void save({ name: name.trim(), bio, favoriteActivities: favorites }, 'Profile updated');
  }

  return (
    <Modal title="Edit profile" onClose={onClose} footer={<Footer formId={formId} saving={saving} label="Save changes" onCancel={onClose} />}>
      <form id={formId} className="form-stack" onSubmit={submit}>
        <div className="profile-photo-row">
          <Avatar name={name || user.name} size={72} tone="soft" />
          <div className="profile-photo-row__text">
            <span className="label">Profile photo</span>
            <button type="button" className="text-link" onClick={() => showToast('Photo uploads are coming soon.')}>
              Change photo
            </button>
          </div>
        </div>
        <TextField label="Name" value={name} onChange={setName} autoComplete="name" maxLength={60} error={nameError} />
        <TextField label="Illinois email" value={user.email} onChange={() => {}} disabled hint="Your Illinois email can’t be changed." />
        <TextField
          label="Short bio"
          value={bio}
          onChange={setBio}
          multiline
          rows={3}
          maxLength={160}
          showCount
          placeholder="What are you working toward this semester?"
        />
        <ChipGroup label="Favorite activities" hint="Your first pick is pre-selected when you check in.">
          {ACTIVITIES.map((a) => (
            <Chip key={a} selected={favorites.includes(a)} onClick={() => toggleFavorite(a)}>
              {a}
            </Chip>
          ))}
        </ChipGroup>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

const TIMES = ['07:00', '12:00', '19:00', '21:00'];

export function RemindersModal({ onClose }: ModalProps) {
  const user = useCurrentUser();
  const [r, setR] = useState<ReminderSettings>(user.reminders);
  const { save, saving, error } = useSave(onClose);
  const formId = 'reminders-form';
  const set = <K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) => setR((prev) => ({ ...prev, [key]: value }));

  function toggleDay(d: number) {
    set('days', r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort());
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void save({ reminders: r }, 'Reminder settings saved');
  }

  return (
    <Modal title="Reminders" onClose={onClose} footer={<Footer formId={formId} saving={saving} label="Save" onCancel={onClose} />}>
      <form id={formId} className="form-stack" onSubmit={submit}>
        <Toggle label="Daily reminder" description="Nudge me if I haven’t checked in" checked={r.daily} onChange={(v) => set('daily', v)} />
        <ChipGroup label="Remind me at">
          {TIMES.map((t) => (
            <Chip key={t} selected={r.time === t} onClick={() => set('time', t)} disabled={!r.daily}>
              {formatClock(t)}
            </Chip>
          ))}
        </ChipGroup>
        <ChipGroup label="On these days" hint={r.daily && r.days.length === 0 ? 'Pick at least one day to get reminders.' : undefined}>
          {DAY_SHORT.map((d, i) => (
            <Chip key={d} selected={r.days.includes(i)} onClick={() => toggleDay(i)} disabled={!r.daily}>
              {d}
            </Chip>
          ))}
        </ChipGroup>
        <hr className="form-divider" />
        <h3 className="section-title">Notifications</h3>
        <Toggle
          label="Weekly summary email"
          description="Every Sunday evening"
          checked={r.weeklySummaryEmail}
          onChange={(v) => set('weeklySummaryEmail', v)}
        />
        <Toggle label="Comments on my check-ins" checked={r.commentNotifications} onChange={(v) => set('commentNotifications', v)} />
        <Toggle label="New members in my groups" checked={r.newMemberNotifications} onChange={(v) => set('newMemberNotifications', v)} />
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm(): Promise<void> | void;
  onClose(): void;
}

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: ConfirmProps) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" className="modal__cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

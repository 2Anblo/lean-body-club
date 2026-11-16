import { useId } from 'react';
import { cx } from '../lib/cx';
import './Toggle.css';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange(checked: boolean): void;
  disabled?: boolean;
}

/** A labelled on/off switch row. */
export function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  const id = useId();
  return (
    <div className="toggle-row">
      <div className="toggle-row__text">
        <span id={`${id}-label`} className="toggle-row__title">
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="meta">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={cx('toggle', checked && 'toggle--on')}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle__knob" />
      </button>
    </div>
  );
}

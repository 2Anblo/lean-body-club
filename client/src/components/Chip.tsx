import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import './Chip.css';

interface ChipProps {
  selected: boolean;
  onClick(): void;
  children: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Chip({ selected, onClick, children, disabled, ariaLabel }: ChipProps) {
  return (
    <button
      type="button"
      className={cx('chip', selected && 'chip--selected')}
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface ChipGroupProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

/** A labelled, wrapping row of chips. */
export function ChipGroup({ label, children, hint }: ChipGroupProps) {
  return (
    <fieldset className="chip-group">
      <legend className="chip-group__label">{label}</legend>
      <div className="chip-group__chips">{children}</div>
      {hint && <p className="chip-group__hint">{hint}</p>}
    </fieldset>
  );
}

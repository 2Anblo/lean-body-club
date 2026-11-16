import { useId, type HTMLAttributes } from 'react';
import { cx } from '../lib/cx';
import './TextField.css';

interface TextFieldProps {
  label: string;
  value: string;
  onChange(value: string): void;
  type?: 'text' | 'email' | 'password' | 'search';
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  required?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  error,
  placeholder,
  disabled,
  autoComplete,
  inputMode,
  multiline,
  rows = 3,
  maxLength,
  showCount,
  required,
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('field', error && 'field--error', disabled && 'field--disabled')}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className="field__control field__control--area"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
        />
      ) : (
        <input
          id={id}
          className="field__control"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
        />
      )}
      {(hint || (showCount && maxLength)) && (
        <div className="field__foot">
          {hint && (
            <span id={hintId} className="field__hint">
              {hint}
            </span>
          )}
          {showCount && maxLength && (
            <span className="field__count" aria-hidden="true">
              {value.length} / {maxLength}
            </span>
          )}
        </div>
      )}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

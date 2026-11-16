import { DAY_SHORT, dayIndex } from '../lib/dates';
import { cx } from '../lib/cx';
import './Progress.css';

interface BarProps {
  value: number;
  max: number;
  label: string;
  tone?: 'light' | 'dark';
}

export function ProgressBar({ value, max, label, tone = 'light' }: BarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={cx('progress', `progress--${tone}`)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <span className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

interface RingProps {
  value: number;
  max: number;
  size?: number;
}

export function ProgressRing({ value, max, size = 180 }: RingProps) {
  const stroke = Math.round(size * 0.08);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const c = size / 2;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${value} of ${max} workouts this week`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring__track" cx={c} cy={c} r={r} strokeWidth={stroke} />
        {pct > 0 && (
          <circle
            className="ring__value"
            cx={c}
            cy={c}
            r={r}
            strokeWidth={stroke}
            strokeDasharray={`${circumference * pct} ${circumference}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
        )}
      </svg>
      <div className="ring__center" aria-hidden="true">
        <span className="ring__num">
          {value}/{max}
        </span>
        <span className="meta">workouts</span>
      </div>
    </div>
  );
}

export function MinutesChart({ minutesByDay }: { minutesByDay: number[] }) {
  const max = Math.max(60, ...minutesByDay);
  const today = dayIndex(new Date());
  const summary = minutesByDay.map((m, i) => `${DAY_SHORT[i]} ${m} minutes`).join(', ');
  return (
    <div className="chart" role="img" aria-label={`Active minutes by day: ${summary}`}>
      <ul className="chart__cols" aria-hidden="true">
        {minutesByDay.map((m, i) => (
          <li key={DAY_SHORT[i]} className={cx('chart__col', i === today && 'chart__col--today')}>
            <span className="chart__value">{m > 0 ? `${m}m` : ''}</span>
            <span className="chart__track">
              <span className={cx('chart__bar', m === 0 && 'chart__bar--empty')} style={{ height: `${Math.max(4, (m / max) * 100)}%` }} />
            </span>
            <span className="chart__day">{DAY_SHORT[i]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

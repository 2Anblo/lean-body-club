import { Link } from 'react-router-dom';
import type { WeekSummary } from '../types';
import { DAY_LETTER, DAY_SHORT, dayIndex } from '../lib/dates';
import { cx } from '../lib/cx';
import { plural } from '../lib/people';
import { Icon } from './Icon';
import { ProgressBar } from './Progress';
import './WeeklyGoalCard.css';

/** The black "This week" card from the Home screen. */
export function WeeklyGoalCard({ summary }: { summary: WeekSummary }) {
  const today = dayIndex(new Date());
  const left = Math.max(0, summary.goal - summary.count);
  return (
    <section className="goal-card" aria-label="This week">
      <div className="goal-card__top">
        <h2 className="goal-card__label">This week</h2>
        <Link to="/progress" className="goal-card__details">
          Details <Icon name="chevron" size={16} />
        </Link>
      </div>
      <p className="goal-card__count">
        <span className="goal-card__num">
          {summary.count} / {summary.goal}
        </span>
        <span className="goal-card__unit">workouts</span>
      </p>
      <ProgressBar value={summary.count} max={summary.goal} tone="dark" label="Weekly goal progress" />
      <ol className="goal-card__days">
        {DAY_LETTER.map((letter, i) => {
          const done = summary.activeDays[i];
          return (
            <li key={DAY_SHORT[i]} className={cx('goal-day', done && 'goal-day--done', i === today && 'goal-day--today')}>
              <span className="goal-day__dot" aria-hidden="true">
                {done && <Icon name="check" size={16} />}
              </span>
              <span className="goal-day__label" aria-hidden="true">
                <span className="hide-desktop">{letter}</span>
                <span className="hide-mobile">{DAY_SHORT[i]}</span>
              </span>
              <span className="sr-only">
                {DAY_SHORT[i]}: {done ? 'worked out' : 'no workout'}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="goal-card__note">
        {left === 0 ? 'Goal reached — nice consistency!' : `${plural(left, 'more workout')} to hit your goal`}
      </p>
    </section>
  );
}

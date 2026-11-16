import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import './Auth.css';

interface AuthLayoutProps {
  image: string;
  /** Big line over the photo on desktop. "\n" breaks the line. */
  headline: string;
  subline: string;
  title: string;
  subtitle: string;
  /** Phones: show the big "Lean Body Club" title instead of the form title. */
  mobileBrand?: boolean;
  children: ReactNode;
}

export function AuthLayout({ image, headline, subline, title, subtitle, mobileBrand = false, children }: AuthLayoutProps) {
  return (
    <div className={cx('auth', mobileBrand && 'auth--brand')}>
      <div className="auth__photo" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
      <div className="auth__hero" aria-hidden="true">
        <span className="auth__hero-brand">Lean Body Club</span>
        <div>
          <p className="auth__headline">{headline}</p>
          <p className="auth__subline">{subline}</p>
        </div>
      </div>
      <main className="auth__panel">
        {mobileBrand && (
          <div className="auth__mobile-brand" aria-hidden="true">
            <p className="auth__mobile-title">
              Lean Body
              <br />
              Club
            </p>
            <p className="auth__mobile-tag">Small groups. Steady habits.</p>
          </div>
        )}
        <div className="auth__form-wrap">
          <div className="auth__titles">
            <h1 className="auth__title">{title}</h1>
            <p className="auth__subtitle">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {children && <p className="empty-state__text">{children}</p>}
      {action}
    </div>
  );
}

/** Full-page loading placeholder. */
export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-loading" role="status">
      <span className="sr-only">{label}</span>
      <div className="skeleton" style={{ height: 36, width: '45%' }} />
      <div className="skeleton" style={{ height: 180 }} />
      <div className="skeleton" style={{ height: 120 }} />
    </div>
  );
}

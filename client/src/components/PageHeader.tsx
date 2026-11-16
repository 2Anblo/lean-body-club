import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import './PageHeader.css';

interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  /** Show a back button. Goes back in history when possible, otherwise to this path. */
  backTo?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, subtitle, backTo, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  function goBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(backTo ?? '/');
  }

  return (
    <header className="page-header">
      {backTo !== undefined && (
        <button type="button" className="icon-btn page-header__back" onClick={goBack} aria-label="Go back">
          <Icon name="back" size={20} />
        </button>
      )}
      <div className="page-header__titles">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-header__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

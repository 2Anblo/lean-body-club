import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { cx } from '../lib/cx';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Common {
  variant?: Variant;
  block?: boolean;
  size?: 'md' | 'sm';
  icon?: IconName;
  children: ReactNode;
}

function classes({ variant = 'primary', block, size = 'md' }: Omit<Common, 'children' | 'icon'>, extra?: string) {
  return cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', extra);
}

interface ButtonProps extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  loading?: boolean;
  loadingText?: string;
}

export function Button({ variant, block, size, icon, loading, loadingText, className, children, disabled, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={classes({ variant, block, size }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={18} />}
      <span>{loading ? (loadingText ?? children) : children}</span>
    </button>
  );
}

interface LinkButtonProps extends Common, Omit<LinkProps, 'children'> {}

export function LinkButton({ variant, block, size, icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={classes({ variant, block, size }, className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </Link>
  );
}

import { cx } from '../lib/cx';
import { initialsOf } from '../lib/people';
import './Avatar.css';

interface AvatarProps {
  name: string;
  size?: number;
  /** "auto" picks a stable shade from the name. */
  tone?: 'soft' | 'accent' | 'auto';
  className?: string;
}

function shadeFor(name: string): 'soft' | 'accent' {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 2 === 0 ? 'soft' : 'accent';
}

/** Initials avatar. Decorative: the person's name is always shown next to it. */
export function Avatar({ name, size = 36, tone = 'auto', className }: AvatarProps) {
  const shade = tone === 'auto' ? shadeFor(name) : tone;
  return (
    <span
      className={cx('avatar', `avatar--${shade}`, className)}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.34)) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

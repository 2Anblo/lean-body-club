import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useToast } from '../context/ToastContext';
import type { CheckIn } from '../types';
import { relativeTime } from '../lib/dates';
import { cx } from '../lib/cx';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import './CheckInCard.css';

interface Props {
  checkIn: CheckIn;
  /** Show which group it was posted to (used on Home). */
  showGroup?: boolean;
  /** False on the check-in's own page. */
  linkToPost?: boolean;
}

export function CheckInCard({ checkIn, showGroup = false, linkToPost = true }: Props) {
  const { showToast } = useToast();
  const [liked, setLiked] = useState(checkIn.likedByMe);
  const [likeCount, setLikeCount] = useState(checkIn.likeCount);
  const [pending, setPending] = useState(false);

  // Fresh data from the server wins.
  useEffect(() => {
    setLiked(checkIn.likedByMe);
    setLikeCount(checkIn.likeCount);
  }, [checkIn.id, checkIn.likedByMe, checkIn.likeCount]);

  async function toggleLike() {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => n + (next ? 1 : -1));
    setPending(true);
    try {
      if (next) await api.likeCheckIn(checkIn.id);
      else await api.unlikeCheckIn(checkIn.id);
    } catch (err) {
      setLiked(!next);
      setLikeCount((n) => n + (next ? -1 : 1));
      showToast(errorMessage(err), 'error');
    } finally {
      setPending(false);
    }
  }

  const url = `/posts/${checkIn.id}`;
  const time = <time dateTime={checkIn.createdAt}>{relativeTime(checkIn.createdAt)}</time>;
  const where = checkIn.group ? (showGroup ? ` · ${checkIn.group.name}` : '') : ' · Only you';

  return (
    <article className={cx('checkin-card', linkToPost && 'checkin-card--link')}>
      <header className="checkin-card__head">
        <Avatar name={checkIn.author.name} size={36} />
        <div className="checkin-card__who">
          <p className="checkin-card__author">{checkIn.author.name}</p>
          <p className="meta">
            {linkToPost ? (
              <Link to={url} className="stretched-link" aria-label={`Open ${checkIn.author.name}’s check-in`}>
                {time}
              </Link>
            ) : (
              time
            )}
            {where}
          </p>
        </div>
      </header>
      <div className="checkin-card__tags">
        <span className="tag tag--activity">{checkIn.activity}</span>
        <span className="tag">{checkIn.durationMin} min</span>
      </div>
      {checkIn.reflection && <p className="checkin-card__text">{checkIn.reflection}</p>}
      <footer className="checkin-card__foot">
        <button
          type="button"
          className={cx('react-btn', liked && 'react-btn--on')}
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={`${liked ? 'Unlike' : 'Like'} — ${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`}
        >
          <Icon name="heart" size={18} filled={liked} />
          <span>{likeCount}</span>
        </button>
        {linkToPost ? (
          <Link to={url} className="react-btn" aria-label={`${checkIn.commentCount} comments — open`}>
            <Icon name="comment" size={18} />
            <span>{checkIn.commentCount}</span>
          </Link>
        ) : (
          <span className="react-btn react-btn--static" aria-label={`${checkIn.commentCount} comments`}>
            <Icon name="comment" size={18} />
            <span>{checkIn.commentCount}</span>
          </span>
        )}
      </footer>
    </article>
  );
}

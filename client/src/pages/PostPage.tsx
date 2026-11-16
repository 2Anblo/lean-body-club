import { useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { Avatar } from '../components/Avatar';
import { LinkButton } from '../components/Button';
import { CheckInCard } from '../components/CheckInCard';
import { EmptyState, PageLoading } from '../components/EmptyState';
import { GroupSidebar } from '../components/GroupSidebar';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { useCurrentUser } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { relativeTime } from '../lib/dates';
import './PostPage.css';

export default function PostPage() {
  const { postId = '' } = useParams();
  const user = useCurrentUser();
  const { refresh } = useData();
  const { showToast } = useToast();
  const postQ = useApi(() => api.getCheckIn(postId), [postId]);
  const commentsQ = useApi(() => api.listComments(postId), [postId]);
  const groupId = postQ.data?.group?.id ?? null;
  const groupQ = useApi(() => (groupId ? api.getGroup(groupId) : Promise.resolve(null)), [groupId]);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await api.addComment(postId, body);
      setText('');
      refresh();
      showToast('Comment posted');
      window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 250);
    } catch (err) {
      showToast(errorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  }

  if (postQ.error) {
    return (
      <div>
        <PageHeader backTo="/" title="Check-in not found" />
        <EmptyState
          title="We couldn’t find that check-in"
          action={
            <LinkButton to="/" variant="secondary">
              Go home
            </LinkButton>
          }
        >
          It may have been deleted, or it’s private.
        </EmptyState>
      </div>
    );
  }

  const post = postQ.data;
  if (!post) return <PageLoading label="Loading check-in…" />;
  const comments = commentsQ.data ?? [];

  return (
    <div className="post-page">
      <PageHeader backTo={post.group ? `/groups/${post.group.id}` : '/'} eyebrow={post.group?.name ?? 'Private check-in'} title="Check-in" />
      <div className="two-col">
        <div className="stack-sm">
          <CheckInCard checkIn={post} linkToPost={false} />
          <h2 className="section-title post-page__count">Comments ({post.commentCount})</h2>
          {commentsQ.data && comments.length === 0 && <p className="meta">No comments yet. Say something encouraging!</p>}
          <ol className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className="comment">
                <Avatar name={c.author.name} size={36} tone={c.author.id === user.id ? 'soft' : 'auto'} />
                <div className="comment__bubble">
                  <p className="comment__head">
                    <span className="comment__name">{c.author.name}</span>
                    <time className="meta" dateTime={c.createdAt}>
                      {relativeTime(c.createdAt)}
                    </time>
                  </p>
                  <p className="comment__text">{c.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div ref={endRef} />
          <form className="comment-form" onSubmit={send}>
            <Avatar name={user.name} size={36} tone="soft" />
            <label htmlFor="comment-input" className="sr-only">
              Add a comment
            </label>
            <input
              id="comment-input"
              className="comment-form__input"
              placeholder="Add some encouragement…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              autoComplete="off"
            />
            <button type="submit" className="comment-form__send" disabled={!text.trim() || sending} aria-label="Send comment">
              <Icon name="send" size={18} />
            </button>
          </form>
        </div>
        {groupQ.data && <GroupSidebar group={groupQ.data} />}
      </div>
    </div>
  );
}

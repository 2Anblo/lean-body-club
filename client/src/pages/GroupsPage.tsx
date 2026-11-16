import { useState } from 'react';
import { api } from '../api';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { GroupCard } from '../components/GroupCard';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { useApi } from '../hooks/useApi';
import { GROUP_CATEGORIES } from '../types';
import './GroupsPage.css';

const FILTERS = ['All', ...GROUP_CATEGORIES];

export default function GroupsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const groups = useApi(
    () => api.listGroups({ q: query, category: filter === 'All' ? undefined : filter }),
    [query, filter],
    { keepPrevious: true },
  );

  const list = groups.data ?? [];
  const mine = list.filter((g) => g.isMember);
  const others = list.filter((g) => !g.isMember);
  const filtered = query.trim() !== '' || filter !== 'All';

  function clear() {
    setQuery('');
    setFilter('All');
  }

  return (
    <div className="groups-page">
      <PageHeader title="Groups" subtitle="Find people who train like you" />

      <div className="groups-page__controls">
        <label className="search">
          <span className="sr-only">Search groups</span>
          <Icon name="search" size={20} className="search__icon" />
          <input
            type="search"
            className="search__input"
            placeholder="Search groups"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filters" role="group" aria-label="Filter by type">
          {FILTERS.map((f) => (
            <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {groups.data ? `${list.length} ${list.length === 1 ? 'group' : 'groups'} found` : ''}
      </p>

      {!groups.data ? (
        <div className="group-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 82 }} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="No groups match"
          action={
            <Button variant="secondary" onClick={clear}>
              Clear search
            </Button>
          }
        >
          Try a different word, or browse all groups.
        </EmptyState>
      ) : (
        <div className="stack">
          {mine.length > 0 && (
            <section className="stack-sm" aria-labelledby="your-groups">
              <h2 id="your-groups" className="section-title">
                Your groups
              </h2>
              <div className="group-grid">
                {mine.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section className="stack-sm" aria-labelledby="more-groups">
              <h2 id="more-groups" className="section-title">
                {filtered ? 'Results' : mine.length > 0 ? 'More groups' : 'Suggested for beginners'}
              </h2>
              <div className="group-grid">
                {others.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

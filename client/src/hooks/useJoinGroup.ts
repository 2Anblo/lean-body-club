import { useCallback } from 'react';
import { api, errorMessage } from '../api';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import type { Group } from '../types';

/** Join a group, refresh every screen, and confirm with a toast. Returns true on success. */
export function useJoinGroup() {
  const { refresh } = useData();
  const { showToast } = useToast();
  return useCallback(
    async (group: Pick<Group, 'id' | 'name'>) => {
      try {
        await api.joinGroup(group.id);
        refresh();
        showToast(`You joined ${group.name}`);
        return true;
      } catch (err) {
        showToast(errorMessage(err), 'error');
        return false;
      }
    },
    [refresh, showToast],
  );
}

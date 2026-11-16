import type {
  CheckIn,
  Comment,
  Group,
  GroupDetail,
  NewCheckIn,
  Session,
  SignUpInput,
  User,
  UserPatch,
  WeekSummary,
} from '../types';

/**
 * Everything the UI needs from the backend. Both the mock (localStorage) and the
 * real REST client implement this, so pages never care which one is running.
 */
export interface Api {
  signIn(email: string, password: string): Promise<Session>;
  signUp(input: SignUpInput): Promise<Session>;
  me(): Promise<User>;
  signOut(): Promise<void>;
  updateMe(patch: UserPatch): Promise<User>;
  myWeek(): Promise<WeekSummary>;

  listGroups(params?: { q?: string; category?: string }): Promise<Group[]>;
  getGroup(id: string): Promise<GroupDetail>;
  joinGroup(id: string): Promise<Group>;
  leaveGroup(id: string): Promise<Group>;
  groupFeed(id: string): Promise<CheckIn[]>;
  homeFeed(): Promise<CheckIn[]>;

  createCheckIn(input: NewCheckIn): Promise<CheckIn>;
  getCheckIn(id: string): Promise<CheckIn>;
  likeCheckIn(id: string): Promise<CheckIn>;
  unlikeCheckIn(id: string): Promise<CheckIn>;

  listComments(checkInId: string): Promise<Comment[]>;
  addComment(checkInId: string, text: string): Promise<Comment>;

  /** Mock only: wipe local data back to the demo seed. */
  resetDemo?(): Promise<void>;
}

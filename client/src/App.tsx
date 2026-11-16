import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { UIProvider } from './context/UIContext';
import { AppShell } from './layout/AppShell';
import { PublicOnly, RequireAuth } from './layout/RouteGuards';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import AccountPage from './pages/AccountPage';
import GroupPage from './pages/GroupPage';
import GroupsPage from './pages/GroupsPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import PostPage from './pages/PostPage';
import ProgressPage from './pages/ProgressPage';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <UIProvider>
            <Routes>
              <Route element={<PublicOnly />}>
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
              </Route>
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="groups/:groupId" element={<GroupPage />} />
                  <Route path="posts/:postId" element={<PostPage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="account" element={<AccountPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </UIProvider>
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}

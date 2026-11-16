import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_MODE, errorMessage } from '../../api';
import { DEMO_ACCOUNT } from '../../api/mockDb';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export default function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (next.email || next.password) return;

    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      image="/images/morning-runners.jpg"
      headline={'Small groups.\nSteady habits.'}
      subline="Check in, cheer each other on, and hit your weekly goal — together."
      title="Welcome back"
      subtitle="Sign in with your Illinois email"
      mobileBrand
    >
      <form className="auth__form" onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          inputMode="email"
          placeholder="netid@illinois.edu"
          error={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          error={errors.password}
        />
        {errors.form && (
          <p className="auth__alert" role="alert">
            <Icon name="alert" size={18} />
            <span>{errors.form}</span>
          </p>
        )}
        <Button type="submit" block loading={loading} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
      <p className="auth__switch">
        <span>New here?</span>
        <Link to="/signup" className="text-link">
          Create an account
        </Link>
      </p>
      {API_MODE === 'mock' && (
        <button
          type="button"
          className="text-link auth__demo"
          onClick={() => {
            setEmail(DEMO_ACCOUNT.email);
            setPassword(DEMO_ACCOUNT.password);
            setErrors({});
          }}
        >
          Use the demo account
        </button>
      )}
    </AuthLayout>
  );
}

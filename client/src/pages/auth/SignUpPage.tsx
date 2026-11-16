import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api';
import { Button } from '../../components/Button';
import { Chip, ChipGroup } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

const ILLINOIS_EMAIL = /^[^\s@]+@illinois\.edu$/i;

type Errors = { name?: string; email?: string; password?: string; form?: string };

export default function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [goal, setGoal] = useState(3);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!email.trim()) next.email = 'Enter your Illinois email.';
    else if (!ILLINOIS_EMAIL.test(email.trim())) next.email = 'Use your @illinois.edu address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    return next;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password, weeklyGoal: goal });
      navigate('/', { replace: true });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      image="/images/gym-beginners.jpg"
      headline={'Start small.\nShow up together.'}
      subline="Pick a weekly goal you can keep. Your group will help you hit it."
      title="Create account"
      subtitle="Join with your Illinois email"
    >
      <form className="auth__form" onSubmit={onSubmit} noValidate>
        <TextField label="Name" value={name} onChange={setName} autoComplete="name" error={errors.name} maxLength={60} />
        <TextField
          label="Illinois email"
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
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password}
        />
        <ChipGroup label="Workouts per week" hint="Start small — you can change this anytime.">
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip key={n} selected={goal === n} onClick={() => setGoal(n)} ariaLabel={`${n} per week`}>
              {n}
            </Chip>
          ))}
        </ChipGroup>
        {errors.form && (
          <p className="auth__alert" role="alert">
            <Icon name="alert" size={18} />
            <span>{errors.form}</span>
          </p>
        )}
        <Button type="submit" block loading={loading} loadingText="Creating account…">
          Create account
        </Button>
      </form>
      <p className="auth__switch">
        <span>Already have an account?</span>
        <Link to="/signin" className="text-link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

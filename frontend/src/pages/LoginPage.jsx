import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../api/client';
import { hasErrors, validateLogin } from '../utils/validation';
import AuthLayout from '../components/AuthLayout';
import Alert from '../components/Alert';
import { TextField } from '../components/FormField';
import { Spinner } from '../components/Spinner';

// Seeded accounts (created by `npm run seed` in the backend).
const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@helpdesk.dev', password: 'Admin@12345' },
  { role: 'User', email: 'user@helpdesk.dev', password: 'User@12345' },
];

function DemoAccounts({ onPick }) {
  return (
    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4 text-sm">
      <p className="mb-2 flex items-center gap-2 font-medium text-indigo-900">
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        Demo accounts
      </p>
      <ul className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-indigo-900">
              <span className="font-medium">{account.role}:</span>{' '}
              <code className="text-xs">{account.email}</code> / <code className="text-xs">{account.password}</code>
            </span>
            <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-800" onClick={() => onPick(account)}>
              Use
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sessionExpired = searchParams.get('expired') === '1';

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const clientErrors = validateLogin(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      // No navigate() here: once `user` is set, <GuestRoute> redirects us.
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back! Log in to manage your support tickets."
      footer={<DemoAccounts onPick={({ email, password }) => setValues({ email, password })} />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {sessionExpired && !formError && <Alert variant="info">Your session has expired. Please log in again.</Alert>}
        <Alert onClose={() => setFormError('')}>{formError}</Alert>

        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          autoFocus
        />
        <TextField
          id="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner />}
          Sign in
        </button>

        <p className="text-center text-sm text-slate-600">
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-800">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

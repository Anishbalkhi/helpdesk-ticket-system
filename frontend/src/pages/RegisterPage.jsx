import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../api/client';
import { hasErrors, validateRegister } from '../utils/validation';
import AuthLayout from '../components/AuthLayout';
import Alert from '../components/Alert';
import { TextField } from '../components/FormField';
import { Spinner } from '../components/Spinner';

export default function RegisterPage() {
  const { register } = useAuth();

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const clientErrors = validateRegister(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      // The API returns a token, so the new user is logged in and <GuestRoute> redirects.
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create an account" subtitle="Raise and track support tickets in one place.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert onClose={() => setFormError('')}>{formError}</Alert>

        <TextField
          id="name"
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          maxLength={60}
          autoFocus
        />
        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          id="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          hint="8–72 characters, with at least one letter and one number"
          maxLength={72}
        />

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting && <Spinner />}
          Create account
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

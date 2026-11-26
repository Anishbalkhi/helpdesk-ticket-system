import { useState } from 'react';
import { parseApiError } from '../api/client';
import { CATEGORIES, PRIORITIES } from '../utils/constants';
import { enumLabel } from '../utils/format';
import { hasErrors, validateTicket } from '../utils/validation';
import Alert from './Alert';
import { SelectField, TextAreaField, TextField } from './FormField';
import { Spinner } from './Spinner';

const EMPTY_TICKET = { title: '', description: '', category: '', priority: 'medium' };

const toOptions = (values) => values.map((value) => ({ value, label: enumLabel(value) }));

/**
 * Shared by "New ticket" and the inline "Edit ticket" form.
 *
 * The form validates on the client first. Then it calls `onSubmit(values)`;
 * if that throws an API error, the server's field errors are shown under the
 * matching inputs and the message is shown on top.
 */
export default function TicketForm({ initialValues = EMPTY_TICKET, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY_TICKET, ...initialValues });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // clear the error of the field being fixed
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const clientErrors = validateTicket(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
      });
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
    // on success the parent navigates away / closes the form, so we don't reset `submitting`
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Alert onClose={() => setFormError('')}>{formError}</Alert>

      <TextField
        id="title"
        label="Title"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        hint="5–120 characters, e.g. “Cannot reset my password”"
        maxLength={120}
        autoFocus
      />

      <TextAreaField
        id="description"
        label="Description"
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        hint={`Describe the problem and the steps to reproduce it. ${values.description.length}/5000`}
        rows={6}
        maxLength={5000}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="category"
          label="Category"
          value={values.category}
          onChange={handleChange}
          error={errors.category}
          options={toOptions(CATEGORIES)}
          placeholder="Choose a category"
        />
        <SelectField
          id="priority"
          label="Priority"
          value={values.priority}
          onChange={handleChange}
          error={errors.priority}
          options={toOptions(PRIORITIES)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <Spinner />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

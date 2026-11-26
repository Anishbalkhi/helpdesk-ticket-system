// Client-side checks that mirror the API rules in docs/API.md.
// The server validates again; these only give faster feedback.
// Every function returns an object like { fieldName: 'message' } (empty = valid).

import { CATEGORIES, PRIORITIES } from './constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkLength(value, min, max, label) {
  const length = value.trim().length;
  if (length < min) return `${label} must be at least ${min} characters`;
  if (length > max) return `${label} must be at most ${max} characters`;
  return null;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateRegister({ name, email, password }) {
  const errors = {};

  const nameError = checkLength(name, 2, 60, 'Name');
  if (nameError) errors.name = nameError;

  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';

  if (password.length < 8 || password.length > 72) {
    errors.password = 'Password must be 8–72 characters';
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number';
  }

  return errors;
}

export function validateTicket({ title, description, category, priority }) {
  const errors = {};

  const titleError = checkLength(title, 5, 120, 'Title');
  if (titleError) errors.title = titleError;

  const descriptionError = checkLength(description, 10, 5000, 'Description');
  if (descriptionError) errors.description = descriptionError;

  if (!CATEGORIES.includes(category)) errors.category = 'Choose a category';
  if (priority && !PRIORITIES.includes(priority)) errors.priority = 'Choose a valid priority';

  return errors;
}

export function validateComment(body) {
  const length = body.trim().length;
  if (length === 0) return 'Comment cannot be empty';
  if (length > 2000) return 'Comment must be at most 2000 characters';
  return null;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;

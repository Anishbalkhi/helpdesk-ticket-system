// Label + control + error message, so every form looks and behaves the same.

function FieldWrapper({ id, label, error, hint, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function controlProps(id, error, className) {
  return {
    id,
    name: id,
    className: `input ${error ? 'input-error' : ''} ${className}`,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
}

export function TextField({ id, label, error, hint, className = '', ...rest }) {
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <input {...controlProps(id, error, className)} {...rest} />
    </FieldWrapper>
  );
}

export function TextAreaField({ id, label, error, hint, className = '', ...rest }) {
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <textarea {...controlProps(id, error, className)} {...rest} />
    </FieldWrapper>
  );
}

/** `options` is a list of { value, label }. */
export function SelectField({ id, label, error, hint, options, placeholder, className = '', ...rest }) {
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <select {...controlProps(id, error, className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

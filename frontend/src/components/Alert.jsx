import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const VARIANTS = {
  error: { icon: AlertCircle, classes: 'border-red-200 bg-red-50 text-red-800' },
  success: { icon: CheckCircle2, classes: 'border-green-200 bg-green-50 text-green-800' },
  info: { icon: Info, classes: 'border-blue-200 bg-blue-50 text-blue-800' },
};

/** Coloured message box. Pass `onClose` to show a dismiss button. */
export default function Alert({ variant = 'error', children, onClose, className = '' }) {
  if (!children) return null;
  const { icon: Icon, classes } = VARIANTS[variant];

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${classes} ${className}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

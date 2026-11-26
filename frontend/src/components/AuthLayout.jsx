import { LifeBuoy } from 'lucide-react';

/** Centered card used by the Login and Register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
        </span>
        HelpDesk
      </div>

      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>

      {footer && <div className="mt-6 w-full max-w-md">{footer}</div>}
    </div>
  );
}

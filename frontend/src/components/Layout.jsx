import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/** Shell for every logged-in page: navbar on top, page content below. */
export default function Layout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

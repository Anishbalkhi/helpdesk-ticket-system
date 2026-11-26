import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="card">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Link to="/tickets" className="btn btn-primary">
            Go to tickets
          </Link>
        }
      />
    </div>
  );
}

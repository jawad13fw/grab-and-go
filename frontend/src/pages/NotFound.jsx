import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
          <p className="text-2xl font-semibold text-slate-800 mb-2">Page Not Found</p>
          <p className="text-slate-600">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </Link>
          
          <div className="text-sm text-slate-500">
            <p>You might want to:</p>
            <ul className="mt-2 space-y-1 text-left list-disc list-inside">
              <li>Check the URL for typos</li>
              <li>Go back to the previous page</li>
              <li>Visit our <Link to="/home" className="text-primary hover:underline">homepage</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

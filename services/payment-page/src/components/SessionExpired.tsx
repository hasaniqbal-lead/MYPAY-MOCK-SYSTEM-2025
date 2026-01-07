import { ThemeConfiguration } from '../types';

interface SessionExpiredProps {
  config: ThemeConfiguration | null;
}

function SessionExpired({ config }: SessionExpiredProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {config?.text.messages.expired || 'Session Expired'}
        </h2>
        <p className="text-text-secondary mb-6">
          This payment session has expired or is no longer valid.
          Please request a new payment link from the merchant.
        </p>

        <div className="bg-surface rounded-xl p-4">
          <p className="text-sm text-text-secondary">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SessionExpired;

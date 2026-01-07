import { ThemeConfiguration } from '../types';

interface PaymentFailureProps {
  config: ThemeConfiguration;
  error: string | null;
  onRetry: () => void;
}

function PaymentFailure({ config, error, onRetry }: PaymentFailureProps) {
  const failureConfig = config.resultPages.failure;
  const visibility = config.visibility?.failure;

  return (
    <div className="text-center py-8 animate-fade-in">
      {visibility?.showIcon !== false && (
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      )}

      {visibility?.showMessage !== false && (
        <>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {failureConfig.message || config.text.messages.failure}
          </h2>
          {failureConfig.submessage && (
            <p className="text-text-secondary mb-4">{failureConfig.submessage}</p>
          )}
        </>
      )}

      {visibility?.showErrorDetails !== false && error && (
        <div className="bg-surface rounded-xl p-4 mb-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {visibility?.showRetryButton !== false && failureConfig.showRetry && (
        <button
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-8 rounded-xl transition-colors mb-4"
        >
          {config.text.buttons.retry || 'Try Again'}
        </button>
      )}

      {visibility?.showSupportInfo !== false && failureConfig.showSupport && (
        <div className="mt-6 text-sm text-text-secondary">
          <p>Need help? Contact support</p>
          {failureConfig.supportEmail && (
            <a
              href={`mailto:${failureConfig.supportEmail}`}
              className="text-primary hover:underline"
            >
              {failureConfig.supportEmail}
            </a>
          )}
          {failureConfig.supportPhone && (
            <p className="mt-1">
              <a
                href={`tel:${failureConfig.supportPhone}`}
                className="text-primary hover:underline"
              >
                {failureConfig.supportPhone}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentFailure;

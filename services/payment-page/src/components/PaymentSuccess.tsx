import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ThemeConfiguration, PaymentSession } from '../types';

interface PaymentSuccessProps {
  config: ThemeConfiguration;
  session: PaymentSession;
}

function PaymentSuccess({ config, session }: PaymentSuccessProps) {
  const successConfig = config.resultPages.success;
  const visibility = config.visibility?.success;

  // Trigger confetti on mount
  useEffect(() => {
    if (successConfig.showConfetti && visibility?.showConfetti !== false) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [config.colors.primary, config.colors.success, '#FFD700'],
      });
    }
  }, [successConfig.showConfetti, visibility?.showConfetti, config.colors]);

  // Auto redirect if configured
  useEffect(() => {
    if (successConfig.autoRedirect && successConfig.ctaUrl) {
      const delay = (successConfig.autoRedirectDelay || 5) * 1000;
      const timer = setTimeout(() => {
        window.location.href = successConfig.ctaUrl!;
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [successConfig]);

  return (
    <div className="text-center py-8 animate-fade-in">
      {visibility?.showIcon !== false && (
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {visibility?.showMessage !== false && (
        <>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {successConfig.message || config.text.messages.success}
          </h2>
          {successConfig.submessage && (
            <p className="text-text-secondary mb-6">{successConfig.submessage}</p>
          )}
        </>
      )}

      {visibility?.showTransactionId !== false && successConfig.showTransactionId && (
        <div className="bg-surface rounded-xl p-4 mb-6">
          <p className="text-sm text-text-secondary">Transaction Reference</p>
          <p className="font-mono text-text-primary">{session.reference}</p>
        </div>
      )}

      {visibility?.showAmount !== false && (
        <div className="bg-surface rounded-xl p-4 mb-6">
          <p className="text-sm text-text-secondary">Amount Paid</p>
          <p className="text-xl font-bold text-text-primary">
            {session.currency} {session.amount.toLocaleString()}
          </p>
        </div>
      )}

      {visibility?.showCTA !== false && successConfig.ctaText && successConfig.ctaUrl && (
        <a
          href={successConfig.ctaUrl}
          className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-3 px-8 rounded-xl transition-colors"
        >
          {successConfig.ctaText}
        </a>
      )}

      {successConfig.autoRedirect && successConfig.ctaUrl && (
        <p className="text-sm text-text-secondary mt-4">
          Redirecting in {successConfig.autoRedirectDelay || 5} seconds...
        </p>
      )}
    </div>
  );
}

export default PaymentSuccess;

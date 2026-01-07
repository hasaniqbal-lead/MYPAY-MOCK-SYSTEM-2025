import { ThemeConfiguration } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface PaymentProcessingProps {
  config: ThemeConfiguration;
}

function PaymentProcessing({ config }: PaymentProcessingProps) {
  const visibility = config.visibility?.processing;

  return (
    <div className="text-center py-12">
      {visibility?.showSpinner !== false && (
        <LoadingSpinner size="lg" className="mb-6" />
      )}
      {visibility?.showMessage !== false && (
        <>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            {config.text.messages.processing || 'Processing your payment...'}
          </h2>
          <p className="text-text-secondary">
            Please wait while we process your transaction
          </p>
        </>
      )}
    </div>
  );
}

export default PaymentProcessing;

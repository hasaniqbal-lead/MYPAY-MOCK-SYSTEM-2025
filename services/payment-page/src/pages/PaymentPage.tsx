import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaymentSession, completePayment } from '../services/api';
import { mergeWithDefaults } from '../config/defaults';
import { applyTheme } from '../config/theme-engine';
import { PaymentStage, PaymentMethod, ThemeConfiguration, PaymentSession } from '../types';

// Components
import ChannelSelection from '../components/ChannelSelection';
import UserInputForm from '../components/UserInputForm';
import OTPVerification from '../components/OTPVerification';
import PaymentProcessing from '../components/PaymentProcessing';
import PaymentSuccess from '../components/PaymentSuccess';
import PaymentFailure from '../components/PaymentFailure';
import SessionExpired from '../components/SessionExpired';
import LoadingSpinner from '../components/LoadingSpinner';

function PaymentPage() {
  const { checkoutId } = useParams<{ checkoutId: string }>();
  const [stage, setStage] = useState<PaymentStage>('loading');
  const [selectedChannel, setSelectedChannel] = useState<PaymentMethod | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ThemeConfiguration | null>(null);

  // Fetch session data
  const { data: sessionData, isLoading, isError } = useQuery({
    queryKey: ['session', checkoutId],
    queryFn: () => getPaymentSession(checkoutId!),
    enabled: !!checkoutId,
    retry: 1,
  });

  // Apply theme when session data is loaded
  useEffect(() => {
    if (sessionData?.session) {
      const mergedConfig = mergeWithDefaults(sessionData.session.configuration);
      setConfig(mergedConfig);
      applyTheme(mergedConfig);

      // Check session status
      if (sessionData.session.status === 'completed') {
        setStage('success');
      } else if (sessionData.session.status === 'failed') {
        setStage('failure');
      } else if (sessionData.session.status === 'expired') {
        setStage('expired');
      } else {
        // If a specific payment method was pre-selected (not "all"), skip channel selection
        const method = (sessionData.session as any).paymentMethod;
        if (method && method !== 'all') {
          setSelectedChannel(method as PaymentMethod);
          setStage('user_input');
        } else {
          setStage('channel_selection');
        }
      }
    }
  }, [sessionData]);

  // Handle channel selection
  const handleChannelSelect = (channel: PaymentMethod) => {
    setSelectedChannel(channel);
    setStage('user_input');
  };

  // Handle form submission
  const handleFormSubmit = async (data: { mobileNumber?: string; cardNumber?: string }) => {
    if (data.mobileNumber) setMobileNumber(data.mobileNumber);
    setStage('processing');
    setError(null);

    try {
      const result = await completePayment(checkoutId!, data);

      if (result.requiresOTP) {
        setStage('otp_verification');
      } else if (result.success || result.status === 'completed' || result.status === 'success') {
        setStage('success');
      } else {
        setError(result.message || 'Payment failed');
        setStage('failure');
      }
    } catch (err) {
      setError('An error occurred while processing your payment');
      setStage('failure');
    }
  };

  // Handle OTP verification
  const handleOTPSubmit = async (otp: string) => {
    setStage('processing');
    setError(null);

    try {
      const result = await completePayment(checkoutId!, {
        mobileNumber,
        otp,
      });

      if (result.success || result.status === 'completed' || result.status === 'success') {
        setStage('success');
      } else {
        setError(result.message || 'OTP verification failed');
        setStage('failure');
      }
    } catch (err) {
      setError('An error occurred during OTP verification');
      setStage('failure');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (stage === 'user_input') {
      setSelectedChannel(null);
      setStage('channel_selection');
    } else if (stage === 'otp_verification') {
      setStage('user_input');
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setStage('channel_selection');
    setSelectedChannel(null);
    setMobileNumber('');
  };

  // Loading state
  if (isLoading || stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (isError || !sessionData?.session) {
    return <SessionExpired config={config} />;
  }

  const session = sessionData.session;

  // Render current stage
  return (
    <div className="min-h-screen bg-background">
      <div
        className="mx-auto py-8 px-4"
        style={{ maxWidth: config?.layout.maxWidth || '28rem' }}
      >
        {/* Header */}
        <Header session={session} config={config} />

        {/* Amount display */}
        <AmountDisplay amount={session.amount} currency={session.currency} config={config} />

        {/* Stage content */}
        <div className="mt-6 animate-fade-in">
          {stage === 'channel_selection' && (
            <ChannelSelection
              config={config!}
              onSelect={handleChannelSelect}
              allowedMethods={(session as any).allowedMethods || null}
            />
          )}

          {stage === 'user_input' && selectedChannel && (
            <UserInputForm
              config={config!}
              channel={selectedChannel}
              onSubmit={handleFormSubmit}
              onBack={handleBack}
            />
          )}

          {stage === 'otp_verification' && (
            <OTPVerification
              config={config!}
              mobileNumber={mobileNumber}
              onSubmit={handleOTPSubmit}
              onBack={handleBack}
              onResend={() => handleFormSubmit({ mobileNumber })}
            />
          )}

          {stage === 'processing' && (
            <PaymentProcessing config={config!} />
          )}

          {stage === 'success' && (
            <PaymentSuccess
              config={config!}
              session={session}
            />
          )}

          {stage === 'failure' && (
            <PaymentFailure
              config={config!}
              error={error}
              onRetry={handleRetry}
            />
          )}

          {stage === 'expired' && (
            <SessionExpired config={config} />
          )}
        </div>

        {/* Footer */}
        <Footer config={config} />
      </div>
    </div>
  );
}

// Header component
function Header({
  session,
  config,
}: {
  session: PaymentSession;
  config: ThemeConfiguration | null;
}) {
  const visibility = config?.visibility?.header;
  const showLogo = visibility?.showMerchantLogo !== false;
  const showName = visibility?.showMerchantName !== false;
  const showRef = visibility?.showReferenceNumber !== false;

  return (
    <div className="text-center mb-6">
      {showLogo && config?.branding.merchantLogo && (
        <img
          src={config.branding.merchantLogo}
          alt={config.branding.merchantName}
          className="h-12 mx-auto mb-4"
        />
      )}
      {showName && (
        <h1 className="text-xl font-semibold text-text-primary">
          {config?.branding.merchantName || session.merchantName}
        </h1>
      )}
      {showRef && (
        <p className="text-sm text-text-secondary mt-1">
          Reference: {session.reference}
        </p>
      )}
    </div>
  );
}

// Amount display component
function AmountDisplay({
  amount,
  currency,
  config,
}: {
  amount: number;
  currency: string;
  config: ThemeConfiguration | null;
}) {
  const visibility = config?.visibility?.amount;
  if (visibility?.show === false) return null;

  const showLabel = visibility?.showLabel !== false;
  const showCurrency = visibility?.showCurrency !== false;

  return (
    <div className="bg-surface rounded-xl p-6 text-center">
      {showLabel && (
        <p className="text-sm text-text-secondary mb-1">
          {config?.text.amountLabel || 'Amount to Pay'}
        </p>
      )}
      <p className="text-3xl font-bold text-text-primary">
        {showCurrency && <span className="text-xl mr-1">{currency}</span>}
        {amount.toLocaleString()}
      </p>
    </div>
  );
}

// Footer component
function Footer({ config }: { config: ThemeConfiguration | null }) {
  const visibility = config?.visibility?.footer;
  if (visibility?.show === false) return null;

  const showPoweredBy = config?.advanced.showPoweredBy !== false;
  const showLegal = visibility?.showLegalLinks !== false;

  return (
    <div className="mt-8 text-center">
      {showLegal && config?.legal && (
        <div className="flex justify-center gap-4 text-sm text-text-secondary mb-4">
          {config.legal.showTerms && (
            <a href={config.legal.termsUrl || '#'} className="hover:text-primary">
              {config.legal.termsText || 'Terms'}
            </a>
          )}
          {config.legal.showPrivacy && (
            <a href={config.legal.privacyUrl || '#'} className="hover:text-primary">
              {config.legal.privacyText || 'Privacy'}
            </a>
          )}
        </div>
      )}
      {showPoweredBy && (
        <p className="text-xs text-text-disabled">
          Powered by{' '}
          <span className="text-primary font-medium">{import.meta.env.VITE_BRAND_NAME || 'Mint'}</span>
        </p>
      )}
    </div>
  );
}

export default PaymentPage;

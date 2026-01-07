import { useState, useRef, useEffect } from 'react';
import { ThemeConfiguration } from '../types';

interface OTPVerificationProps {
  config: ThemeConfiguration;
  mobileNumber: string;
  onSubmit: (otp: string) => void;
  onBack: () => void;
  onResend: () => void;
}

function OTPVerification({
  config,
  mobileNumber,
  onSubmit,
  onBack,
  onResend,
}: OTPVerificationProps) {
  const otpConfig = config.otpConfig;
  const otpLength = otpConfig?.length || 6;

  const [otp, setOtp] = useState<string[]>(new Array(otpLength).fill(''));
  const [timer, setTimer] = useState(otpConfig?.timeout || 60);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === otpLength && otpConfig?.autoSubmit !== false) {
      onSubmit(otpValue);
    }
  }, [otp, otpLength, otpConfig?.autoSubmit, onSubmit]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, otpLength - 1)]?.focus();
  };

  const handleResend = () => {
    const maxResends = otpConfig?.resendLimit || 3;
    if (resendCount >= maxResends) return;

    setResendCount((prev) => prev + 1);
    setTimer(otpConfig?.resendCooldown || 60);
    setCanResend(false);
    setOtp(new Array(otpLength).fill(''));
    onResend();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length === otpLength) {
      onSubmit(otpValue);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('92')) {
      return '0' + phone.slice(2, 5) + ' ' + phone.slice(5);
    }
    return phone;
  };

  const visibility = config.visibility?.otp;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <p className="text-text-secondary mb-2">
          Enter the {otpLength}-digit code sent to
        </p>
        <p className="text-text-primary font-medium">{formatPhone(mobileNumber)}</p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 bg-surface border border-border rounded-xl text-center text-xl font-semibold text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            autoFocus={index === 0}
          />
        ))}
      </div>

      {/* Timer and Resend */}
      <div className="text-center">
        {visibility?.showTimer !== false && !canResend && (
          <p className="text-text-secondary text-sm">
            Resend code in <span className="text-primary font-medium">{timer}s</span>
          </p>
        )}
        {visibility?.showResendButton !== false && canResend && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCount >= (otpConfig?.resendLimit || 3)}
            className="text-primary hover:text-primary/80 font-medium text-sm disabled:text-text-disabled disabled:cursor-not-allowed"
          >
            {resendCount >= (otpConfig?.resendLimit || 3)
              ? otpConfig?.messages?.maxResends || 'Maximum resends reached'
              : 'Resend Code'}
          </button>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-surface hover:bg-surface-light border border-border text-text-primary font-medium py-3 px-4 rounded-xl transition-colors"
        >
          {config.text.buttons.back || 'Back'}
        </button>
        <button
          type="submit"
          disabled={otp.join('').length !== otpLength}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
        >
          {config.text.buttons.continue || 'Verify'}
        </button>
      </div>
    </form>
  );
}

export default OTPVerification;

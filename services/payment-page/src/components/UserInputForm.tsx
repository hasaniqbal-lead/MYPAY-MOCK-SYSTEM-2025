import { useState } from 'react';
import { ThemeConfiguration, PaymentMethod } from '../types';

interface UserInputFormProps {
  config: ThemeConfiguration;
  channel: PaymentMethod;
  onSubmit: (phone: string) => void;
  onBack: () => void;
}

function UserInputForm({ config, channel, onSubmit, onBack }: UserInputFormProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const formConfig = config.formConfig?.phone;
  const visibility = config.visibility?.form;

  const validatePhone = (value: string): boolean => {
    // Pakistani phone number validation
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length < 10) {
      setError('Phone number must be at least 10 digits');
      return false;
    }

    if (formConfig?.pattern) {
      const regex = new RegExp(formConfig.pattern);
      if (!regex.test(cleaned)) {
        setError(formConfig?.errorMessages?.invalid || 'Invalid phone number format');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      return;
    }

    // Format phone number (add 92 if needed)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '92' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('92')) {
      formattedPhone = '92' + formattedPhone;
    }

    onSubmit(formattedPhone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setPhone(value);
      if (error) setError('');
    }
  };

  const channelName = channel === 'easypaisa' ? 'Easypaisa' : channel === 'jazzcash' ? 'JazzCash' : 'Card';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-surface rounded-xl p-4 mb-4">
        <p className="text-sm text-text-secondary">Selected Payment Method</p>
        <p className="font-medium text-text-primary">{channelName}</p>
      </div>

      {visibility?.showPhoneField !== false && (
        <div>
          {visibility?.showLabels !== false && (
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {formConfig?.label || 'Mobile Number'}
            </label>
          )}
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder={visibility?.showPlaceholders !== false
              ? (formConfig?.placeholder || '03XX XXXXXXX')
              : ''
            }
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            autoComplete="tel"
            inputMode="numeric"
          />
          {error && visibility?.showValidationErrors !== false && (
            <p className="mt-2 text-sm text-error">{error}</p>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-surface hover:bg-surface-light border border-border text-text-primary font-medium py-3 px-4 rounded-xl transition-colors"
        >
          {config.text.buttons.back || 'Back'}
        </button>
        <button
          type="submit"
          disabled={!phone}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
        >
          {config.text.buttons.continue || 'Continue'}
        </button>
      </div>
    </form>
  );
}

export default UserInputForm;

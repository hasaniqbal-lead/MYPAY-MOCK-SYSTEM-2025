import { useState } from 'react';
import { ThemeConfiguration, PaymentMethod } from '../types';

interface UserInputFormProps {
  config: ThemeConfiguration;
  channel: PaymentMethod;
  onSubmit: (data: { mobileNumber?: string; cardNumber?: string }) => void;
  onBack: () => void;
}

function UserInputForm({ config, channel, onSubmit, onBack }: UserInputFormProps) {
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [error, setError] = useState('');

  const isCard = channel === 'card';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isCard) {
      const cleaned = cardNumber.replace(/\s/g, '');
      if (cleaned.length < 15) {
        setError('Please enter a valid card number');
        return;
      }
      if (!expiry || expiry.length < 5) {
        setError('Please enter expiry date (MM/YY)');
        return;
      }
      if (!cvv || cvv.length < 3) {
        setError('Please enter CVV');
        return;
      }
      onSubmit({ cardNumber: cleaned });
    } else {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length < 10) {
        setError('Phone number must be at least 10 digits');
        return;
      }
      let formatted = cleaned;
      if (formatted.startsWith('0')) {
        formatted = formatted;
      }
      onSubmit({ mobileNumber: formatted });
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) return v.slice(0, 2) + '/' + v.slice(2);
    return v;
  };

  const channelName = channel === 'easypaisa' ? 'Easypaisa' : channel === 'jazzcash' ? 'JazzCash' : 'Card';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-surface rounded-xl p-4 mb-4">
        <p className="text-sm text-text-secondary">Selected Payment Method</p>
        <p className="font-medium text-text-primary">{channelName}</p>
      </div>

      {isCard ? (
        <>
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              inputMode="numeric"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Expiry */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                maxLength={5}
              />
            </div>

            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">CVV</label>
              <input
                type="password"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                inputMode="numeric"
                maxLength={4}
              />
            </div>
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Card Holder Name</label>
            <input
              type="text"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </>
      ) : (
        /* Mobile Number for Wallet */
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Mobile Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '');
              if (v.length <= 11) setPhone(v);
              if (error) setError('');
            }}
            placeholder="03XX XXXXXXX"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            autoComplete="tel"
            inputMode="numeric"
          />
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

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
          disabled={isCard ? !cardNumber : !phone}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
        >
          {config.text.buttons.continue || 'Continue'}
        </button>
      </div>
    </form>
  );
}

export default UserInputForm;

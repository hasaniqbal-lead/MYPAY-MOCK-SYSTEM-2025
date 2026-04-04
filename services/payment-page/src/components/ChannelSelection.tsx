import { ThemeConfiguration, PaymentMethod } from '../types';

// Channel icons as simple SVG components
const EasypaisaIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
    <span className="text-white font-bold text-sm">EP</span>
  </div>
);

const JazzCashIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
    <span className="text-white font-bold text-sm">JC</span>
  </div>
);

const CardIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  </div>
);

const channelData: Record<PaymentMethod, { name: string; description: string; Icon: React.FC }> = {
  easypaisa: {
    name: 'Easypaisa',
    description: 'Pay with your Easypaisa wallet',
    Icon: EasypaisaIcon,
  },
  jazzcash: {
    name: 'JazzCash',
    description: 'Pay with your JazzCash wallet',
    Icon: JazzCashIcon,
  },
  card: {
    name: 'Card',
    description: 'Pay with credit or debit card',
    Icon: CardIcon,
  },
  stripe: {
    name: 'Stripe',
    description: 'Pay with Stripe',
    Icon: CardIcon,
  },
  payfast: {
    name: 'PayFast',
    description: 'Pay with PayFast',
    Icon: CardIcon,
  },
  swich: {
    name: 'Swich',
    description: 'Pay with Swich',
    Icon: CardIcon,
  },
};

interface ChannelSelectionProps {
  config: ThemeConfiguration;
  onSelect: (channel: PaymentMethod) => void;
  allowedMethods?: string[] | null;
}

function ChannelSelection({ config, onSelect, allowedMethods }: ChannelSelectionProps) {
  // Filter by allowed methods from API key (if set)
  const configChannels = config.channels.enabled || ['easypaisa', 'jazzcash', 'card'];
  const enabledChannels = allowedMethods
    ? configChannels.filter(c => allowedMethods.includes(c))
    : configChannels;
  const showIcons = config.channels.showIcons !== false;
  const visibility = config.visibility?.channels;

  // Sort channels by order if specified
  const sortedChannels = [...enabledChannels].sort((a, b) => {
    const orderA = config.channels.channelOrder?.[a] ?? 999;
    const orderB = config.channels.channelOrder?.[b] ?? 999;
    return orderA - orderB;
  });

  // Filter by visibility
  const visibleChannels = sortedChannels.filter((channel) => {
    return config.channels.channelVisibility?.[channel] !== false;
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary mb-4">
        {config.text.channelSelectionLabel || 'Select Payment Method'}
      </p>

      {visibleChannels.map((channel) => {
        const data = channelData[channel];
        if (!data) return null;

        return (
          <button
            key={channel}
            onClick={() => onSelect(channel)}
            className="w-full bg-surface hover:bg-surface-light border border-border rounded-xl p-4 flex items-center gap-4 transition-colors group"
          >
            {showIcons && visibility?.showIcons !== false && <data.Icon />}
            <div className="flex-1 text-left">
              {visibility?.showNames !== false && (
                <p className="font-medium text-text-primary">{data.name}</p>
              )}
              {visibility?.showDescriptions !== false && (
                <p className="text-sm text-text-secondary">{data.description}</p>
              )}
            </div>
            {visibility?.showArrows !== false && (
              <svg
                className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ChannelSelection;

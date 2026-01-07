import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function generateApiKey(): string {
  return `mypay_${crypto.randomBytes(32).toString('hex')}`;
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function main() {
  console.log('🌱 Seeding unified database...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.paymentWebhookLog.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.scenarioMapping.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.payoutIdempotencyKey.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.merchantBalance.deleteMany();
  await prisma.bankDirectory.deleteMany();
  await prisma.walletDirectory.deleteMany();
  // Payment Page Configuration tables
  await prisma.paymentPageConfig.deleteMany();
  await prisma.paymentPageRule.deleteMany();
  await prisma.paymentPageTemplate.deleteMany();
  await prisma.merchant.deleteMany();

  // ============================================
  // SHARED DATA
  // ============================================

  console.log('\n📦 Creating shared data...');

  // Create banks
  const banks = [
    { code: 'HBL', name: 'Habib Bank Limited' },
    { code: 'UBL', name: 'United Bank Limited' },
    { code: 'MCB', name: 'MCB Bank Limited' },
    { code: 'ABL', name: 'Allied Bank Limited' },
    { code: 'JSBL', name: 'JS Bank Limited' },
    { code: 'BAHL', name: 'Bank Al Habib Limited' },
    { code: 'MEEZAN', name: 'Meezan Bank Limited' },
    { code: 'ASKARI', name: 'Askari Bank Limited' },
    { code: 'SONERI', name: 'Soneri Bank Limited' },
    { code: 'FBL', name: 'Faysal Bank Limited' },
    { code: 'BOP', name: 'Bank of Punjab' },
    { code: 'NBP', name: 'National Bank of Pakistan' },
  ];

  for (const bank of banks) {
    await prisma.bankDirectory.create({ data: bank });
  }
  console.log(`   ✅ Created ${banks.length} banks`);

  // Create wallets
  const wallets = [
    { code: 'EASYPAISA', name: 'Easypaisa' },
    { code: 'JAZZCASH', name: 'JazzCash' },
    { code: 'SADAPAY', name: 'SadaPay' },
    { code: 'NAYAPAY', name: 'NayaPay' },
  ];

  for (const wallet of wallets) {
    await prisma.walletDirectory.create({ data: wallet });
  }
  console.log(`   ✅ Created ${wallets.length} wallets`);

  // ============================================
  // TEST MERCHANT
  // ============================================

  console.log('\n👤 Creating test merchants...');

  // Merchant 1: test@mycodigital.io
  const payoutApiKey = generateApiKey();
  const hashedPayoutKey = hashApiKey(payoutApiKey);
  const portalPasswordHash = await bcrypt.hash('test123456', 10);

  const merchant = await prisma.merchant.create({
    data: {
      name: 'Test Merchant',
      company_name: 'Test Merchant Company',
      email: 'test@mycodigital.io',
      password_hash: portalPasswordHash,
      apiKey: hashedPayoutKey,
      apiKeyPlain: payoutApiKey, // Store plain key for portal display
      webhookUrl: 'https://webhook.site/test',
      isActive: true,
      status: 'active',
    },
  });

  console.log(`   ✅ Created merchant: ${merchant.name} (${merchant.email})`);

  // Create merchant balance
  await prisma.merchantBalance.create({
    data: {
      merchantId: merchant.id,
      balance: 1000000.0,
      lockedBalance: 0.0,
      version: 0,
    },
  });
  console.log('   ✅ Created merchant balance: 1,000,000 PKR');

  // Create Payment API key for merchant
  await prisma.apiKey.create({
    data: {
      vendor_id: `MERCHANT_${merchant.id.toString().padStart(6, '0')}`,
      api_key: 'test-api-key-123',
      api_secret: 'test-api-secret-456',
      merchant_id: merchant.id,
      is_active: true,
    },
  });
  console.log('   ✅ Created Payment API key');

  // Merchant 2: hasaniqbal@mycodigital.io
  const payoutApiKey2 = generateApiKey();
  const hashedPayoutKey2 = hashApiKey(payoutApiKey2);
  const portalPasswordHash2 = await bcrypt.hash('hasan123456', 10);

  const merchant2 = await prisma.merchant.create({
    data: {
      name: 'Hasan Iqbal',
      company_name: 'MyCo Digital',
      email: 'hasaniqbal@mycodigital.io',
      password_hash: portalPasswordHash2,
      apiKey: hashedPayoutKey2,
      apiKeyPlain: payoutApiKey2, // Store plain key for portal display
      webhookUrl: 'https://webhook.site/hasan',
      isActive: true,
      status: 'active',
    },
  });

  console.log(`   ✅ Created merchant: ${merchant2.name} (${merchant2.email})`);

  // Create merchant balance
  await prisma.merchantBalance.create({
    data: {
      merchantId: merchant2.id,
      balance: 2000000.0,
      lockedBalance: 0.0,
      version: 0,
    },
  });
  console.log('   ✅ Created merchant balance: 2,000,000 PKR');

  // Create Payment API key for merchant 2
  await prisma.apiKey.create({
    data: {
      vendor_id: `MERCHANT_${merchant2.id.toString().padStart(6, '0')}`,
      api_key: 'hasan-api-key-789',
      api_secret: 'hasan-api-secret-012',
      merchant_id: merchant2.id,
      is_active: true,
    },
  });
  console.log('   ✅ Created Payment API key');

  // ============================================
  // PAYMENT SCENARIOS
  // ============================================

  console.log('\n🧪 Creating payment test scenarios...');

  const scenarios = [
    { mobile_number: '03030000000', scenario: 'success', status: 'completed', status_code: 'SUCCESS', description: 'Payment successful' },
    { mobile_number: '03021111111', scenario: 'failed', status: 'failed', status_code: 'FAILED', description: 'Transaction failed' },
    { mobile_number: '03032222222', scenario: 'timeout', status: 'failed', status_code: 'TIMEOUT', description: 'Transaction timed-out' },
    { mobile_number: '03033333333', scenario: 'rejected', status: 'failed', status_code: 'REJECTED', description: 'Customer rejected transaction' },
    { mobile_number: '03034444444', scenario: 'invalid_otp', status: 'failed', status_code: 'INVALID_OTP', description: 'Customer entered invalid OTP' },
    { mobile_number: '03035555555', scenario: 'insufficient_funds', status: 'failed', status_code: 'INSUFFICIENT_FUNDS', description: 'Insufficient credit' },
    { mobile_number: '03036666666', scenario: 'account_deactivated', status: 'failed', status_code: 'ACCOUNT_DEACTIVATED', description: 'Account deactivated' },
    { mobile_number: '03037777777', scenario: 'no_response', status: 'failed', status_code: 'NO_RESPONSE', description: 'No response from wallet partner' },
    { mobile_number: '03038888888', scenario: 'invalid_mpin', status: 'failed', status_code: 'INVALID_MPIN', description: 'Customer entered invalid MPIN' },
    { mobile_number: '03039999999', scenario: 'not_approved', status: 'failed', status_code: 'NOT_APPROVED', description: "Customer didn't approve" },
  ];

  for (const scenario of scenarios) {
    await prisma.scenarioMapping.create({ data: scenario });
  }
  console.log(`   ✅ Created ${scenarios.length} payment test scenarios`);

  // ============================================
  // ADMIN USER
  // ============================================

  console.log('\n👑 Creating admin user...');

  const adminPasswordHash = await bcrypt.hash('admin@@1234', 10);

  await prisma.adminUser.create({
    data: {
      email: 'admin@mycodigital.io',
      password_hash: adminPasswordHash,
      name: 'System Administrator',
      role: 'super_admin',
      is_active: true,
    },
  });
  console.log('   ✅ Created admin user: admin@mycodigital.io');

  // ============================================
  // SYSTEM CONFIG
  // ============================================

  console.log('\n⚙️  Creating system config...');

  const configs = [
    { key: 'webhook_retry_attempts', value: '3', description: 'Number of webhook retry attempts' },
    { key: 'webhook_retry_delay', value: '5000', description: 'Delay between webhook retries (ms)' },
    { key: 'checkout_expiry_minutes', value: '15', description: 'Checkout session expiry time' },
    { key: 'maintenance_mode', value: 'false', description: 'System maintenance mode' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.create({ data: config });
  }
  console.log(`   ✅ Created ${configs.length} system configs`);

  // ============================================
  // PAYMENT PAGE TEMPLATES
  // ============================================

  console.log('\n🎨 Creating payment page templates...');

  // Template 1: Modern Minimal (Default)
  const modernMinimalConfig = {
    branding: {
      merchantLogo: '',
      merchantName: 'Your Business',
      favicon: '',
      backgroundImage: '',
      backgroundGradient: '',
    },
    colors: {
      primary: '#10B981',
      secondary: '#3B82F6',
      accent: '#10B981',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      background: '#0F172A',
      surface: '#1E293B',
      text: {
        primary: '#F8FAFC',
        secondary: '#94A3B8',
        disabled: '#64748B',
      },
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: { heading: '2xl', body: 'base', small: 'sm' },
      fontWeight: { heading: 600, body: 400 },
    },
    layout: {
      type: 'centered',
      maxWidth: 'md',
      padding: 'normal',
      borderRadius: 'lg',
      shadow: 'lg',
    },
    channels: {
      enabled: ['easypaisa', 'jazzcash', 'card'],
      displayStyle: 'list',
      showIcons: true,
      channelOrder: { easypaisa: 1, jazzcash: 2, card: 3 },
    },
    text: {
      heading: 'Select Payment Method',
      subheading: 'Choose how you would like to pay',
      amountLabel: 'Total to pay',
      channelSelectionLabel: 'Payment Options',
      buttons: {
        payNow: 'Pay Now',
        cancel: 'Cancel',
        retry: 'Try Again',
        back: 'Back',
        continue: 'Continue',
      },
      messages: {
        processing: 'Processing your payment...',
        success: 'Payment Successful!',
        failure: 'Payment Failed',
        expired: 'Session Expired',
      },
    },
    legal: {
      showTerms: true,
      termsUrl: '',
      termsDisplayMode: 'popup',
      showPrivacy: true,
      privacyUrl: '',
      privacyDisplayMode: 'popup',
      showRefund: false,
      refundUrl: '',
      refundDisplayMode: 'popup',
    },
    resultPages: {
      success: {
        showConfetti: true,
        message: 'Payment Successful!',
        submessage: 'Your payment has been processed.',
        showTransactionId: true,
        autoRedirect: false,
        autoRedirectDelay: 5,
      },
      failure: {
        message: 'Payment Failed',
        submessage: 'Something went wrong. Please try again.',
        showRetry: true,
        showSupport: true,
        supportEmail: 'support@example.com',
      },
    },
    advanced: {
      showPoweredBy: true,
      enableAnalytics: false,
      customCSS: '',
      customJS: '',
    },
  };

  await prisma.paymentPageTemplate.create({
    data: {
      name: 'Modern Minimal',
      slug: 'modern-minimal',
      category: 'general',
      description: 'Clean, professional dark theme suitable for any business. Features a sleek dark background with green accents.',
      thumbnail_url: null,
      configuration: modernMinimalConfig,
      tags: ['modern', 'minimal', 'dark', 'professional', 'default'],
      is_active: true,
      is_featured: true,
      usage_count: 0,
    },
  });
  console.log('   ✅ Created template: Modern Minimal');

  // Template 2: Ecommerce PKR
  const ecommercePKRConfig = {
    branding: {
      merchantLogo: '',
      merchantName: 'Your Store',
      favicon: '',
      backgroundImage: '',
      backgroundGradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    },
    colors: {
      primary: '#059669',
      secondary: '#0EA5E9',
      accent: '#F59E0B',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: {
        primary: '#1E293B',
        secondary: '#64748B',
        disabled: '#94A3B8',
      },
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: { heading: '2xl', body: 'base', small: 'sm' },
      fontWeight: { heading: 700, body: 400 },
    },
    layout: {
      type: 'centered',
      maxWidth: 'sm',
      padding: 'normal',
      borderRadius: 'xl',
      shadow: 'xl',
    },
    channels: {
      enabled: ['easypaisa', 'jazzcash', 'card'],
      displayStyle: 'grid',
      showIcons: true,
      channelOrder: { easypaisa: 1, jazzcash: 2, card: 3 },
      channelFeatures: {
        easypaisa: { badge: 'Popular', badgeColor: '#10B981' },
      },
    },
    text: {
      heading: 'Checkout',
      subheading: 'Complete your purchase securely',
      amountLabel: 'Order Total',
      channelSelectionLabel: 'Pay with',
      buttons: {
        payNow: 'Complete Payment',
        cancel: 'Cancel Order',
        retry: 'Retry Payment',
        back: 'Back',
        continue: 'Continue',
      },
      messages: {
        processing: 'Processing your order...',
        success: 'Order Confirmed!',
        failure: 'Payment Failed',
        expired: 'Session Expired',
      },
    },
    legal: {
      showTerms: true,
      termsUrl: '',
      termsDisplayMode: 'popup',
      showPrivacy: true,
      privacyUrl: '',
      privacyDisplayMode: 'popup',
      showRefund: true,
      refundText: '<h3>Refund Policy</h3><p>Returns accepted within 7 days of purchase. Original packaging required.</p>',
      refundDisplayMode: 'popup',
    },
    resultPages: {
      success: {
        showConfetti: true,
        message: 'Order Confirmed!',
        submessage: 'You will receive a confirmation email shortly.',
        ctaText: 'Continue Shopping',
        showTransactionId: true,
        autoRedirect: true,
        autoRedirectDelay: 5,
      },
      failure: {
        message: 'Payment Failed',
        submessage: 'Your order has not been placed. Please try again.',
        showRetry: true,
        showSupport: true,
        supportEmail: 'support@yourstore.pk',
        supportPhone: '+92 300 1234567',
      },
    },
    advanced: {
      showPoweredBy: true,
      enableAnalytics: true,
      customCSS: '',
      customJS: '',
    },
  };

  await prisma.paymentPageTemplate.create({
    data: {
      name: 'Ecommerce PKR',
      slug: 'ecommerce-pkr',
      category: 'e-commerce',
      description: 'Optimized for Pakistani e-commerce with light theme, local payment method emphasis, and order confirmation flow.',
      thumbnail_url: null,
      configuration: ecommercePKRConfig,
      tags: ['ecommerce', 'pakistan', 'pkr', 'light', 'shopping', 'retail'],
      is_active: true,
      is_featured: true,
      usage_count: 0,
    },
  });
  console.log('   ✅ Created template: Ecommerce PKR');

  // ============================================
  // PAYMENT PAGE RULES (Admin Locks)
  // ============================================

  console.log('\n🔒 Creating payment page rules...');

  const rules = [
    {
      field_path: 'advanced.showPoweredBy',
      rule_type: 'locked',
      rule_value: {
        value: true,
        message: 'MyPay branding must be displayed on all payment pages.',
      },
      description: 'Enforce MyPay "Powered By" branding on all payment pages',
      is_active: true,
      priority: 100,
    },
    {
      field_path: 'branding.merchantName',
      rule_type: 'required',
      rule_value: {
        message: 'Merchant name is required and cannot be empty.',
      },
      description: 'Require merchant name to be set',
      is_active: true,
      priority: 90,
    },
    {
      field_path: 'channels.enabled',
      rule_type: 'allowed_values',
      rule_value: {
        values: ['easypaisa', 'jazzcash', 'card'],
        message: 'Only approved payment channels can be enabled.',
      },
      description: 'Restrict payment channels to approved methods only',
      is_active: true,
      priority: 80,
    },
  ];

  for (const rule of rules) {
    await prisma.paymentPageRule.create({ data: rule });
  }
  console.log(`   ✅ Created ${rules.length} payment page rules`);

  // ============================================
  // DEFAULT PAYMENT PAGE CONFIGS FOR MERCHANTS
  // ============================================

  console.log('\n📄 Creating default payment page configs for merchants...');

  // Create default config for Merchant 1
  await prisma.paymentPageConfig.create({
    data: {
      merchant_id: merchant.id,
      name: 'Default',
      description: 'Default payment page configuration',
      is_default: true,
      is_active: true,
      branding: { ...modernMinimalConfig.branding, merchantName: merchant.company_name || merchant.name },
      colors: modernMinimalConfig.colors,
      typography: modernMinimalConfig.typography,
      layout: modernMinimalConfig.layout,
      channels: modernMinimalConfig.channels,
      text: modernMinimalConfig.text,
      legal: modernMinimalConfig.legal,
      result_pages: modernMinimalConfig.resultPages,
      advanced: modernMinimalConfig.advanced,
    },
  });
  console.log(`   ✅ Created default config for: ${merchant.name}`);

  // Create default config for Merchant 2
  await prisma.paymentPageConfig.create({
    data: {
      merchant_id: merchant2.id,
      name: 'Default',
      description: 'Default payment page configuration',
      is_default: true,
      is_active: true,
      branding: { ...modernMinimalConfig.branding, merchantName: merchant2.company_name || merchant2.name },
      colors: modernMinimalConfig.colors,
      typography: modernMinimalConfig.typography,
      layout: modernMinimalConfig.layout,
      channels: modernMinimalConfig.channels,
      text: modernMinimalConfig.text,
      legal: modernMinimalConfig.legal,
      result_pages: modernMinimalConfig.resultPages,
      advanced: modernMinimalConfig.advanced,
    },
  });
  console.log(`   ✅ Created default config for: ${merchant2.name}`);

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEEDING COMPLETED!');
  console.log('='.repeat(50));

  console.log('\n📋 MERCHANT 1 - PAYOUT API CREDENTIALS:');
  console.log(`   API Key: ${payoutApiKey}`);
  console.log(`   Merchant ID: ${merchant.id}`);
  console.log('   Use this API key in the X-API-KEY header');

  console.log('\n📋 MERCHANT 1 - PAYMENT API CREDENTIALS:');
  console.log('   API Key: test-api-key-123');
  console.log('   Use this in the X-Api-Key header');

  console.log('\n📋 MERCHANT 1 - PORTAL LOGIN:');
  console.log('   Email: test@mycodigital.io');
  console.log('   Password: test123456');

  console.log('\n📋 MERCHANT 2 - PAYOUT API CREDENTIALS:');
  console.log(`   API Key: ${payoutApiKey2}`);
  console.log(`   Merchant ID: ${merchant2.id}`);
  console.log('   Use this API key in the X-API-KEY header');

  console.log('\n📋 MERCHANT 2 - PAYMENT API CREDENTIALS:');
  console.log('   API Key: hasan-api-key-789');
  console.log('   Use this in the X-Api-Key header');

  console.log('\n📋 MERCHANT 2 - PORTAL LOGIN:');
  console.log('   Email: hasaniqbal@mycodigital.io');
  console.log('   Password: hasan123456');

  console.log('\n📋 ADMIN LOGIN:');
  console.log('   Email: admin@mycodigital.io');
  console.log('   Password: admin@@1234');

  console.log('\n🧪 PAYOUT TEST ACCOUNT NUMBERS:');
  console.log('   123450001 → SUCCESS');
  console.log('   987650002 → RETRY then SUCCESS');
  console.log('   555550003 → FAILED');
  console.log('   111110004 → PENDING');
  console.log('   999990005 → ON_HOLD');

  console.log('\n🧪 PAYMENT TEST MOBILE NUMBERS:');
  console.log('   03030000000 → SUCCESS');
  console.log('   03021111111 → FAILED');
  console.log('   03032222222 → TIMEOUT');

  console.log('\n💳 PAYMENT TEST CARD NUMBERS:');
  console.log('   4242 4242 4242 4242 → SUCCESS');
  console.log('   4000 0000 0000 0002 → DECLINED');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

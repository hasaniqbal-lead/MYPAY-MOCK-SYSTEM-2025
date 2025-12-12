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

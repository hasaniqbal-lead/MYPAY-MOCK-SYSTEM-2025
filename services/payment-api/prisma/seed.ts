import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateApiKey(): string {
  return `darpay_${crypto.randomBytes(32).toString('hex')}`;
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function main() {
  console.log('🌱 Seeding DarPay database (clean)...');

  // Clear ALL existing data (order matters for FK constraints)
  await prisma.paymentWebhookLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.payoutIdempotencyKey.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.paymentPageConfig.deleteMany();
  await prisma.paymentPageRule.deleteMany();
  await prisma.paymentPageTemplate.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.merchantBalance.deleteMany();
  await prisma.scenarioMapping.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.bankDirectory.deleteMany();
  await prisma.walletDirectory.deleteMany();

  console.log('🧹 Cleared all existing data');

  // ============================================
  // BANK & WALLET DIRECTORY
  // ============================================
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
  console.log(`✅ Created ${banks.length} banks`);

  const wallets = [
    { code: 'EASYPAISA', name: 'Easypaisa' },
    { code: 'JAZZCASH', name: 'JazzCash' },
    { code: 'SADAPAY', name: 'SadaPay' },
    { code: 'NAYAPAY', name: 'NayaPay' },
  ];

  for (const wallet of wallets) {
    await prisma.walletDirectory.create({ data: wallet });
  }
  console.log(`✅ Created ${wallets.length} wallets`);

  // ============================================
  // SCENARIO MAPPINGS (Payment API)
  // ============================================
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
  console.log(`✅ Created ${scenarios.length} test scenarios`);

  // ============================================
  // TEST MERCHANT (unified — used by both APIs)
  // ============================================
  const merchantPassword = await bcrypt.hash('test123456', 10);
  const payoutApiKey = generateApiKey();
  const payoutApiKeyHash = hashApiKey(payoutApiKey);

  const merchant = await prisma.merchant.create({
    data: {
      name: `${process.env.ORG_BRAND_NAME || 'Test'} Test Merchant`,
      company_name: `${process.env.ORG_BRAND_NAME || 'Test'} Test Merchant`,
      email: `test@${process.env.ORG_EMAIL_DOMAIN || 'test.com'}`,
      password_hash: merchantPassword,
      apiKey: payoutApiKeyHash,
      apiKeyPlain: payoutApiKey,
      webhookUrl: 'https://webhook.site/darpay-test',
      isActive: true,
      status: 'active',
    },
  });
  console.log(`✅ Created merchant: ${merchant.name}`);

  // Create Payment API key for this merchant
  await prisma.apiKey.create({
    data: {
      vendor_id: 'DARPAY_TEST_001',
      api_key: 'test-api-key-123',
      api_secret: 'test-api-secret-456',
      merchant_id: merchant.id,
      is_active: true,
    },
  });
  console.log('✅ Created Payment API key');

  // Create merchant balance (Payout API)
  await prisma.merchantBalance.create({
    data: {
      merchantId: merchant.id,
      balance: 1000000.00,
      lockedBalance: 0.00,
      version: 0,
    },
  });
  console.log('✅ Created merchant balance: PKR 1,000,000');

  // ============================================
  // ADMIN USER
  // ============================================
  const adminPassword = await bcrypt.hash('admin@@1234', 10);

  await prisma.adminUser.create({
    data: {
      email: process.env.ORG_ADMIN_EMAIL || `admin@${process.env.ORG_EMAIL_DOMAIN || 'test.com'}`,
      password_hash: adminPassword,
      name: `${process.env.ORG_BRAND_NAME || 'System'} Admin`,
      role: 'super_admin',
      is_active: true,
    },
  });
  console.log('✅ Created admin user');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('  🎉 DarPay Database Seeding Complete!');
  console.log('='.repeat(50));

  console.log('\n📋 MERCHANT CREDENTIALS:');
  console.log('   Email:        test@darpay.com');
  console.log('   Password:     test123456');
  console.log('   Payment Key:  test-api-key-123');
  console.log(`   Payout Key:   ${payoutApiKey}`);

  console.log('\n👤 ADMIN CREDENTIALS:');
  console.log('   Email:        admin@darpay.com');
  console.log('   Password:     admin@@1234');

  console.log('\n🧪 PAYMENT TEST SCENARIOS:');
  console.log('   03030000000 → SUCCESS');
  console.log('   03021111111 → FAILED');
  console.log('   03032222222 → TIMEOUT');
  console.log('   4242 4242 4242 4242 → Card SUCCESS');
  console.log('   4000 0000 0000 0002 → Card DECLINED');

  console.log('\n💸 PAYOUT TEST SCENARIOS:');
  console.log('   Account ending 0001 → SUCCESS');
  console.log('   Account ending 0003 → FAILED');
  console.log('   Account ending 0005 → ON_HOLD');
  console.log('   Amount ≥ 100,000    → IN_REVIEW');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


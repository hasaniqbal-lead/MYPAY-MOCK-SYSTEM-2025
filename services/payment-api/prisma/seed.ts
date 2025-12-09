import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Payment API database...');

  // Clear existing data
  await prisma.webhookLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.scenarioMapping.deleteMany();
  await prisma.merchant.deleteMany();

  // Create scenario mappings for mobile numbers
  const scenarios = [
    {
      mobile_number: '03030000000',
      scenario: 'success',
      status: 'completed',
      status_code: 'SUCCESS',
      description: 'Payment successful',
    },
    {
      mobile_number: '03021111111',
      scenario: 'failed',
      status: 'failed',
      status_code: 'FAILED',
      description: 'Transaction failed',
    },
    {
      mobile_number: '03032222222',
      scenario: 'timeout',
      status: 'failed',
      status_code: 'TIMEOUT',
      description: 'Transaction timed-out',
    },
    {
      mobile_number: '03033333333',
      scenario: 'rejected',
      status: 'failed',
      status_code: 'REJECTED',
      description: 'Customer rejected transaction',
    },
    {
      mobile_number: '03034444444',
      scenario: 'invalid_otp',
      status: 'failed',
      status_code: 'INVALID_OTP',
      description: 'Customer entered invalid OTP',
    },
    {
      mobile_number: '03035555555',
      scenario: 'insufficient_funds',
      status: 'failed',
      status_code: 'INSUFFICIENT_FUNDS',
      description: 'Insufficient credit',
    },
    {
      mobile_number: '03036666666',
      scenario: 'account_deactivated',
      status: 'failed',
      status_code: 'ACCOUNT_DEACTIVATED',
      description: 'Account deactivated',
    },
    {
      mobile_number: '03037777777',
      scenario: 'no_response',
      status: 'failed',
      status_code: 'NO_RESPONSE',
      description: 'No response from wallet partner',
    },
    {
      mobile_number: '03038888888',
      scenario: 'invalid_mpin',
      status: 'failed',
      status_code: 'INVALID_MPIN',
      description: 'Customer entered invalid MPIN',
    },
    {
      mobile_number: '03039999999',
      scenario: 'not_approved',
      status: 'failed',
      status_code: 'NOT_APPROVED',
      description: "Customer didn't approve",
    },
  ];

  for (const scenario of scenarios) {
    await prisma.scenarioMapping.create({
      data: scenario,
    });
  }

  console.log(`✅ Created ${scenarios.length} test scenarios`);

  // Create test merchant
  const passwordHash = await bcrypt.hash('test123456', 10);

  const merchant = await prisma.merchant.create({
    data: {
      company_name: 'Test Merchant',
      email: 'test@mycodigital.io',
      password_hash: passwordHash,
      status: 'active',
    },
  });

  console.log(`✅ Created merchant: ${merchant.company_name}`);

  // Create test API key
  await prisma.apiKey.create({
    data: {
      vendor_id: 'TEST_VENDOR_001',
      api_key: 'test-api-key-123',
      api_secret: 'test-api-secret-456',
      merchant_id: merchant.id,
      is_active: true,
    },
  });

  console.log('✅ Created test API key');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('   Email: test@mycodigital.io');
  console.log('   Password: test123456');
  console.log('   API Key: test-api-key-123');
  console.log('\n🧪 Test Mobile Numbers:');
  console.log('   03030000000 → SUCCESS');
  console.log('   03021111111 → FAILED');
  console.log('   03032222222 → TIMEOUT');
  console.log('\n💳 Test Card Numbers:');
  console.log('   4242 4242 4242 4242 → SUCCESS');
  console.log('   4000 0000 0000 0002 → DECLINED');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


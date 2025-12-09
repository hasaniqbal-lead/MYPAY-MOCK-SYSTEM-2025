import { PrismaClient } from '@prisma/client';
import { generateApiKey, hashApiKey } from '../src/shared/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.ledgerEntry.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.merchantBalance.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.bankDirectory.deleteMany();
  await prisma.walletDirectory.deleteMany();

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
    { code: 'BANKALHABIB', name: 'Bank Al Habib' },
    { code: 'SONERI', name: 'Soneri Bank Limited' },
    { code: 'FBL', name: 'Faysal Bank Limited' },
    { code: 'BOP', name: 'Bank of Punjab' },
    { code: 'NBP', name: 'National Bank of Pakistan' },
    { code: 'SBP', name: 'State Bank of Pakistan' },
  ];

  for (const bank of banks) {
    await prisma.bankDirectory.create({
      data: bank,
    });
  }

  console.log(`✅ Created ${banks.length} banks`);

  // Create wallets
  const wallets = [
    { code: 'EASYPAISA', name: 'Easypaisa' },
    { code: 'JAZZCASH', name: 'JazzCash' },
    { code: 'SADAPAY', name: 'SadaPay' },
    { code: 'NAYAPAY', name: 'NayaPay' },
  ];

  for (const wallet of wallets) {
    await prisma.walletDirectory.create({
      data: wallet,
    });
  }

  console.log(`✅ Created ${wallets.length} wallets`);

  // Create test merchant
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);

  const merchant = await prisma.merchant.create({
    data: {
      name: 'Test Merchant',
      email: 'merchant@test.com',
      apiKey: hashedKey,
      webhookUrl: process.env.WEBHOOK_URL || 'https://webhook.site/test',
      isActive: true,
    },
  });

  console.log(`✅ Created merchant: ${merchant.name}`);

  // Create merchant balance with initial balance
  await prisma.merchantBalance.create({
    data: {
      merchantId: merchant.id,
      balance: 1000000.00, // 1 million PKR
      lockedBalance: 0.00,
      version: 0,
    },
  });

  console.log('✅ Created merchant balance: 1,000,000 PKR');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log(`   API Key: ${apiKey}`);
  console.log(`   Merchant ID: ${merchant.id}`);
  console.log('\n💡 Use this API key in the X-API-KEY header for testing');
  console.log('\n🧪 Test Account Numbers:');
  console.log('   123450001 → SUCCESS');
  console.log('   987650002 → RETRY then SUCCESS');
  console.log('   555550003 → FAILED');
  console.log('   111110004 → PENDING');
  console.log('   999990005 → ON_HOLD');
  console.log('   Amount ≥ 100,000 → IN_REVIEW');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


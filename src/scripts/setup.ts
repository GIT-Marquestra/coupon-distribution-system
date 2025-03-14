// scripts/setup.ts

import { prisma } from "@/lib/prisma";

const COUPON_CODES = [
  'SAVE20TODAY', 'FREESHIP2025', 'SPRING25OFF', 
  'WELCOME10NOW', 'FLASH30DEAL', 'EXCLUSIVE15', 
  'SPECIAL40OFF', 'NEWCUST25', 'LOYALTY20',
  'DISCOUNT50NOW'
];

async function main() {
  // Create coupon index record if it doesn't exist
  await prisma.couponIndex.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, currentIndex: 0 }
  });

  // Create coupons if they don't exist
  for (const code of COUPON_CODES) {
    await prisma.coupon.upsert({
      where: { code },
      update: {},
      create: { code }
    });
  }

  console.log('Initial data setup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
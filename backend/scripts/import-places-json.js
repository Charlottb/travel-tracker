require('dotenv/config');

const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

const DEFAULT_USER = {
  email: 'demo@example.com',
  name: 'Demo User',
};

async function main() {
  const placesFile = path.join(__dirname, '..', 'places.json');

  if (!fs.existsSync(placesFile)) {
    console.log('No places.json found. Nothing to import.');
    return;
  }

  const places = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER.email },
    update: {},
    create: {
      ...DEFAULT_USER,
      passwordHash: '',
    },
  });

  let imported = 0;
  let skipped = 0;

  for (const place of places) {
    const existingPlace = await prisma.place.findFirst({
      where: {
        title: place.title,
        lat: place.lat,
        lng: place.lng,
      },
    });

    if (existingPlace) {
      skipped += 1;
      continue;
    }

    await prisma.place.create({
      data: {
        title: place.title,
        description: place.description ?? null,
        category: place.category ?? null,
        lat: place.lat,
        lng: place.lng,
        userId: user.id,
      },
    });

    imported += 1;
  }

  console.log(`Imported ${imported} places from places.json. Skipped ${skipped} existing places.`);
}

main()
  .catch((error) => {
    console.error('Import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

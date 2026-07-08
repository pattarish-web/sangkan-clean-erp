import { seedDatabase } from '../src/lib/seed.js';

seedDatabase()
  .then(() => {
    console.log('Database seeded successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

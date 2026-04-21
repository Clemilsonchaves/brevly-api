import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './src/db';

(async () => {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations applied!');
  process.exit(0);
})();

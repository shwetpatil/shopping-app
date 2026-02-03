import { defineConfig } from '@prisma/internals';

export default defineConfig({
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
});

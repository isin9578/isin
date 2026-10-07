import { createDemoDb, DEMO_ADMIN_ID, type DemoDb } from './fixtures';

// Singleton across dev HMR reloads so demo mutations survive page navigation.
const globalRef = globalThis as unknown as { __isin_demo_db?: DemoDb };

export function getDemoDb(): DemoDb {
  if (!globalRef.__isin_demo_db) {
    globalRef.__isin_demo_db = createDemoDb();
  }
  return globalRef.__isin_demo_db;
}

export function resetDemoDb(): void {
  globalRef.__isin_demo_db = createDemoDb();
}

export { DEMO_ADMIN_ID };

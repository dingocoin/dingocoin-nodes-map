// ===========================================
// INSTRUMENTATION - Server Initialization
// ===========================================
// This file runs ONCE when the Next.js server starts
// Use it to initialize global resources

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Run database migrations FIRST
    try {
      const { runMigrations } = await import('./src/lib/migrate');
      await runMigrations();
    } catch (error) {
      console.error('[Migrations] Migration error:', error);
      // Don't throw - allow server to start anyway
    }

    // Load project configuration on server startup
    const { autoLoadConfig } = await import('@atlasp2p/config/loader.server');

    try {
      // Load config (includes Zod validation)
      autoLoadConfig();

      // Run feature flags validation in PRODUCTION too
      const { validateFeatureFlags, printFeatureFlags } = await import('@atlasp2p/config');
      const validation = validateFeatureFlags();

      if (!validation.valid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(err => console.error(`  - ${err}`));
        throw new Error('Invalid configuration - check errors above');
      }

      console.log('✓ Project configuration loaded and validated');

      // Print feature flags in development mode
      if (process.env.NODE_ENV === 'development') {
        printFeatureFlags();
      }
    } catch (error) {
      console.error('✗ Configuration error:', error);
      throw error; // Prevent server start
    }
  }
}

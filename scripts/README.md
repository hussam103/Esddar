# Hams Trac (Esddar) Scripts

This directory contains utility scripts for the Hams Trac platform.

## Etimad Tender Scraper

### Files

- `schedule-etimad-scraper.js` - The main scheduler that runs every 3 hours to scrape tender data
- `start-etimad-scheduler.js` - The launcher script that initializes the scheduler
- `test-etimad-api.ts` - Test script to verify the Etimad API integration

### Using the Scheduler

To start the Etimad scheduler:

1. **Development Environment (Replit)**:
   - Use the "Etimad Scheduler" workflow in the Replit interface

2. **Manual Start**:
   ```bash
   node --no-warnings scripts/start-etimad-scheduler.js
   ```

### Configuration

The scheduler uses the following environment variables:

- `ETIMAD_SCRAPER_API_KEY` - API key for authentication (defaults to 'internal-scheduler')

## Database Scripts

- `apply-schema-changes.ts` - Applies schema changes safely
- `create-admin.ts` - Creates an admin user
- `migrate.ts` - Runs database migrations

To run database migrations:

```bash
npm run db:push
```

## Best Practices

1. All scheduled tasks should log their activities to both console and database
2. Always include proper error handling
3. Use the isAdmin middleware with API key authentication for admin-only endpoints
4. Document any new scheduled tasks in the `docs/SCHEDULED_TASKS.md` file

## Future Improvements

1. Enhanced error reporting and notifications
2. More granular control over scheduling
3. Dashboard for monitoring all scheduled tasks
# Scheduled Tasks Documentation

This document outlines all scheduled tasks and background jobs in the Hams Trac (Esddar) platform.

## Etimad Tender Scraper

The system automatically scrapes tender data from the Etimad government procurement platform every 3 hours.

### Implementation Details

- **Scheduler Script**: `scripts/schedule-etimad-scraper.js`
- **Launcher Script**: `scripts/start-etimad-scheduler.js`
- **Schedule**: Every 3 hours (using node-cron schedule: `0 0 */3 * * *`)
- **Authentication**: Uses API key authentication with `X-API-Key: internal-scheduler`
- **API Endpoint**: `/api/etimad/scrape-tenders`
- **Database Logging**: All scraping activities are logged to the `scrape_logs` table

### Running the Scheduler

The scheduler can be run in two ways:

1. **Directly in the Replit Environment**:
   - Start the "Etimad Scheduler" workflow from the Replit interface
   - This runs `node --no-warnings scripts/start-etimad-scheduler.js`

2. **In Production Environment**:
   - Set up a process manager like PM2 to ensure the scheduler runs continuously
   - Example: `pm2 start scripts/start-etimad-scheduler.js --name "etimad-scheduler"`

### Monitoring

The scheduler logs all activities:

1. Console logs for real-time monitoring
2. Database logs in the `scrape_logs` table for historical analysis
3. Admin panel view at `/admin/scrape-logs` shows all historical scraping activities

### Error Handling

If the scraping process fails:

1. The error is logged to the console
2. A record is created in the `scrape_logs` table with status = 'failed'
3. The scheduler will automatically retry at the next scheduled interval

## Future Scheduled Tasks (Planned)

1. **User Profile Analysis**: Periodically analyze user profiles for better tender matching
2. **Tender Expiration Check**: Daily check for tenders approaching their deadlines
3. **Notification Cleanup**: Weekly cleanup of old notifications

---

*Last updated: April 12, 2025*
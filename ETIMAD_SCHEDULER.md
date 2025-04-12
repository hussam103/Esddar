# Etimad Tender Scraping Scheduler

This document explains how to start and manage the automatic Etimad tender scraping scheduler for the Hams Trac (Esddar) platform.

## Overview

The Etimad scheduler automatically scrapes tender data from the Etimad government procurement platform at regular intervals (every 3 hours). This ensures that our database always contains the most up-to-date tender information.

## Components

- `scripts/schedule-etimad-scraper.js`: The main scheduler script that uses node-cron to run scraping every 3 hours
- `scripts/start-etimad-scheduler.js`: The launcher script that initializes the scheduler
- API Endpoint: `/api/etimad/scrape-tenders` with API key authentication

## Running the Scheduler

### Running in Development (Replit)

To start the scheduler in the Replit environment:

```bash
node --no-warnings scripts/start-etimad-scheduler.js
```

The scheduler will run continuously in the background, logging its status and activities to the console.

### Running in Production

In a production environment, we recommend using a process manager like PM2 to ensure the scheduler runs continuously and restarts automatically if it crashes:

```bash
# Install PM2 if not already installed
npm install -g pm2

# Start the scheduler with PM2
pm2 start scripts/start-etimad-scheduler.js --name "etimad-scheduler"

# Make sure it starts on system reboot
pm2 save
pm2 startup
```

## Manual Scraping

You can also trigger the scraping process manually:

1. Using the Admin Panel: Go to `/admin/scrape-logs` and click the "Trigger Manual Scrape" button
2. Using the API: Send a POST request to `/api/etimad/scrape-tenders` with the API key header

Example API request:
```bash
curl -X POST http://localhost:5000/api/etimad/scrape-tenders \
  -H "X-API-Key: internal-scheduler" \
  -H "Content-Type: application/json"
```

## Monitoring

You can monitor the scraping activities in several ways:

1. **Console Logs**: The scheduler logs all activities to the console
2. **Admin Dashboard**: Visit `/admin/scrape-logs` to see all historical scraping activities
3. **Database**: The `scrape_logs` table in the database contains records of all scraping activities

## Advanced Configuration

The scheduler supports the following environment variables:

- `ETIMAD_SCRAPER_API_KEY`: API key for authentication (defaults to 'internal-scheduler')
- `ETIMAD_SCRAPE_INTERVAL`: Cron schedule for scraping (defaults to '0 0 */3 * * *', every 3 hours)

To change the scraping frequency, you can modify the cron schedule in `scripts/schedule-etimad-scraper.js`.

## Troubleshooting

If the scraper is not running as expected, check the following:

1. Make sure the API endpoint is accessible (try making a manual request)
2. Check the console logs for any error messages
3. Verify that the database is properly configured
4. Ensure that the API key is correctly set up

---

*Last updated: April 12, 2025*
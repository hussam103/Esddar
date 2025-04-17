# Hams Trac (Esddar) Platform

Hams Trac (Esddar) is an AI-powered government tender matching platform designed to help businesses discover and win relevant contracts more efficiently, with full Arabic language support and responsive design.

## Recent Updates (April 2025)
- Fixed recommended tenders widget on dashboard
- Enhanced search algorithm with keyword weighting
- Improved UI/UX with new dashboard layout
- Added profile completeness tracker

## Features

- **AI-Driven Recommendations**: Smart matching of tenders to company profiles
- **Multilingual Support**: Full Arabic and English language support with RTL layout
- **Document Processing**: OCR and AI analysis of company documents
- **User-Friendly Interface**: Clean, modern UI with responsive design
- **Real-Time Notifications**: WebSocket-based notification system
- **Comprehensive Analytics**: Insights into tender performance and opportunities
- **Automated Data Collection**: Regular scraping of government tender platforms

## Technology Stack

- **Frontend**: React.js with Tailwind CSS and Framer Motion
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Components**: OpenAI integration for advanced NLP
- **Authentication**: Secure session-based auth with role management
- **Document Processing**: OCR and AI-powered data extraction
- **Scheduled Tasks**: Automated data collection and analytics

## Getting Started

### Prerequisites

- Node.js (v20.18.1 or later)
- PostgreSQL database
- API keys for:
  - OpenAI
  - Unstract API (WhisperLLM)
  - SendGrid (for emails)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` with your API keys
4. Set up the database:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   
## Automated Tender Scraping

The platform includes an automated scheduler that collects tender data from the Etimad government procurement platform every 3 hours. 

To start the scheduler:

```bash
node --no-warnings scripts/start-etimad-scheduler.js
```

For more details on the scheduler, see [ETIMAD_SCHEDULER.md](ETIMAD_SCHEDULER.md).

## Admin Features

The platform includes an admin panel accessible to users with admin role:

- **Dashboard**: Overview of system statistics and activity
- **Scrape Logs**: Monitoring of automated data collection
- **User Management**: Managing user accounts and roles
- **Data Sources**: Configuration of external data sources
- **System Settings**: Global platform configuration

Access the admin panel at `/admin` with an admin account.

## Project Structure

- `/client`: Frontend React application
- `/server`: Backend Express API
- `/shared`: Shared code and type definitions
- `/scripts`: Utility scripts and schedulers
- `/docs`: Documentation files
- `/uploads`: Storage for user-uploaded documents

## Environment Variables

The application requires the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `UNSTRACT_API_KEY`: Unstract API key for document processing
- `SENDGRID_API_KEY`: SendGrid API key for email notifications
- `SESSION_SECRET`: Secret for securing user sessions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software.

---

*© 2025 Hams Trac (Esddar). All rights reserved.*
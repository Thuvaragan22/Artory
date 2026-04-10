# Artory — Backend API

Express.js v5 REST API for the Artory creative community platform.

See the [root README](../README.md) for full project documentation, setup instructions, and API reference.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env

# Import database schema
mysql -u root -p < database_schema.sql

# Run development server
npm run dev
```

## Commands

```bash
npm run dev    # development with nodemon
npm start      # production
```

## Environment Variables

See the [root README](../README.md#3-backend-environment) for the full list of required environment variables.

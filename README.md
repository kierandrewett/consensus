# Consensus Voting System

[![Tests](https://github.com/kierandrewett/shu-software-arch/actions/workflows/test.yml/badge.svg)](https://github.com/kierandrewett/shu-software-arch/actions/workflows/test.yml)
[![Database](https://github.com/kierandrewett/shu-software-arch/actions/workflows/database.yml/badge.svg)](https://github.com/kierandrewett/shu-software-arch/actions/workflows/database.yml)

A web-based e-voting platform built with Node.js and Fastify. Supports multiple voting methods including First Past The Post, Single Transferable Vote, and Alternative Vote.

## Requirements

- Node.js 18 or later: https://nodejs.org
- Yarn: install with `npm i yarn -g`

## Getting Started

Install dependencies:

```bash
yarn install
```

Build the project:

```bash
yarn build
```

Seed the database with sample data:

```bash
yarn db:seed
```

Start the server:

```bash
yarn start
```

The application will be available at `http://localhost:3000`.

## Development

Run in development mode with hot reloading:

```bash
yarn dev
```

## Testing

Run all tests:

```bash
yarn test
```

Run unit tests only:

```bash
yarn test:unit
```

Run end-to-end tests only:

```bash
yarn test:e2e
```

## Project Structure

- `src/` - Source code
    - `controllers/` - Request handlers
    - `services/` - Business logic
    - `repositories/` - Data access layer
    - `domain/` - Domain entities and enums
    - `db/` - Database connection and migrations
    - `web/` - Server setup, routes, and views
- `dist/` - Compiled output

## License

MPL-2.0

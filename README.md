# Consensus Voting System

[![Tests](https://github.com/kierandrewett/shu-software-arch/actions/workflows/test.yml/badge.svg)](https://github.com/kierandrewett/shu-software-arch/actions/workflows/test.yml)
[![Database](https://github.com/kierandrewett/shu-software-arch/actions/workflows/database.yml/badge.svg)](https://github.com/kierandrewett/shu-software-arch/actions/workflows/database.yml)

A web-based e-voting platform built with Node.js and Fastify. Supports multiple voting methods including First Past The Post, Single Transferable Vote, and Alternative Vote.

## Deliverables

- [Evaluation Report](deliverables/evaluation-report.pdf)
- Wireframes:
    - [Home](deliverables/wireframes/01-home.png)
    - [Register](deliverables/wireframes/02-register.png)
    - [Login](deliverables/wireframes/03-login.png)
    - [Voter Dashboard](deliverables/wireframes/04-voter-dashboard.png)
    - [Voting (FPTP)](deliverables/wireframes/05-voting-fptp.png)
    - [Admin Dashboard](deliverables/wireframes/06-admin-dashboard.png)
    - [Election Results](deliverables/wireframes/07-election-results.png)
- Diagrams:
    - [Class Diagram](deliverables/diagrams/class-diagram.png)
    - [Architecture Diagram](deliverables/diagrams/architecture-diagram.png)

## Requirements

- Node.js 22 or later: https://nodejs.org
- Yarn: install with `npm i yarn -g`

## Quick Start with GitHub Codespaces

You can run this project in the browser without installing anything locally. On the GitHub repo page, click **Code** -> **Codespaces** -> **Create codespace on master**. The dev container will install Node.js and dependencies automatically, which can take a few minutes. Once it's finished, run:

```bash
yarn start
```

The app will start and Codespaces will prompt you to open it in the browser.

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

This project is licensed under the [Mozilla Public License 2.0](LICENSE).

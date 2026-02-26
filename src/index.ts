/**
 * AI TRANSPARENCY DECLARATION
 *
 * Module: Software Architecture and Design
 * AITS Level: 2 - AI Assisted
 *
 * Where AI was used:
 *  - Generating seed/demo data for db (src/seed.ts) i.e. sample voters, elections, etc.
 *  - Getting ideas from it for architecture decisions and pattern choices
 *  - Looking up best practices for a different voting system design
 *  - Example code snippets for implementing code patterns and voting strategies
 *
 * Everything else is my own work: the architecture, business/domain logic,
 * pattern implementations, UI, tests, and documentation.
 *
 * Date of declaration: 25 February 2026
 * Author: Kieran Drewett
 */

import { startServer } from "./web/server";

// Log environment for debugging
console.log(`[Server] Starting with NODE_ENV=${process.env.NODE_ENV}`);

// Start the server
startServer();

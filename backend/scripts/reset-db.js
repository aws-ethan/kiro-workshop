#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/local.db');

// Delete existing database file
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Deleted existing database: ${dbPath}`);
}

// Recreate database with fresh tables
const { initDatabase, closeDb } = require('../src/database');
initDatabase();
closeDb();

console.log('Database reset complete. Fresh tables created.');

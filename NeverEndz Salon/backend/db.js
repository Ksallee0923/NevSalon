// backend/db.js
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "appointments.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

let dbPromise = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
      });

      const schema = await fs.readFile(SCHEMA_PATH, "utf8");
      await db.exec(schema);

      return db;
    })();
  }
  return dbPromise;
}

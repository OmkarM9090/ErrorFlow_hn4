import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client;
let db;

export async function connectMongo() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    throw new Error("Missing MONGODB_URI or MONGODB_DB_NAME");
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  await db.collection("projects").createIndex({ name: 1 }, { unique: true });
  await db.collection("scans").createIndex({ projectId: 1, createdAt: -1 });

  return db;
}

export function getDb() {
  if (!db) throw new Error("Mongo not connected");
  return db;
}
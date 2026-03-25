import { getDb } from "../config/mongo.js";

export async function createOrGetProject({ name, baseUrl }) {
  const db = getDb();

  const existing = await db.collection("projects").findOne({ name });
  if (existing) return existing;

  const now = new Date();
  const doc = {
    name,
    baseUrl,
    createdAt: now,
    updatedAt: now
  };

  const result = await db.collection("projects").insertOne(doc);

  return {
    _id: result.insertedId,
    ...doc
  };
}

export async function listProjects() {
  const db = getDb();
  return db.collection("projects").find({}).sort({ updatedAt: -1 }).toArray();
}
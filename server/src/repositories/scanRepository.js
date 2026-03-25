import { getDb } from "../config/mongo.js";

export async function saveScan(scanDoc) {
  const db = getDb();
  const result = await db.collection("scans").insertOne({
    ...scanDoc,
    createdAt: new Date()
  });
  return result.insertedId;
}
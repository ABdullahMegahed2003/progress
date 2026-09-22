import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

export default async function getMongoClient() {
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  const clientPromise = globalWithMongo._mongoClientPromise ?? client.connect();

  if (process.env.NODE_ENV !== "production") {
    globalWithMongo._mongoClientPromise = clientPromise;
  }

  return clientPromise;
}

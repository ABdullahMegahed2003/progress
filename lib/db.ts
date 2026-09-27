import getMongoClient from "./mongodb";

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db("gym_app");
}

export async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection("users");
}

export async function getPlansCollection() {
  const db = await getDatabase();
  return db.collection("plans");
}

export async function getWorkoutLogsCollection() {
  const db = await getDatabase();
  return db.collection("workout_logs");
}

export async function getDailyLogsCollection() {
  const db = await getDatabase();
  return db.collection("daily_logs");
}

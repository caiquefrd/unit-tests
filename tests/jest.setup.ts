import db from "../src/configs/db";
import redisClient from "../src/configs/redis";

beforeAll(async () => {
  // Truncate all relevant tables before tests
  await db.query("TRUNCATE TABLE contacts, users RESTART IDENTITY CASCADE;");
});

beforeEach(async () => {
  // Truncate all relevant tables before each test for isolation
  await db.query("TRUNCATE TABLE contacts, users RESTART IDENTITY CASCADE;");
});

afterAll(async () => {
  await db.end();
  await redisClient.quit();
});
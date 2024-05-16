/** Database setup for BizTime. */

import pg from "pg";
const { Client } = pg;

const DB_URI = process.env.NODE_ENV === "test"  // 1
    ? "postgresql:///biztime_test"
    : "postgresql:///biztime";

const db = new Client({
  connectionString: DB_URI,
});

await db.connect();                             // 2

export default db; 

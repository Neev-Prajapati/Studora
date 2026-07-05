const postgres = require('postgres');
require('dotenv').config({path: '.env.local'});
const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE assignment ADD COLUMN reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE`;
    console.log('Column reminder_24h_sent added');
  } catch (e) {
    if (e.code === '42701') console.log('Column reminder_24h_sent already exists');
    else throw e;
  }
  
  try {
    await sql`ALTER TABLE assignment ADD COLUMN reminder_4h_sent BOOLEAN NOT NULL DEFAULT FALSE`;
    console.log('Column reminder_4h_sent added');
  } catch (e) {
    if (e.code === '42701') console.log('Column reminder_4h_sent already exists');
    else throw e;
  }
  
  process.exit(0);
}

run().catch(console.error);

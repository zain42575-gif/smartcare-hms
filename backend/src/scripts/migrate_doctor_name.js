import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import connectDB from '../config/db.js';
import User from '../models/User.js';

async function migrate() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const result = await User.updateOne(
      { email: 'ayesha@alhidayathospital.com' },
      { $set: { name: 'Dr. Hidayat Hussain', email: 'hidayat@alhidayat.com' } }
    );

    if (result.matchedCount > 0) {
      console.log('Successfully updated Dr. Hidayat Hussain in the database.');
    } else {
      console.log('Doctor not found in the database. Ensure the seed data was run initially.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

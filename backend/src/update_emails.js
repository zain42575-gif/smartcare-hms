import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import User from './models/User.js';
import Patient from './models/Patient.js';

async function updateEmails() {
  await connectDB();
  console.log('Connected to DB. Starting email migration...');

  const users = await User.find({ email: /@smartcare(medilab)?\.com/i });
  for (const u of users) {
    const oldEmail = u.email;
    u.email = u.email.replace(/@smartcare(medilab)?\.com/i, '@alhidayathospital.com');
    await u.save();
    console.log(`Updated User: ${oldEmail} -> ${u.email}`);
  }

  const patients = await Patient.find({ email: /@smartcare(medilab)?\.com/i });
  for (const p of patients) {
    const oldEmail = p.email;
    p.email = p.email.replace(/@smartcare(medilab)?\.com/i, '@alhidayathospital.com');
    await p.save();
    console.log(`Updated Patient: ${oldEmail} -> ${p.email}`);
  }

  console.log('Email migration completed successfully!');
  process.exit(0);
}

updateEmails().catch(err => {
  console.error(err);
  process.exit(1);
});

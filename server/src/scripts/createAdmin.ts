import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../config/logger.js';
import { User } from '../models/User.js';

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || '').trim().toLowerCase();
  const password = args[1] || '';
  const name = args[2] || 'Admin User';

  if (!email || !password) {
    console.error('\nUsage:');
    console.error('  npm run create-admin <email> <password> [name]\n');
    console.error('Example:');
    console.error('  npm run create-admin john@example.com MyPass123! "John Admin"\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('\nError: Password must be at least 8 characters long.\n');
    process.exit(1);
  }

  try {
    await connectDB();

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      user.name = name || user.name;
      user.password = password; // pre-save hook will hash with argon2
      user.failedLogins = 0;
      user.lockUntil = null;
      await user.save();
      logger.info(`[Admin] Successfully promoted existing user '${email}' to 'admin' role.`);
      console.log(`\n✅ User '${email}' has been promoted to Admin!\n`);
    } else {
      user = new User({
        name,
        email,
        password,
        role: 'admin'
      });
      await user.save();
      logger.info(`[Admin] Successfully created new admin account '${email}'.`);
      console.log(`\n✅ New Admin created successfully!`);
      console.log(`   Email: ${email}`);
      console.log(`   Role:  admin\n`);
    }

    await disconnectDB();
    process.exit(0);
  } catch (err: any) {
    logger.error({ err }, '[Admin] Failed to create or promote admin');
    console.error('\n❌ Failed to create admin:', err.message || err);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

void main();

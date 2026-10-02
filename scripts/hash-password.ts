// Usage: npm run admin:hash -- "your strong password"
// Prints a value for ADMIN_PASSWORD_HASH. Never commit the output.
import { hashPassword } from "../src/lib/auth/password";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Provide a password of at least 12 characters: npm run admin:hash -- \"...\"");
  process.exit(1);
}
hashPassword(password).then((hash) => console.log(hash));

import bcrypt from 'bcryptjs';

const hash = '$2a$10$Nllqx3zZnBpW5mZs74W2yO1TPk45hii3nOyKI0nEt9BxttOXsyYfm';
const passwords = ['test', 'test123', 'password', 'admin'];

console.log('Testing passwords against hash...\n');

for (const password of passwords) {
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
}

console.log('\nUse the valid password to log into the app.');
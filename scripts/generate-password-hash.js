#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

console.log('BeAligned Password Hash Generator');
console.log('==================================');
console.log('This tool generates a bcrypt hash for the MVP password gate.');
console.log('Copy the generated hash to your .env file as PASSWORD_GATE_HASH\n');

// Hide password input
rl.stdoutMuted = true;
rl.question('Enter the password to hash: ', async (password) => {
  rl.stdoutMuted = false;
  console.log(''); // New line after password input
  rl.close();

  if (!password) {
    console.error('❌ Password cannot be empty');
    process.exit(1);
  }

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Password hash generated successfully!\n');
    console.log('Add this to your .env file:');
    console.log(`PASSWORD_GATE_HASH=${hash}`);
    console.log('\nFor Supabase Edge Functions, add this as a secret:');
    console.log(`supabase secrets set PASSWORD_GATE_HASH="${hash}"`);
  } catch (error) {
    console.error('❌ Failed to generate hash:', error);
    process.exit(1);
  }
});

// Override stdin to hide password
rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted)
    rl.output.write("*");
  else
    rl.output.write(stringToWrite);
};
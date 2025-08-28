#!/usr/bin/env node
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

console.log('BeAligned Password Hash Generator')
console.log('==================================')
console.log('This tool generates a bcrypt hash for the MVP password gate.')
console.log('Copy the generated hash to your .env file as PASSWORD_GATE_HASH\n')

const password = prompt('Enter the password to hash: ')

if (!password) {
  console.error('Password cannot be empty')
  Deno.exit(1)
}

try {
  const hash = await bcrypt.hash(password)
  console.log('\n✅ Password hash generated successfully!')
  console.log('\nAdd this to your .env file:')
  console.log(`PASSWORD_GATE_HASH=${hash}`)
  console.log('\nFor Supabase Edge Functions, add this as a secret:')
  console.log(`supabase secrets set PASSWORD_GATE_HASH="${hash}"`)
} catch (error) {
  console.error('Failed to generate hash:', error)
  Deno.exit(1)
}
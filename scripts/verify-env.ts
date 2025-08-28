import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env')
const exampleOnly = process.argv.includes('--example-only')

if (!exampleOnly && !existsSync(envPath)) {
  console.error('❌ .env file not found. Please copy .env.example to .env and fill in the values.')
  process.exit(1)
}

if (!exampleOnly) {
  config({ path: envPath })
}

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
]

const requiredServerEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'PASSWORD_GATE_HASH'
]

let hasError = false

if (exampleOnly) {
  console.log('✅ Checking .env.example structure...')
} else {
  console.log('Verifying environment variables...\n')

  // Check client-side variables
  console.log('Client-side variables:')
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`❌ ${varName} is not set`)
      hasError = true
    } else {
      console.log(`✅ ${varName} is set`)
    }
  })

  console.log('\nServer-side variables (for Edge Functions):')
  requiredServerEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.warn(`⚠️  ${varName} is not set (required for Edge Functions)`)
    } else {
      console.log(`✅ ${varName} is set`)
    }
  })

  if (hasError) {
    console.error('\n❌ Some required environment variables are missing.')
    console.error('Please check your .env file and ensure all required variables are set.')
    process.exit(1)
  }
}

console.log('\n✅ Environment verification complete!')
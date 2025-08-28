#!/usr/bin/env node

/**
 * Deploy Edge Function to Supabase
 * Usage: npm run deploy-function
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if we're in the right directory
if (!fs.existsSync('./supabase/functions/responses-proxy')) {
  console.error('❌ Edge Function not found. Make sure you\'re in the project root.');
  process.exit(1);
}

console.log('🚀 Deploying Edge Function to Supabase...\n');

// Set the access token from .env
if (process.env.SUPABASE_ACCESS_TOKEN) {
  process.env.SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
  console.log('✅ Using access token from .env file\n');
} else {
  console.warn('⚠️  No SUPABASE_ACCESS_TOKEN found in .env file\n');
}

try {
  // First, try to link to the project if not already linked
  console.log('📦 Linking to Supabase project...');
  try {
    execSync('npx supabase link --project-ref kzuumrtbroooxpneybyx', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Project linked successfully\n');
  } catch (linkError) {
    console.log('ℹ️  Project already linked or linking not required\n');
  }

  // Deploy the function with the access token (skip database connection)
  console.log('🔄 Deploying responses-proxy function...');
  execSync('SUPABASE_ACCESS_TOKEN=' + process.env.SUPABASE_ACCESS_TOKEN + ' npx supabase functions deploy responses-proxy --no-verify-jwt --project-ref kzuumrtbroooxpneybyx', { 
    stdio: 'inherit',
    shell: true
  });
  
  console.log('\n✅ Edge Function deployed successfully!');
  console.log('📝 The function is now live at:');
  console.log('   https://kzuumrtbroooxpneybyx.supabase.co/functions/v1/responses-proxy\n');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\n📋 Manual deployment instructions:');
  console.log('1. Go to https://supabase.com/dashboard/project/kzuumrtbroooxpneybyx/functions');
  console.log('2. Click on "responses-proxy" function');
  console.log('3. Click "Deploy function" button');
  console.log('4. Or use the Supabase CLI with an access token:');
  console.log('   export SUPABASE_ACCESS_TOKEN=your-token-here');
  console.log('   npx supabase functions deploy responses-proxy\n');
  process.exit(1);
}
#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function clearRefinements() {
  console.log('🗑️  Clearing all refinements...')
  
  try {
    // Clear all refined responses
    const { error: refineError } = await supabase
      .from('refined_responses')
      .delete()
      .not('id', 'is', null) // Delete all rows
    
    if (refineError) {
      console.error('Error clearing refined_responses:', refineError)
    } else {
      console.log('✅ Cleared refined_responses table')
    }

    // Optionally clear all responses to start completely fresh
    const { error: responseError } = await supabase
      .from('responses')
      .delete()
      .not('id', 'is', null) // Delete all rows
    
    if (responseError) {
      console.error('Error clearing responses:', responseError)
    } else {
      console.log('✅ Cleared responses table')
    }

    console.log('🎯 All refinements cleared! You can now test pure AI responses.')
    
  } catch (error) {
    console.error('Failed to clear refinements:', error)
    process.exit(1)
  }
}

clearRefinements()
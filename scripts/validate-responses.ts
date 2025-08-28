import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample conversations based on the chat_gpt_sample_complete.png
const testConversations = [
  {
    step: 1,
    title: "Name the Issue",
    exchanges: [
      {
        user: "My co-parent keeps scheduling activities during my parenting time without discussing it with me first.",
        expectedThemes: ["validation", "specifics", "frequency", "impact"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["I hear", "challenging", "tell me more", "how often"]
        }
      },
      {
        user: "It happens almost every week. Last week they signed our daughter up for soccer practice that falls on my Thursdays without even asking me.",
        expectedThemes: ["acknowledgment", "impact exploration"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["frustrating", "impact", "daily life"]
        }
      }
    ]
  },
  {
    step: 2,
    title: "Explore Feelings",
    exchanges: [
      {
        user: "I feel frustrated and disrespected",
        expectedThemes: ["validation", "deeper exploration"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["important feelings", "underneath", "what else"]
        }
      },
      {
        user: "Underneath the frustration, I think I feel hurt that my time with our daughter isn't being valued. Maybe even a bit powerless.",
        expectedThemes: ["acknowledgment", "appreciation for vulnerability"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: false,
          keyPhrases: ["thank you for sharing", "vulnerable", "hurt", "valued"]
        }
      }
    ]
  },
  {
    step: 3,
    title: "Identify Values",
    exchanges: [
      {
        user: "I want my daughter to have a strong relationship with me, and I value being involved in her activities and decisions about her schedule.",
        expectedThemes: ["validation", "deeper purpose"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["clear values", "relationship", "what's at stake", "core"]
        }
      },
      {
        user: "At the core, it's about respect and partnership. I want us to work as a team for our daughter's benefit.",
        expectedThemes: ["acknowledgment", "appreciation"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: false,
          keyPhrases: ["partnership", "team", "daughter's benefit", "respect"]
        }
      }
    ]
  },
  {
    step: 4,
    title: "Co-Parent's Perspective",
    exchanges: [
      {
        user: "They might see it as trying to give our daughter opportunities. Maybe they're worried she'll miss out if we don't sign her up quickly.",
        expectedThemes: ["appreciation for perspective-taking", "deeper exploration"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["courage", "perspective", "what else", "feeling"]
        }
      },
      {
        user: "They might be feeling overwhelmed managing everything and perhaps think they're helping by handling the logistics.",
        expectedThemes: ["acknowledgment", "compassion"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: false,
          keyPhrases: ["insight", "overwhelmed", "helping", "understanding"]
        }
      }
    ]
  },
  {
    step: 5,
    title: "Child's Perspective",
    exchanges: [
      {
        user: "She probably feels excited about activities but might notice the tension when we discuss schedules. She might feel caught in the middle.",
        expectedThemes: ["validation", "child's needs focus"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["tension", "caught in middle", "what she needs", "security"]
        }
      },
      {
        user: "She needs to know both parents support her activities and that we can work together peacefully. She needs consistency and to not worry about our conflicts.",
        expectedThemes: ["acknowledgment", "child-centered focus"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: false,
          keyPhrases: ["both parents", "work together", "consistency", "peaceful"]
        }
      }
    ]
  },
  {
    step: 6,
    title: "Generate Options",
    exchanges: [
      {
        user: "We could set up a monthly planning meeting to discuss upcoming activities before committing to them.",
        expectedThemes: ["encouragement", "more options"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["great start", "what else", "another way", "build on that"]
        }
      },
      {
        user: "We could use a shared calendar, have a 48-hour courtesy notice for new activities, or agree on a budget and number of activities per season.",
        expectedThemes: ["appreciation", "refinement"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: false,
          keyPhrases: ["excellent options", "collaborative", "practical", "win-win"]
        }
      }
    ]
  },
  {
    step: 7,
    title: "Craft Message",
    exchanges: [
      {
        user: "I'd like to discuss how we coordinate signing up for activities. I value our daughter having opportunities and both of us being involved in decisions. Could we find a time to talk about a system that works for both of us?",
        expectedThemes: ["CLEAR principles", "refinement"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: true,
          keyPhrases: ["CLEAR", "concise", "respectful", "invitation"]
        }
      },
      {
        user: "I appreciate you wanting our daughter to have great experiences. I'd like to be part of planning activities that fall on my parenting time. Could we try a quick monthly check-in to coordinate her schedule together?",
        expectedThemes: ["approval", "readiness"],
        expectedResponse: {
          shouldValidate: true,
          shouldProbe: false,
          keyPhrases: ["excellent", "respectful", "collaborative", "ready to send"]
        }
      }
    ]
  }
]

async function validateResponse(userText: string, expectedThemes: string[], stepId: number): Promise<{
  valid: boolean
  score: number
  feedback: string[]
}> {
  // Call the actual AI endpoint
  const response = await fetch(`${supabaseUrl}/functions/v1/responses-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      session_id: 'test-session-' + Date.now(),
      step_id: stepId,
      user_text: userText,
    }),
  })

  if (!response.ok) {
    return {
      valid: false,
      score: 0,
      feedback: ['Failed to get AI response']
    }
  }

  const data = await response.json()
  const aiResponse = data.ai_text.toLowerCase()
  
  let score = 0
  const feedback: string[] = []
  
  // Check for expected themes
  expectedThemes.forEach(theme => {
    const themeKeywords = {
      'validation': ['hear you', 'understand', 'sounds', 'i see'],
      'specifics': ['tell me more', 'specifically', 'can you share', 'what exactly'],
      'frequency': ['how often', 'when does', 'how many times'],
      'impact': ['affecting', 'impact', 'means to you', 'feeling'],
      'deeper exploration': ['underneath', 'deeper', 'what else', 'beyond'],
      'acknowledgment': ['thank you', 'appreciate', 'i see', 'clear'],
      'child-centered focus': ['child', 'daughter', 'son', 'their needs'],
      'encouragement': ['great', 'excellent', 'good start', 'wonderful'],
      'CLEAR principles': ['clear', 'concise', 'respectful', 'listener-ready']
    }
    
    const keywords = themeKeywords[theme as keyof typeof themeKeywords] || [theme]
    const hasTheme = keywords.some(keyword => aiResponse.includes(keyword))
    
    if (hasTheme) {
      score += 1
      feedback.push(`✓ Contains ${theme}`)
    } else {
      feedback.push(`✗ Missing ${theme}`)
    }
  })
  
  // Check response length (should be 2-3 sentences)
  const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length >= 2 && sentences.length <= 4) {
    score += 1
    feedback.push('✓ Appropriate length')
  } else {
    feedback.push(`✗ Response has ${sentences.length} sentences (should be 2-3)`)
  }
  
  // Check for warmth and empathy
  const empathyWords = ['understand', 'hear', 'appreciate', 'courage', 'challenging', 'difficult']
  const hasEmpathy = empathyWords.some(word => aiResponse.includes(word))
  if (hasEmpathy) {
    score += 1
    feedback.push('✓ Shows empathy')
  } else {
    feedback.push('✗ Could be more empathetic')
  }
  
  const maxScore = expectedThemes.length + 2 // themes + length + empathy
  const percentage = (score / maxScore) * 100
  
  return {
    valid: percentage >= 70,
    score: percentage,
    feedback
  }
}

async function runValidation() {
  console.log('🧪 Starting BeAligned Response Validation\n')
  console.log('=' .repeat(50))
  
  let totalTests = 0
  let passedTests = 0
  const results: any[] = []
  
  for (const stepTest of testConversations) {
    console.log(`\n📝 Step ${stepTest.step}: ${stepTest.title}`)
    console.log('-'.repeat(40))
    
    for (const exchange of stepTest.exchanges) {
      totalTests++
      console.log(`\nUser: "${exchange.user.substring(0, 60)}..."`)
      
      const validation = await validateResponse(
        exchange.user,
        exchange.expectedThemes,
        stepTest.step
      )
      
      if (validation.valid) {
        passedTests++
        console.log(`✅ PASSED (Score: ${validation.score.toFixed(1)}%)`)
      } else {
        console.log(`❌ FAILED (Score: ${validation.score.toFixed(1)}%)`)
      }
      
      validation.feedback.forEach(f => console.log(`   ${f}`))
      
      results.push({
        step: stepTest.step,
        stepTitle: stepTest.title,
        userInput: exchange.user,
        score: validation.score,
        valid: validation.valid,
        feedback: validation.feedback,
        timestamp: new Date().toISOString()
      })
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  // Store validation results
  const { error } = await supabase
    .from('validation_results')
    .insert({
      test_run_id: `validation-${Date.now()}`,
      results,
      summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        pass_rate: (passedTests / totalTests * 100).toFixed(1),
        timestamp: new Date().toISOString()
      }
    })
  
  if (error) {
    console.error('Failed to store results:', error)
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Pass Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`)
  console.log('\n✨ Validation complete!')
}

// Run validation
runValidation().catch(console.error)
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedKnowledge() {
  console.log('Seeding knowledge base...')

  try {
    // Check if already seeded
    const { data: existing } = await supabase
      .from('knowledge_docs')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('Knowledge base already seeded, skipping...')
      return
    }

    // Insert knowledge documents
    const { error: docsError } = await supabase
      .from('knowledge_docs')
      .insert([
        {
          title: 'BeAligned Guardrails',
          source: 'curriculum',
          version: '1.0',
          kind: 'guidebook',
          content: `Core Guardrails:
1. Never provide legal or clinical advice
2. Always maintain child-centered focus
3. Honor both parents perspectives
4. Encourage de-escalation over winning
5. Support communication, not litigation
6. Recognize when professional help is needed`
        },
        {
          title: 'Seven Step Schema',
          source: 'curriculum',
          version: '1.0',
          kind: 'schema',
          content: `The seven-step process moves from reaction to reflection:
1. Name It - Neutral problem identification
2. Beneath - Feelings exploration (surface to vulnerable)
3. Your Why - Values identification
4. Their Shoes - Perspective-taking
5. Child Eyes - Child-centered lens
6. Options - Multiple pathways forward
7. Communicate - CLEAR message drafting`
        },
        {
          title: 'Message Formula',
          source: 'curriculum',
          version: '1.0',
          kind: 'example',
          content: `Formula: I feel [emotion] when [situation] because [shared Why/child outcome]. [Optional invitation]

Examples:
- I feel worried when pickup times vary because Maya needs consistency to feel secure. Could we stick to the agreed schedule?
- I feel frustrated when I don't hear back about medical decisions because I want to be involved in Jamie's care. Can we set a 48-hour response standard?`
        },
        {
          title: 'Handoff Language',
          source: 'curriculum',
          version: '1.0',
          kind: 'guidebook',
          content: `When users need professional support beyond our scope:

"I notice you're dealing with some complex legal/safety/clinical concerns. While I can help with communication, this situation might benefit from professional guidance. Would you like to focus on how to communicate your needs clearly while you seek appropriate support?"

Never diagnose, prescribe, or provide legal interpretation.`
        }
      ])

    if (docsError) {
      console.error('Error seeding knowledge docs:', docsError)
      throw docsError
    }

    console.log('✅ Knowledge base seeded successfully!')
  } catch (error) {
    console.error('Failed to seed knowledge base:', error)
    process.exit(1)
  }
}

seedKnowledge()
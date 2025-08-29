# Deploy Edge Function Updates

The Edge Function has been updated to remove overly saccharine language like "Oh, friend" and make responses more genuine and grounded. 

## Changes Made:

1. **Removed performative greetings**: No more "Oh, friend" or "Oh my heart"
2. **More authentic language**: Changed to natural phrases like "This sounds incredibly challenging"
3. **Grounded compassion**: Still empathetic but without being overly sentimental
4. **Better match with BeAligned™ ethos**: Responses now follow the guidebook's warm but professional tone

## To Deploy:

1. Log into Supabase Dashboard
2. Navigate to Edge Functions
3. Select `responses-proxy` function
4. Copy the updated code from `/supabase/functions/responses-proxy/index.ts`
5. Deploy the function

## Updated Examples:

### Before:
"Oh, friend. Addiction in your co-parenting relationship - there are few things harder..."

### After:
"Addiction in a co-parenting relationship brings such profound challenges. The constant worry about your sons' safety and wellbeing..."

## Also Run Migration:

Execute the migration `/supabase/migrations/20250829005834_add_confidence_to_refined_responses.sql` in SQL Editor to update the refined response examples with the new tone.
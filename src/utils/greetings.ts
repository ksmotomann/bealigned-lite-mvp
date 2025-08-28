export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return "Good morning"
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon"
  } else if (hour >= 17 && hour < 21) {
    return "Good evening"
  } else {
    return "Hello"
  }
}

export function getWarmWelcome(): string {
  const greeting = getTimeBasedGreeting()
  
  const welcomeMessages = [
    `${greeting}, and welcome. I'm here to support you through whatever's on your mind today. This is your space to explore, reflect, and find clarity.`,
    `${greeting}. Thank you for being here. Taking time to reflect on challenging situations shows real strength and care for your family's wellbeing.`,
    `${greeting}, friend. I know it takes courage to work through difficult co-parenting moments. You're in a safe space here to explore your thoughts and feelings.`,
    `${greeting}. I'm glad you're here. Sometimes the path forward becomes clearer when we take a moment to pause and reflect together.`
  ]
  
  // Use the current minute to consistently pick a message for this session
  const index = new Date().getMinutes() % welcomeMessages.length
  return welcomeMessages[index]
}

export function getStepTransition(fromStep: number, toStep: number): string {
  const transitions: Record<string, string> = {
    '1-2': "Thank you for sharing that. Now let's explore what you're feeling about this situation.",
    '2-3': "I can really hear the emotions in what you've shared. Let's dig a little deeper into what's driving these feelings - what matters most to you here?",
    '3-4': "Your values are so clear. Now, let's take a brave step and consider your co-parent's perspective.",
    '4-5': "That took courage. Now let's shift our focus to the most important person in this situation - your child.",
    '5-6': "With all these perspectives in mind, let's explore some options that could work for everyone.",
    '6-7': "Great work generating possibilities. Now let's craft a clear message to move forward."
  }
  
  return transitions[`${fromStep}-${toStep}`] || "Let's continue our reflection journey."
}
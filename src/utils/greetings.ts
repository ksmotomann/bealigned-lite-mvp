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
  const hour = new Date().getHours()
  
  // Morning messages (5am - 12pm) - MORE VARIETY
  const morningMessages = [
    "Good morning. I'm here to help you navigate whatever's weighing on your heart today. This is your time - a moment just for you to reflect and find clarity.",
    "Good morning, and welcome. Starting your day with intention takes courage. Let's explore what's on your mind together.",
    "Good morning. I know mornings can bring fresh perspective - and sometimes fresh worries too. Whatever brought you here, you're taking a positive step.",
    "Morning. Taking this time for yourself, especially early in the day, shows real commitment to your family's wellbeing. How can I support you?",
    "Good morning, friend. The fact that you're here, ready to work through challenges, speaks volumes about your dedication as a parent.",
    "Good morning. Whatever brought you here this morning, know that you're not alone in navigating these challenges.",
    "Morning, and welcome. Every new day offers a chance to approach things differently. I'm here to help you find your way.",
    "Good morning. The early hours can be a powerful time for reflection. Let's use this quiet moment to work through what matters most.",
    "Good morning, friend. Taking this step shows real strength. Whatever's on your heart, we'll work through it together.",
    "Morning. I'm glad you're here. Sometimes the start of a new day is exactly when we need support most."
  ]
  
  // Afternoon messages (12pm - 5pm) - MORE VARIETY
  const afternoonMessages = [
    "Good afternoon. I'm glad you're taking this moment in your day to pause and reflect. What's on your heart right now?",
    "Good afternoon. Sometimes the middle of the day is exactly when we need to step back and gain perspective. I'm here to help.",
    "Afternoon. Whether you've got a few minutes or more, this is your space to explore what matters most to you and your family.",
    "Good afternoon, and welcome. The afternoon can be a perfect time to reset and refocus. Let's work through this together.",
    "Good afternoon. Taking time during your busy day shows how much you care. Let's make this time count.",
    "Good afternoon, friend. I know the day can pull us in many directions. This is your moment to focus on what truly matters.",
    "Afternoon. Whatever has brought you here in the middle of your day, I'm here to listen and support you.",
    "Good afternoon. Sometimes we need to pause and breathe. You're in the right place to do just that.",
    "Good afternoon, and thank you for being here. Your commitment to working through challenges is admirable.",
    "Afternoon. This time you're taking for reflection - it matters. Let's make it count."
  ]
  
  // Evening messages (5pm - 9pm) - MORE VARIETY
  const eveningMessages = [
    "Good evening. As the day winds down, it's a perfect time to process what's been on your mind. I'm here to listen and guide.",
    "Good evening, and welcome. Evenings can bring both exhaustion and clarity. Whatever you're feeling, this is your safe space.",
    "Good evening. After a full day, taking time to reflect on co-parenting challenges shows incredible dedication. How are you doing?",
    "Evening. I know the end of the day can surface a lot of emotions. You're in the right place to work through them.",
    "Good evening, friend. Sometimes the quiet of evening is exactly what we need to find our way forward.",
    "Good evening. The transition from day to night can be a powerful time for reflection. I'm here to support you.",
    "Evening, and welcome. Whatever today has brought, this is your time to process and find clarity.",
    "Good evening. I imagine you've had a lot on your plate today. Let's take this time to focus on what matters most.",
    "Good evening, friend. As the day settles, let's work through whatever's weighing on your heart.",
    "Evening. Thank you for making time for this, even after what I'm sure has been a full day."
  ]
  
  // Night messages (9pm - 5am) - MORE VARIETY
  const nightMessages = [
    "Hello there. I see you're taking some quiet time to reflect. Whatever's keeping you up, I'm here to help you work through it.",
    "Hello, and welcome. Late night thoughts can feel heavy, but you don't have to carry them alone. This is your space.",
    "Hello. Sometimes the stillness of night is when we do our deepest thinking. I'm honored you're here to explore what matters to you.",
    "Welcome. I know it's late, but sometimes these quiet hours are when we find our clearest insights. Let's work through this together.",
    "Hello, friend. Whatever brought you here tonight, know that taking this step shows strength and love for your family.",
    "Hello. The quiet hours often bring the loudest thoughts. I'm here to help you sort through them.",
    "Welcome. I know nighttime can amplify our worries. You're not alone in this.",
    "Hello there. Sometimes we need the world to be quiet before we can hear our own thoughts clearly. I'm listening.",
    "Hello, friend. These late hours can be difficult, but they can also bring clarity. Let's work through this together.",
    "Welcome. Whatever couldn't wait until morning, I'm here to help you navigate it."
  ]
  
  let messagePool: string[]
  
  if (hour >= 5 && hour < 12) {
    messagePool = morningMessages
  } else if (hour >= 12 && hour < 17) {
    messagePool = afternoonMessages
  } else if (hour >= 17 && hour < 21) {
    messagePool = eveningMessages
  } else {
    messagePool = nightMessages
  }
  
  // Use true randomization for maximum variety
  const index = Math.floor(Math.random() * messagePool.length)
  return messagePool[index]
}

export function getStepOnePrompt(): string {
  const prompts = [
    "Let's start by naming what's on your mind. What co-parenting situation would you like to work through today?",
    "I'm here to listen. What's the co-parenting challenge that's been weighing on you?",
    "Let's begin with what brought you here. What situation with your co-parent would you like to explore?",
    "Take a breath. When you're ready, share what's happening in your co-parenting relationship that you'd like to address.",
    "This is your space to be heard. What co-parenting issue has been on your heart lately?",
    "Let's start wherever feels right for you. What's going on with your co-parent that you'd like to talk through?",
    "I'm listening. What co-parenting situation has been challenging for you recently?",
    "You're safe here. What's the situation with your co-parent that you'd like to work through together?"
  ]
  
  // Use true randomization
  const index = Math.floor(Math.random() * prompts.length)
  return prompts[index]
}

export function getEmpatheticAcknowledgment(): string {
  const acknowledgments = [
    "I hear you.",
    "Thank you for sharing that with me.",
    "That sounds really challenging.",
    "I can feel how much this matters to you.",
    "Your feelings are completely valid.",
    "That must be so difficult to navigate.",
    "I appreciate you opening up about this.",
    "What you're feeling makes complete sense.",
    "That's a lot to carry.",
    "I'm really glad you're taking time to work through this.",
    "Your commitment to finding a solution is clear.",
    "It takes courage to share these feelings.",
    "I can hear the care in your words.",
    "That sounds emotionally exhausting.",
    "You're showing such strength by being here."
  ]
  
  // Use true randomization for variety
  const index = Math.floor(Math.random() * acknowledgments.length)
  return acknowledgments[index]
}

export function getEncouragement(): string {
  const encouragements = [
    "You're doing great.",
    "This is important work you're doing.",
    "Every step forward matters.",
    "Your dedication is admirable.",
    "You're on the right path.",
    "Keep going - you've got this.",
    "Your efforts are making a difference.",
    "This reflection is powerful.",
    "You're showing real wisdom here.",
    "Your child is lucky to have a parent who cares this much.",
    "This kind of self-reflection takes real courage.",
    "You're modeling healthy conflict resolution.",
    "Your willingness to grow is inspiring.",
    "This is exactly the kind of thoughtful parenting your child needs.",
    "You're breaking cycles and creating healthier patterns."
  ]
  
  // Use true randomization for variety
  const index = Math.floor(Math.random() * encouragements.length)
  return encouragements[index]
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
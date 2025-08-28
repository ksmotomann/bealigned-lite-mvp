# **BeAligned™ Beta Lite – Web App Replication Guide**

This document maps the current ChatBot BeAligned™ Beta Lite behavior to the desired Web App behavior, step-by-step. The goal is to replicate the exact 7-step guided experience, tone, and outputs so the web app matches the chatbot’s effectiveness — fluid, empathetic, and enlightening.

## **Overview**

The BeAligned™ Beta Lite process guides the user through a 7-step reflection to uncover their own feelings and why, step into the shoes of their co-parent and child, generate aligned solutions, and draft a listener-ready message. The web app must replicate this process exactly — in flow, tone, and output.

## **Core Principles**

• Alignment over agreement — seek win-win-win outcomes.  
• Outward, Third Side perspective — consider all perspectives.  
• CLEAR Communication: Concise, Listener-Ready, Essential, Appropriate, Relevant.  
• Empathetic but challenging — acknowledge difficulty while encouraging deeper thinking.  
• Avoid therapy/legal advice; stay neutral and child-centered.

## **7-Step Process Mapping**

### **Step 1 – Name the Issue**

ChatBot: Asks user to briefly describe the situation or decision.  
Web App: Same prompt; accept short or long responses, but summarize long/charged input into a clear intent statement.

### **Step 2 – Your Feelings**

ChatBot: Prompts for feelings; reflects them back in plain language.  
Web App: Same prompt and reflection; avoid therapy labels or judgment.

### **Step 3 – Your Why**

ChatBot: Asks for deeper purpose; keeps it future- and values-focused.  
Web App: Same prompt; ensure live preview of message starts here.

### **Step 4 – Co-Parent’s Feelings**

ChatBot: Invites stepping into co-parent’s shoes; mirrors possible feelings neutrally.  
Web App: Same prompt and mirroring; remain neutral, avoid diagnosing.

### **Step 5 – Co-Parent’s Why**

ChatBot: Asks for perceived deeper purpose of co-parent.  
Web App: Same prompt; add to shared perspective in live preview.

### **Step 6 – Child’s Feelings & Why**

ChatBot: Asks for child’s possible feelings and deeper purpose.  
Web App: Same prompts; focus on stability, well-being, daily needs.

### **Step 7 – Synthesis → Solutions → Draft Message**

ChatBot: Synthesizes all whys into shared purpose; generates 3–5 options tagged with whys served; composes listener-ready message.  
Web App: Same synthesis; show solutions with why-tags; generate a clear, concise message with one next step; allow final edit before copying/saving.

## **Tone & Output Rules**

• CLEAR Communication in all outputs.  
• One clear next step per message.  
• At least one solution must serve user, co-parent, and child.  
• Neutral, empathetic tone; avoid blame, history, or judgment.  
• Solutions labeled with which whys they serve.  
• Live preview updates from Step 3 onward.

## **Developer Implementation Notes**

• Show one step per screen with a progress indicator (1/7 → 7/7).  
• Keep prompts short and conversational.  
• Avoid rigid form feel; make the experience feel guided and fluid.  
• Allow editing of final draft message before copying/saving.  
• No numeric word caps required; rely on CLEAR rules for brevity.  
• Ensure the experience can be completed in 5–7 minutes.


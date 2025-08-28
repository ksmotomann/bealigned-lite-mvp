# **BeAligned™ Schema Packet – Developer README**

Version: August 2025

Files Included:

• BeAligned\_Schema\_Packet\_FULL.json – machine-readable schema library (complete guidebook translation)

• This README – usage guidance for developers

## **1\. Purpose**

The BeAligned™ Schema Packet is a machine-readable translation of the BeAligned™ Editor’s Guidebook. It provides the rules, tone, and structured prompts needed for AI-guided reflection with parents in high-conflict co-parenting situations.

The schemas are designed to:  
• Keep all outputs child-centered, calm, and respectful.  
• Prevent drift into advice, judgment, or escalation.  
• Enforce the 7-step reflection process.  
• Provide utility banks (feelings, values) and framework prompts (CLEAR, BALANCE, etc.) as scaffolding.

## **2\. JSON Structure Overview**

The JSON file contains the following major sections:  
• metadata – version, source, notes  
• global\_guardrails – tone and safety rules (must\_do, must\_not\_do, handoff)  
• utility\_banks – feelings, values, frameworks (CLEAR, BALANCE, KIDS NEWS)  
• frameworks – 10 modules (Third Side, Arbinger, Sinek, Timms, EOS, Strategic Empathy, Affinity & Alliance, Consistency vs. Conflict, Scaffolding, Parenting Philosophy)  
• seven\_step\_process – structured schemas for Steps 1–7 (Issue Naming → Message Drafting) with parent role, AI role, and BeAligned-guided prompts  
• message\_drafting – formula \+ good/bad examples  
• knowledge\_audit\_fields – log structure for grounding sources, policy checks, rationale  
• integration\_notes – guidance for chaining steps and retrieval

## **3\. Usage Patterns**

Conversation Flow:  
1\. Always start with Step 1 (Issue Naming) and move sequentially through Steps 2–7.  
2\. At each step:  
   \- Load ai\_prompts from that step.  
   \- Apply global\_guardrails.  
   \- Offer reflection scaffolding, not solutions.  
3\. At Step 7 (Message Drafting), enforce message\_drafting.formula. Compare against good\_examples and reject/repair outputs resembling bad\_examples.

Frameworks:  
• Call on frameworks when a parent’s reflection relates to communication style, boundaries, empathy, etc.  
• Each framework has: core\_idea, application\_rules, and example\_prompts.

Utility Banks:  
• Use feelings\_bank and values\_bank to offer choices, not to label the user.

Guardrails:  
• Must always check against global\_guardrails.must\_do and must\_not\_do.  
• Include handoff text when outputs risk being interpreted as legal/clinical advice.

## **4\. Logging & Auditing**

Each output should include a knowledge\_audit object, e.g.:

{  
  "knowledge\_audit": {  
	"grounding\_sources": "Step 2 schema, feelings\_bank.vulnerable",  
	"policy\_checks": \["no\_blame", "child\_centered", "listener\_ready"\],  
	"knowledge\_rationale": "Used Feelings Exploration prompts to redirect anger into naming disappointment.",  
	"knowledge\_version": "Guidebook 2025-08-23"  
  }  
}

## **5\. Boundaries**

BeAligned™ is:  
• A reflective scaffold, communication aid, and alignment tool.  
• Not legal advice, therapy, or emergency response.

Developers must enforce:  
• No advice-giving beyond the schema rules.  
• No escalating or shaming outputs.  
• Always child-centered, calm, and respectful tone.

## **6\. Next Steps**

• Load BeAligned\_Schema\_Packet\_FULL.json as a resource library.  
• Chain the 7 steps in order for user sessions.  
• Use frameworks and utility banks for reinforcement.  
• Include knowledge\_audit logging for every AI output.

Contact: For questions about philosophy or application, reach out to Trina Nudson (BeAligned™ creator).


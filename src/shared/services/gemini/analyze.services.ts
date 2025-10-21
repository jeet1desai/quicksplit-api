import Logger from 'bunyan';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { config } from '@root/config';
import { BadRequestError } from '@shared/globals/helpers/error-handler';

class AnalyzeServices {
  private apiKey: string;
  private model: any;

  private genAI: any;
  private isEnabled: boolean;

  private log: Logger = config.createLogger('Analyze service');

  constructor() {
    this.apiKey = config.GOOGLE_GEMINI_API_KEY!;
    if (!this.apiKey) {
      this.log.warn('⚠️ Google Gemini API key not provided. AI features will be disabled.');
      this.isEnabled = false;
      return;
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL! });
    this.isEnabled = true;
  }

  public async analyzeMessage(message: any, context: any = {}) {
    if (!this.isEnabled) {
      return this.getFallbackResponse(message);
    }

    try {
      const prompt: any = this.buildPrompt(message, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      this.log.error('Gemini AI error:', error);
      return this.getFallbackResponse(message);
    }
  }

  private parseAIResponse(text: any) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new BadRequestError('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.intent || !parsed.confidence) {
        throw new BadRequestError('Invalid response format');
      }

      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        extractedData: parsed.extracted_data || {},
        suggestedResponse: parsed.suggested_response || '',
        requiresPrivateAction: parsed.requires_private_action || false
      };
    } catch (error) {
      this.log.error('Error parsing AI response:', error);
      return this.getFallbackResponse(text);
    }
  }

  private buildPrompt(message: any, context: any = {}) {
    const { groupName = '', userName = '' } = context;

    return `
        You are QuickSplit Bot, an intelligent expense splitting assistant for WhatsApp groups. 

        CONTEXT:
        - User: ${userName}
        - Group: ${groupName}
        - Message Type: Private Chat
        - Current Message: "${message}"

        TASK: Analyze the message and determine the user's intent. Respond with a JSON object containing:

        1. intent: One of these values:
        - "expense_log" - User wants to log an expense
        - "balance_check" - User wants to check their balance
        - "settlement" - User wants to settle debts
        - "breakdown" - User wants detailed breakdown
        - "export" - User wants to export data
        - "help" - User needs help/instructions
        - "consent_response" - User is responding to a consent request
        - "create_group" - User wants to create a new group
        - "delete_group" - User wants to delete a group
        - "general" - General conversation
        - "unknown" - Cannot determine intent

        2. confidence: Number between 0-1 indicating confidence level

        3. extracted_data: Object containing:
        - For expense_log: { amount, description, currency }
        - For consent_response: { transactionId, consent }
        - For other intents: relevant extracted information

        4. suggested_response: Appropriate bot response message

        5. requires_private_action: Boolean indicating if this requires private message handling

        EXAMPLES:

        Input: "1000 for dinner to @John @Jane"
        Output: {
        "intent": "expense_log",
        "confidence": 0.95,
        "extracted_data": {
            "amount": 1000,
            "description": "dinner",
            "currency": "USD"
        },
        "suggested_response": "✅ Expense logged: 1000 for dinner\\nSplit between 3 people (333.33 each)\\nConsent requests sent to tagged members.",
        "requires_private_action": true
        }

        Input: "how much do I owe?"
        Output: {
        "intent": "balance_check",
        "confidence": 0.9,
        "extracted_data": {},
        "suggested_response": "💰 You owe $150.50 across all your groups.\\n\\nDebts: $200.00\\nCredits: $49.50",
        "requires_private_action": false
        }

        Input: "yes 507f1f77bcf86cd799439011"
        Output: {
        "intent": "consent_response",
        "confidence": 0.95,
        "extracted_data": {
            "transactionId": "507f1f77bcf86cd799439011",
            "consent": true
        },
        "suggested_response": "✅ Consent recorded! Transaction confirmed.",
        "requires_private_action": false
        }

        Input: "settle up all my debts"
        Output: {
        "intent": "settlement",
        "confidence": 0.9,
        "extracted_data": {},
        "suggested_response": "💸 To clear all your debts, I recommend these payments:\\n\\n1. Pay $75.25 to John\\n2. Receive $25.00 from Jane\\n\\nReply 'confirm settle' to proceed.",
        "requires_private_action": false
        }

        Input: "yes settle 507f1f77bcf86cd799439011"
        Output: {
        "intent": "settlement_consent_response",
        "confidence": 0.95,
        "extracted_data": {
            "settlementId": "507f1f77bcf86cd799439011",
            "consent": true
        },
        "suggested_response": "✅ Settlement consent recorded!",
        "requires_private_action": false
        }

        Input: "confirm settle"
        Output: {
        "intent": "settlement_confirm",
        "confidence": 0.9,
        "extracted_data": {},
        "suggested_response": "🔔 Settlement consent requests sent to all parties involved.",
        "requires_private_action": false
        }

        Input: "1"
        Output: {
        "intent": "full_settlement",
        "confidence": 0.9,
        "extracted_data": {},
        "suggested_response": "Processing full settlement...",
        "requires_private_action": false
        }

        Input: "2"
        Output: {
        "intent": "selective_settlement",
        "confidence": 0.9,
        "extracted_data": {},
        "suggested_response": "Processing selective settlement...",
        "requires_private_action": false
        }

        Input: "3"
        Output: {
        "intent": "partial_settlement",
        "confidence": 0.9,
        "extracted_data": {},
        "suggested_response": "Processing partial settlement...",
        "requires_private_action": false
        }

        Input: "4"
        Output: {
        "intent": "group_settlement",
        "confidence": 0.9,
        "extracted_data": {},
        "suggested_response": "Processing group settlement...",
        "requires_private_action": false
        }

        Input: "settle with John only"
        Output: {
        "intent": "selective_settlement",
        "confidence": 0.9,
        "extracted_data": {
            "selectedPeople": ["John"]
        },
        "suggested_response": "Processing selective settlement with John...",
        "requires_private_action": false
        }

        Input: "pay $50 to John"
        Output: {
        "intent": "partial_settlement",
        "confidence": 0.9,
        "extracted_data": {
            "amount": 50,
            "targetPerson": "John"
        },
        "suggested_response": "Processing partial payment of $50 to John...",
        "requires_private_action": false
        }

        Input: "create group vacation with @John @Jane @Alice"
        Output: {
        "intent": "create_group",
        "confidence": 0.95,
        "extracted_data": {
            "groupName": "vacation",
            "description": "vacation with friends"
        },
        "suggested_response": "🏗️ Creating group 'vacation'...",
        "requires_private_action": false
        }

        Input: "delete group office"
        Output: {
        "intent": "delete_group",
        "confidence": 0.9,
        "extracted_data": {
            "groupName": "office"
        },
        "suggested_response": "🗑️ Are you sure you want to delete the group 'office'? This action cannot be undone. Type 'confirm delete office' to proceed.",
        "requires_private_action": false
        }

        Input: "confirm delete office"
        Output: {
        "intent": "delete_group_confirm",
        "confidence": 0.95,
        "extracted_data": {
            "groupName": "office",
            "confirmation": true
        },
        "suggested_response": "✅ Group 'office' has been deleted successfully.",
        "requires_private_action": false
        }

        Now analyze this message: "${message}"

        Respond with ONLY the JSON object, no additional text.
    `;
  }

  private getFallbackResponse(message: any) {
    // Default to help
    return {
      intent: 'help',
      confidence: 0.5,
      extractedData: {},
      suggestedResponse:
        'Hi! I\'m QuickSplit. I can help you with expense splitting, balance checking, and settlements. Type "help" for more commands.',
      requiresPrivateAction: false
    };
  }
}

export const analyzeService: AnalyzeServices = new AnalyzeServices();

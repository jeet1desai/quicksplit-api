import Logger from 'bunyan';

import { config } from '@root/config';
import { metaApiService } from './meta.services';
import { userService } from '../db/user.services';
import { analyzeService } from '../gemini/analyze.services';

class MessageServices {
  private log: Logger = config.createLogger('Whatsapp service');

  public async processMessage(message: any, metadata: any): Promise<any> {
    try {
      const { from, id: messageId, type, text } = message;

      const phoneNumber = metaApiService.extractPhoneNumber(from);

      await metaApiService.markMessageAsRead(messageId);

      let user = await userService.getUserByPhone(phoneNumber);

      const maybeStart = (text.body || '').trim().toLowerCase();
      if (maybeStart === 'hi' || maybeStart === 'hello' || maybeStart === 'start') {
        if (!user) {
          user = await userService.getUserOrCreate(phoneNumber);
          await metaApiService.sendMessage(from, `Hey there! Welcome to QuickSplit.`);
          return;
        }

        await metaApiService.sendMessage(from, `Hey there! Welcome back to QuickSplit.`);
        return;
      }

      let aiAnalysis: any;
      try {
        aiAnalysis = await analyzeService.analyzeMessage(text?.body || '', {
          userName: user.name
        });
        this.log.info('AI Analysis:', aiAnalysis);
      } catch (aiError) {
        this.log.error('AI Analysis Error:', aiError);
        aiAnalysis = {
          intent: 'unknown',
          confidence: 0.5,
          extractedData: {},
          suggestedResponse: 'I understand you want to interact with me. Please try a specific command.',
          requiresPrivateAction: false
        };
      }

      await this.handlePrivateMessage(message, phoneNumber, user, aiAnalysis);
    } catch (error) {
      this.log.error('Error processing message', error);
    }
  }

  private async handlePrivateMessage(message: any, phoneNumber: string, user: any, aiAnalysis: any) {
    const { from, text } = message;
    try {
      if (!text?.body) return;
      console.log(aiAnalysis);

      switch (aiAnalysis.intent) {
        case 'balance_check':
        case 'settlement':
        case 'settlement_confirm':
        case 'full_settlement':
        case 'selective_settlement':
        case 'partial_settlement':
        case 'group_settlement':
        case 'breakdown':
        case 'export':
        case 'consent_response':
        case 'settlement_consent_response':
          break;
        case 'help':
          await metaApiService.sendMessage(
            from,
            aiAnalysis.suggestedResponse || "Hi! I'm SplitBot. Here's what you can do:\n\n💰 Check balance: 'balance' or 'how much do I owe?'"
            // "Hi! I'm SplitBot. Here's what you can do:\n\n💰 Check balance: 'balance' or 'how much do I owe?'\n📊 Get breakdown: 'breakdown' or 'details'\n💸 Settle up: 'settle up' or 'settle all'\n📈 Export to sheets: 'export' or 'sheets'"
          );
          break;
        case 'general':
          await metaApiService.sendMessage(from, aiAnalysis.suggestedResponse || "I'm here to help with expense splitting and financial management.");
          break;
        default:
          await metaApiService.sendMessage(
            from,
            aiAnalysis.suggestedResponse || "I'm not sure what you're asking for. Type 'help' for available commands."
          );
          break;
      }
    } catch (error: any) {
      this.log.error('Error handling private message', error);
      await metaApiService.sendMessage(from, 'Sorry, I encountered an error processing your request. Please try again.');
    }
  }
}

export const messageService: MessageServices = new MessageServices();

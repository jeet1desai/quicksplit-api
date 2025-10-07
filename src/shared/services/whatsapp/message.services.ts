import Logger from 'bunyan';

import { config } from '@root/config';
import { metaApiService } from './meta.services';
import { userService } from '../db/user.services';
import { analyzeService } from '../gemini/analyze.services';
import { inviteService } from '../db/invite.services';
import { groupService } from '../db/group.services';
import { GroupModel } from '@features/whatsapp/model/group.model';
import { UserModel } from '@features/users/model/user.model';
import { phoneFormat } from '@shared/globals/helpers/phone-format';

class MessageServices {
  private log: Logger = config.createLogger('Whatsapp service');

  public async processMessage(message: any, metadata: any): Promise<any> {
    try {
      const { from, id: messageId, type, text } = message;

      const phoneNumber = metaApiService.extractPhoneNumber(from);

      await metaApiService.markMessageAsRead(messageId);

      const isGroupMessage = metadata?.type === 'group';

      const user = await userService.getUserOrCreate(phoneNumber);

      let aiAnalysis: any;
      try {
        aiAnalysis = await analyzeService.analyzeMessage(text?.body || '', {
          isGroupMessage,
          groupName: metadata?.group_name || '',
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

      if (isGroupMessage) {
        await this.handleGroupMessage(message, metadata, phoneNumber, user, aiAnalysis);
      } else {
        await this.handlePrivateMessage(message, phoneNumber, user, aiAnalysis);
      }
    } catch (error) {
      this.log.error('Error processing message', error);
    }
  }

  private async handlePrivateMessage(message: any, phoneNumber: string, user: any, aiAnalysis: any) {
    try {
      const { from, text } = message;
      console.log(user);

      if (!text?.body) return;
      try {
        const maybeStart = (text.body || '').trim().toLowerCase();
        if (maybeStart === 'hi' || maybeStart === 'hello' || maybeStart === 'start') {
          const link = `${config.WEB_BASE_URL}/signup?phone=${encodeURIComponent(phoneNumber)}`;
          await metaApiService.sendMessage(
            from,
            `Hey there! Welcome to QuickSplit.\n\nTo get started, tap the signup link: ${link}\n\nAfter signup, send me verification code to verify.`
          );
          return;
        }

        const maybeCode = (text.body || '').trim().toUpperCase();
        if (/^[A-Z0-9a-z]{6,8}$/.test(maybeCode)) {
          const result = await inviteService.verifyInviteCode(user._id, maybeCode);
          if (result.ok) {
            await metaApiService.sendMessage(from, "You're all set! ✅ Your account is verified. You can now log spends, check balance, and more.");
            return;
          }
          await metaApiService.sendMessage(from, "That code didn't work. Please re-check and send the 7-character code from the website.");
          return;
        }

        if (!user.onboarding?.isVerified) {
          const link = `${process.env.WEB_BASE_URL || 'https://your-site.com'}/signup?phone=${encodeURIComponent(phoneNumber)}`;
          await metaApiService.sendMessage(from, `Let's get you verified first.\nSignup: ${link}\nThen send me verification code.`);
          return;
        }

        switch (aiAnalysis.intent) {
          case 'balance_check':
            break;
          case 'settlement':
            break;

          case 'settlement_confirm':
            break;

          case 'full_settlement':
            break;

          case 'selective_settlement':
            break;

          case 'partial_settlement':
            break;

          case 'group_settlement':
            break;

          case 'breakdown':
            break;

          case 'export':
            break;

          case 'consent_response':
            break;

          case 'settlement_consent_response':
            break;

          case 'help':
            break;

          case 'general':
            break;

          default:
            await metaApiService.sendMessage(
              from,
              aiAnalysis.suggestedResponse || "I'm not sure what you're asking for. Type 'help' for available commands."
            );
        }
      } catch (error: any) {
        this.log.error('Error handling private message with AI:', error.message);
        await metaApiService.sendMessage(from, 'Sorry, I encountered an error processing your request. Please try again.');
      }
    } catch (error) {
      this.log.error('Error handling private message', error);
    }
  }

  private async handleGroupMessage(message: any, metadata: any, phoneNumber: string, user: any, aiAnalysis: any) {
    try {
      const { from, text, context } = message;
      const groupId = context?.id || metadata?.group_id;
      if (!text?.body) return;

      const messageText = (text.body || '').toLowerCase().trim();
      if (!this.isMessageForBot(messageText)) {
        return;
      }

      const group = await groupService.getGroupOrCreate(groupId, metadata);

      await group.addMember(user._id, phoneNumber, user.name);

      switch (aiAnalysis.intent) {
        case 'expense_log':
          break;

        case 'help':
          await metaApiService.sendMessage(
            from,
            aiAnalysis.suggestedResponse || "Hi! I'm QuickSplit. To log an expense, type: [Amount] for [Description] to @MemberName"
          );
          break;

        default:
          await metaApiService.sendMessage(
            from,
            `I understand you want to ${aiAnalysis.intent.replace('_', ' ')}. Please message me privately for this feature.`
          );
      }
    } catch (error) {
      this.log.error('Error handling group message', error);
    }
  }

  public async processGroupEvent(value: any) {
    try {
      const { metadata, contacts } = value;
      const groupId = metadata.group_id;

      if (!groupId) {
        console.log('No group ID found in metadata');
        return;
      }

      if (contacts && contacts.length > 0) {
        const botContact = contacts.find((contact: any) => contact.wa_id === config.META_PHONE_NUMBER_ID);

        if (botContact) {
          await this.handleBotAddedToGroup(groupId, value);
        }
      }

      // Check if bot was removed from group
      // This would require additional webhook events from Meta
      // For now, we'll handle it through message processing
    } catch (error) {
      console.error('Error processing group event:', error);
    }
  }

  public async handleBotAddedToGroup(groupId: string, eventData: any) {
    try {
      console.log(`🤖 Bot added to group: ${groupId}`);
      const groupInfo = await metaApiService.getGroupInfo(groupId);
      const membersData = await metaApiService.getGroupMembers(groupId);

      let group = await groupService.getGroupById(groupId);

      if (!group) {
        group = new GroupModel({
          groupId,
          name: groupInfo.name || 'Unknown Group',
          description: groupInfo.description || '',
          members: []
        });
      }

      const members = [];
      for (const memberData of membersData.data) {
        const phoneNumber = metaApiService.extractPhoneNumber(memberData.wa_id);

        let user = await userService.getUserOrCreate(phoneNumber);
        if (!user) {
          const phone = phoneFormat(phoneNumber);
          user = new UserModel({
            countryCode: phone?.countryCode || '',
            phoneNumber: phone?.nationalNumber || '',
            name: memberData.name || ''
          });
          await user.save();
        }

        members.push({
          user: user._id,
          role: 'member',
          joinedAt: new Date(),
          isActive: true
        });
      }
      group.members = members;
      await group.save();

      await this.sendGroupWelcomeMessage(groupId, group.name);

      console.log(`✅ Group ${group.name} onboarded successfully with ${members.length} members`);
    } catch (error) {
      console.error('Error handling bot addition to group:', error);
    }
  }

  public async sendGroupWelcomeMessage(groupId: string, groupName: string) {
    try {
      const welcomeMessage = `👋 Hello ${groupName}! I'm QuickSplit, your expense splitting assistant.
  
        💰 To log an expense, type:
        [Amount] for [Description] to @MemberName
        
        📝 Examples:
        • 1000 for dinner to @John @Jane
        • 500 for movie tickets to @Alice
        • 2000 for groceries to @Bob @Carol @Dave
        
        💡 I'll automatically:
        • Split the expense equally
        • Send consent requests to tagged members
        • Track balances across all your groups
        
        Type 'help' for more commands!
      `;
      await metaApiService.sendMessage(groupId, welcomeMessage, 'group');
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  private isMessageForBot(messageText: string): boolean {
    return /@\w+/.test(messageText);
  }
}

export const messageService: MessageServices = new MessageServices();

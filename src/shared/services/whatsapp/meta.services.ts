import { config } from '@root/config';
import axios from 'axios';

import Logger from 'bunyan';

class MetaApiService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseURL: string;

  private log: Logger = config.createLogger('Meta service');

  constructor() {
    this.accessToken = config.META_ACCESS_TOKEN!;
    this.phoneNumberId = config.META_PHONE_NUMBER_ID!;
    this.baseURL = 'https://graph.facebook.com/v23.0';
  }

  extractPhoneNumber(whatsappId: string): string {
    const match = whatsappId.match(/^(\d+)@/);
    return match ? match[1] : whatsappId;
  }

  async sendMessage(to: any, message: any, recipient_type = 'individual', messageType = 'text') {
    try {
      const payload = { messaging_product: 'whatsapp', to, recipient_type, type: messageType, [messageType]: { body: message } };
      const response = await axios.post(`${this.baseURL}/${this.phoneNumberId}/messages`, payload, {
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error: any) {
      this.log.error('Error sending message:', error.response?.data || error.message);
    }
  }

  async markMessageAsRead(messageId: string) {
    try {
      const payload = { messaging_product: 'whatsapp', status: 'read', message_id: messageId };
      const response = await axios.post(`${this.baseURL}/${this.phoneNumberId}/messages`, payload, {
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error: any) {
      this.log.error('Error marking message as read:', error.message);
    }
  }

  async sendTypingIndicator(to: string, messageId: string) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        message_id: messageId,
        recipient_type: 'individual',
        to,
        type: 'typing',
        typing: { action: 'typing_on' }
      };
      const response = await axios.post(`${this.baseURL}/${this.phoneNumberId}/messages`, payload, {
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending typing indicator:', error.response?.data || error.message);
    }
  }

  async stopTypingIndicator(to: string, messageId: string) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        message_id: messageId,
        recipient_type: 'individual',
        to,
        type: 'typing',
        typing: { action: 'typing_off' }
      };

      const response = await axios.post(`${this.baseURL}/${this.phoneNumberId}/messages`, payload, {
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error stopping typing indicator:', error.response?.data || error.message);
    }
  }
}

export const metaApiService: MetaApiService = new MetaApiService();

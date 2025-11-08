import { metaApiService } from '@shared/services/whatsapp/meta.services';

export const withTypingIndicator = async (to: string, messageId: string, asyncFunction: () => Promise<any>) => {
  try {
    await metaApiService.sendTypingIndicator(to, messageId);
    const result = await asyncFunction();
    return result;
  } catch (error) {
    console.error('Error in withTypingIndicator:', error);
    throw error;
  } finally {
    try {
      await metaApiService.stopTypingIndicator(to, messageId);
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }
};

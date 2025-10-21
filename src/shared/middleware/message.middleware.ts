import { metaApiService } from '@shared/services/whatsapp/meta.services';

export const withTypingIndicator = async (to: string, messageId: string, asyncFunction: () => Promise<any>) => {
  try {
    // Start typing indicator
    await metaApiService.sendTypingIndicator(to, messageId);

    // Add a small delay to ensure typing indicator is visible
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Execute the function
    const result = await asyncFunction();

    // Add a small delay before stopping the typing indicator
    await new Promise((resolve) => setTimeout(resolve, 500));

    return result;
  } catch (error) {
    console.error('Error in withTypingIndicator:', error);
    throw error;
  } finally {
    // Always stop typing indicator
    try {
      await metaApiService.stopTypingIndicator(to, messageId);
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }
};

import { metaApiService } from '@shared/services/whatsapp/meta.services';

export const withTypingIndicator = async (to: string, asyncFunction: () => Promise<any>) => {
  try {
    // Start typing indicator
    await metaApiService.sendTypingIndicator(to);

    // Execute the function
    const result = await asyncFunction();

    // Stop typing indicator
    await metaApiService.stopTypingIndicator(to);

    return result;
  } catch (error) {
    // Stop typing indicator even if there's an error
    await metaApiService.stopTypingIndicator(to);
    throw error;
  }
};

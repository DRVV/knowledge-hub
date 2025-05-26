import { initializePromptTemplates } from './lib/langfuse';

export async function register() {
  // This function runs when the Next.js app starts
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    try {
      console.log('Initializing Langfuse prompt templates...');
      await initializePromptTemplates();
      console.log('Langfuse prompt templates initialization completed');
    } catch (error) {
      console.error('Failed to initialize Langfuse prompt templates:', error);
    }
  }
}

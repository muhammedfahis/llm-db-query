import { Tool } from 'ollama';
import { openaiFormatTools } from './openaiFormatTools';

// Ollama uses the same OpenAI function-calling format.
// The SDK's Tool type has a narrow JSON-schema subset, so we cast via unknown.
export const ollamaTools = openaiFormatTools as unknown as Tool[];

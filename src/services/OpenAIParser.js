import OpenAI from 'openai';

const PROMPT_CONFIG = {
  id: 'pmpt_6867fd7d55408195837431a01c6d01aa0df59ec7a5e95a0b',
  version: '1'
};

export async function parseWithPrompt(apiKey, text) {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  return client.responses.parse({
    model: 'gpt-4o',
    prompt: PROMPT_CONFIG,
    input: text
  });
}

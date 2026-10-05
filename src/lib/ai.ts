import ZAI from 'z-ai-web-dev-sdk'

export async function getZAI() {
  return await ZAI.create()
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** Run a chat completion with fallback error handling */
export async function aiChat(messages: ChatMessage[], maxTokens = 1200, temperature = 0.6): Promise<{ content: string; tokens: number }> {
  const zai = await getZAI()
  const completion = await zai.chat.completions.create({
    messages: messages as never,
    thinking: { type: 'disabled' },
    max_tokens: maxTokens,
    temperature,
  })
  const content = completion.choices[0]?.message?.content || 'پاسخی دریافت نشد.'
  const tokens = Math.ceil(content.length / 3)
  return { content, tokens }
}

import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, Message } from "ai";
import { Pica } from "@picahq/ai";
import { AISessionManager } from "@/lib/ai-session";

export async function POST(request: Request) {
  const { messages, userId }: { messages: Message[], userId: string } = await request.json();

  if (!userId) {
    return new Response('User ID is required', { status: 400 });
  }

  const pica = new Pica(process.env.PICA_SECRET_KEY as string);
  const sessionManager = new AISessionManager(userId);

  try {
    // Get existing session to restore conversation history
    const existingSession = await sessionManager.getSession();
    let allMessages = messages;

    if (existingSession && existingSession.messages) {
      // Merge existing messages with new ones, avoiding duplicates
      const existingMessages = existingSession.messages as Message[];
      const existingMessageIds = new Set(existingMessages.map(m => m.id));
      const newMessages = messages.filter(m => !existingMessageIds.has(m.id));
      
      allMessages = [...existingMessages, ...newMessages];
    }

    const system = await pica.generateSystemPrompt();

    const stream = streamText({
      model: openai("gpt-4o"),
      system,
      tools: {
        ...pica.oneTool,
      },
      messages: convertToCoreMessages(allMessages),
      maxSteps: 20,
      onFinish: async (result) => {
        try {
          // Update messages with the AI's response
          const updatedMessages = [
            ...allMessages,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant' as const,
              content: result.text || '',
              toolInvocations: result.toolCalls?.map(call => ({
                toolCallId: call.toolCallId,
                toolName: call.toolName,
                args: call.args,
                state: 'result' as const,
                result: call.result
              })) || []
            }
          ];

          // Parse task information from tool invocations
          const { task, status } = AISessionManager.parseTaskFromToolInvocations(
            result.toolCalls || []
          );

          // Save the updated session
          await sessionManager.saveSession(updatedMessages, task, status);

          console.log(`Session saved for user ${userId}:`, {
            messageCount: updatedMessages.length,
            currentTask: task,
            taskStatus: status
          });
        } catch (error) {
          console.error('Error saving session:', error);
          // Don't throw here to avoid breaking the response stream
        }
      }
    });

    console.log('Chat request processed:', {
      userId,
      messageCount: allMessages.length,
      hasExistingSession: !!existingSession
    });

    return (await stream).toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
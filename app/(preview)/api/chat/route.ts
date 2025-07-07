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
    const system = await pica.generateSystemPrompt();

    const stream = streamText({
      model: openai("gpt-4o"),
      system,
      tools: {
        ...pica.oneTool,
      },
      // Use the messages directly from the client (which includes full history)
      messages: convertToCoreMessages(messages),
      maxSteps: 20,
      onFinish: async (result) => {
        try {
          // Create the AI's response message
          const aiResponse: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.text || '',
            toolInvocations: result.toolCalls?.map(call => ({
              toolCallId: call.toolCallId,
              toolName: call.toolName,
              args: call.args,
              state: 'result' as const,
              result: call.result
            })) || []
          };

          // Update messages with the AI's response
          const updatedMessages = [...messages, aiResponse];

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
      messageCount: messages.length
    });

    return (await stream).toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
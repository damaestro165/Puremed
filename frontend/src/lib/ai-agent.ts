import { HfInference } from '@huggingface/inference'

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY)

// Context to help the model understand its role
const SYSTEM_PROMPT = `You are Dr. Sarah, a licensed medical professional providing preliminary medical advice. 
Remember to:
- Always be professional and empathetic
- Ask clarifying questions when needed
- Provide general health guidance
- Recommend in-person consultation when necessary
- Never make definitive diagnoses
- Never prescribe medications
- Always remind users this is preliminary advice`

interface AiResponse {
  response: string;
  error?: string;
}

export async function getDoctorResponse(userMessage: string, conversationHistory: string[]): Promise<AiResponse> {
  try {
    if (!import.meta.env.VITE_HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key is not configured')
    }

    console.log('Sending request to Hugging Face...')
    
    // Format conversation history with system prompt
    const prompt = `${SYSTEM_PROMPT}\n\nConversation history:\n${conversationHistory.join('\n')}\n\nUser: ${userMessage}\nDoctor:`

    // Using a more reliable model
    const response = await hf.textGeneration({
      model: 'gpt2',  // Using a simpler model for testing
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.2
      }
    })

    console.log('Response received:', response)

    if (!response.generated_text) {
      throw new Error('No response received from the model')
    }

    return {
      response: response.generated_text.trim()
    }
  } catch (error) {
    console.error('AI Agent Error:', error)
    
    // More specific error messages
    let errorMessage = "I apologize, but I'm having trouble connecting to the medical AI system right now."
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage += " The API key seems to be missing or invalid."
      } else if (error.message.includes('429')) {
        errorMessage += " We've reached our request limit. Please try again in a few minutes."
      } else if (error.message.includes('404')) {
        errorMessage += " The AI model is currently unavailable."
      }
    }

    return {
      response: errorMessage,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 
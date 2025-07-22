const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_HEALTHCARE_ENDPOINT;
const AZURE_API_KEY = import.meta.env.VITE_AZURE_HEALTHCARE_API_KEY;

interface AzureResponse {
  answer: string;
  confidence: number;
}

export async function getAzureHealthResponse(userMessage: string): Promise<string> {
  try {
    const response = await fetch(`${AZURE_ENDPOINT}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AZURE_API_KEY}`
      },
      body: JSON.stringify({
        type: 'message',
        text: userMessage
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AzureResponse = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Azure Healthcare Bot Error:', error);
    throw error;
  }
} 
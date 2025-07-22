interface Response {
  triggers: string[];
  responses: string[];
}

const mockResponses: Response[] = [
  {
    triggers: ['headache', 'head', 'pain', 'migraine'],
    responses: [
      "I understand you're experiencing headache symptoms. How long have you been feeling this way?",
      "Could you describe the pain? Is it sharp, dull, or throbbing?",
      "Are you experiencing any other symptoms along with the headache?",
      "Have you taken any medication for the headache?"
    ]
  },
  {
    triggers: ['fever', 'temperature', 'hot', 'cold'],
    responses: [
      "What's your current temperature? Have you measured it with a thermometer?",
      "Are you experiencing any other symptoms besides the fever?",
      "How long have you had the fever? Has it been consistent or coming and going?",
      "Have you taken any fever-reducing medication?"
    ]
  },
  {
    triggers: ['cough', 'breathing', 'chest'],
    responses: [
      "Is your cough dry or productive (bringing up mucus)?",
      "How long have you been experiencing this cough?",
      "Are you having any difficulty breathing?",
      "Have you noticed any triggers that make the cough worse?"
    ]
  },
  {
    triggers: ['stomach', 'nausea', 'vomiting', 'diarrhea'],
    responses: [
      "When did these stomach symptoms begin?",
      "Have you been able to keep food and water down?",
      "Are you experiencing any abdominal pain?",
      "Have you noticed any changes in your appetite?"
    ]
  }
];

const generalResponses = [
  "Could you tell me more about your symptoms?",
  "How long have you been experiencing these symptoms?",
  "Have you noticed anything that makes the symptoms better or worse?",
  "Are you currently taking any medications?",
  "Have you had any similar symptoms in the past?",
  "I understand your concern. Could you provide more details about what you're experiencing?",
  "Based on what you've described, it would be best to have an in-person examination to properly evaluate your condition.",
  "Remember, this is preliminary advice. If symptoms persist or worsen, please seek immediate medical attention."
];

export function getMockResponse(userMessage: string): string {
  const lowercaseMessage = userMessage.toLowerCase();
  
  // Check for specific triggers
  for (const mockResponse of mockResponses) {
    if (mockResponse.triggers.some(trigger => lowercaseMessage.includes(trigger))) {
      return mockResponse.responses[Math.floor(Math.random() * mockResponse.responses.length)];
    }
  }
  
  // If no specific triggers found, return a general response
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
} 
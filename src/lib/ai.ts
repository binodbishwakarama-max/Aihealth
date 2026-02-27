import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (free - primary) - 1500 req/day, 1M tokens/min
const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Initialize Groq (free) as secondary
const getGroq = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Groq({ apiKey });
};

// Initialize OpenAI as fallback
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

interface SymptomInput {
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
  severity: number;
  language?: string;
}

interface AIAnalysisResponse {
  possible_conditions: string[];
  risk_level: 'Low' | 'Medium' | 'High';
  self_care: string[];
  see_doctor_if: string[];
  emergency_signs: string[];
}

const HIGH_RISK_KEYWORDS = [
  'chest pain',
  'breathing difficulty',
  'difficulty breathing',
  'shortness of breath',
  'fainting',
  'fainted',
  'unconscious',
  'severe headache',
  'sudden numbness',
  'sudden weakness',
  'slurred speech',
  'vision loss',
  'sudden vision',
  'suicidal',
  'self harm',
  'seizure',
  'stroke',
  'heart attack',
  'choking',
  'severe bleeding',
  'overdose',
];

function containsHighRiskKeywords(symptoms: string): boolean {
  const lowerSymptoms = symptoms.toLowerCase();
  return HIGH_RISK_KEYWORDS.some(keyword => lowerSymptoms.includes(keyword));
}

export async function analyzeSymptoms(input: SymptomInput): Promise<AIAnalysisResponse> {
  const systemPrompt = `You are HealthLens, a medical information assistant.

STRICT RULES:
- Do NOT diagnose diseases definitively.
- Do NOT prescribe medication.
- This is for EDUCATIONAL purposes only.
- Always recommend consulting a healthcare professional.
- Present information as possibilities, not certainties.

Provide helpful, accurate medical education information based on the symptoms provided.`;

  const userPrompt = `User Input:
Age: ${input.age}
Gender: ${input.gender || 'Not specified'}
Symptoms: ${input.symptoms}
Duration: ${input.duration}
Severity: ${input.severity}/10

Based on this information, provide educational guidance. Return STRICT JSON only with this exact structure:

{
  "possible_conditions": ["condition 1", "condition 2", "condition 3"],
  "risk_level": "Low|Medium|High",
  "self_care": ["tip 1", "tip 2", "tip 3"],
  "see_doctor_if": ["sign 1", "sign 2", "sign 3"],
  "emergency_signs": ["emergency sign 1", "emergency sign 2"]
}

Important:
- possible_conditions should be educational possibilities, not diagnoses
- risk_level must be exactly "Low", "Medium", or "High"
- self_care should be general wellness tips
- see_doctor_if should list warning signs
- emergency_signs should list symptoms requiring immediate medical attention
${input.language && input.language !== 'English' ? `\nIMPORTANT: Respond with ALL text content (conditions, tips, signs) in ${input.language}. The JSON keys must remain in English, but ALL values must be in ${input.language}.` : ''}`;

  try {
    const gemini = getGemini();
    const groq = getGroq();
    const openai = getOpenAI();

    if (!gemini && !groq && !openai) {
      // Return fallback response if no AI configured
      console.warn('No AI API key configured (Gemini, Groq, or OpenAI)');
      return {
        possible_conditions: ['Please configure GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY to enable AI analysis'],
        risk_level: containsHighRiskKeywords(input.symptoms) ? 'High' : 'Medium',
        self_care: ['Rest and monitor your symptoms', 'Stay hydrated', 'Track any changes in symptoms'],
        see_doctor_if: ['Symptoms persist or worsen', 'You develop new symptoms', 'You are concerned about your health'],
        emergency_signs: ['Difficulty breathing', 'Chest pain', 'Loss of consciousness', 'Severe bleeding'],
      };
    }

    let content: string | null = null;

    // Try Gemini first (free - best limits)
    if (gemini) {
      try {
        console.log('Using Gemini AI...');
        const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        content = response.text();
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
      } catch (geminiError) {
        console.error('Gemini error, trying Groq fallback:', geminiError);
      }
    }

    // Fallback to Groq if Gemini failed
    if (!content && groq) {
      try {
        console.log('Using Groq AI fallback...');
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });
        content = response.choices[0]?.message?.content || null;
      } catch (groqError) {
        console.error('Groq error, trying OpenAI fallback:', groqError);
      }
    }

    // Fallback to OpenAI if Groq failed
    if (!content && openai) {
      try {
        console.log('Using OpenAI fallback...');
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });
        content = response.choices[0]?.message?.content || null;
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError);
      }
    }

    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed: AIAnalysisResponse = JSON.parse(content);

    // Apply keyword-based risk override
    if (containsHighRiskKeywords(input.symptoms)) {
      parsed.risk_level = 'High';

      // Ensure emergency signs are highlighted
      if (!parsed.emergency_signs.some(sign =>
        sign.toLowerCase().includes('immediate') ||
        sign.toLowerCase().includes('emergency')
      )) {
        parsed.emergency_signs.unshift('Seek immediate medical attention based on your symptoms');
      }
    }

    // Apply severity-based risk adjustment
    if (input.severity >= 8 && parsed.risk_level === 'Low') {
      parsed.risk_level = 'Medium';
    }
    if (input.severity >= 9 && parsed.risk_level !== 'High') {
      parsed.risk_level = 'High';
    }

    // Validate response structure
    return {
      possible_conditions: Array.isArray(parsed.possible_conditions) ? parsed.possible_conditions : [],
      risk_level: ['Low', 'Medium', 'High'].includes(parsed.risk_level) ? parsed.risk_level : 'Medium',
      self_care: Array.isArray(parsed.self_care) ? parsed.self_care : [],
      see_doctor_if: Array.isArray(parsed.see_doctor_if) ? parsed.see_doctor_if : [],
      emergency_signs: Array.isArray(parsed.emergency_signs) ? parsed.emergency_signs : [],
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);

    // Return safe fallback response
    return {
      possible_conditions: ['Unable to analyze symptoms at this time'],
      risk_level: containsHighRiskKeywords(input.symptoms) ? 'High' : 'Medium',
      self_care: ['Rest and monitor your symptoms', 'Stay hydrated', 'Track any changes in symptoms'],
      see_doctor_if: ['Symptoms persist or worsen', 'You develop new symptoms', 'You are concerned about your health'],
      emergency_signs: ['Difficulty breathing', 'Chest pain', 'Loss of consciousness', 'Severe bleeding'],
    };
  }
}

// Chat message interface
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Health Chat function for follow-up questions
export async function healthChat(
  messages: ChatMessage[],
  context?: { symptoms?: string; analysis?: string },
  language?: string
): Promise<string> {
  const languageInstruction = language && language !== 'English'
    ? `\n\nIMPORTANT: You MUST respond entirely in ${language}. All your responses should be in ${language}.`
    : '';

  const systemPrompt = `You are HealthLens AI, a friendly and knowledgeable health assistant.

IMPORTANT GUIDELINES:
- You provide general health information and education only
- You are NOT a doctor and cannot diagnose conditions
- You cannot prescribe medications
- Always recommend consulting a healthcare professional for medical advice
- Be empathetic, clear, and helpful
- Keep responses concise but informative
- If asked about emergencies, always advise calling emergency services (911)
- You can discuss symptoms, general wellness, prevention, and when to seek care

${context?.symptoms ? `User's previously reported symptoms: ${context.symptoms}` : ''}
${context?.analysis ? `Previous analysis context: ${context.analysis}` : ''}

Be conversational and supportive while maintaining medical accuracy.${languageInstruction}`;

  const gemini = getGemini();
  const groq = getGroq();

  if (!gemini && !groq) {
    return "I'm sorry, but the AI service is currently unavailable. Please try again later or consult a healthcare professional directly.";
  }

  // Build conversation history
  const conversationHistory = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // Try Gemini first
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Build prompt with conversation history
      let prompt = systemPrompt + '\n\nConversation:\n';
      for (const msg of conversationHistory) {
        prompt += `${msg.role === 'user' ? 'User' : 'HealthLens'}: ${msg.content}\n`;
      }
      prompt += 'HealthLens:';

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (geminiError) {
      console.error('Gemini chat error:', geminiError);
    }
  }

  // Fallback to Groq
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      return response.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
    } catch (groqError) {
      console.error('Groq chat error:', groqError);
    }
  }

  return "I'm having trouble processing your request. Please try again in a moment.";
}

// Vision Analysis function for analyzing visual symptoms
export async function analyzeVision(
  imageBase64: string,
  mimeType: string,
  language?: string
): Promise<string> {
  const languageInstruction = language && language !== 'English'
    ? `\n\nIMPORTANT: You MUST respond entirely in ${language}. All your responses should be in ${language}.`
    : '';

  const systemPrompt = `You are HealthLens Vision AI, an innovative medical imaging assistant.
You have been provided with an image of a symptom (e.g., a skin rash, bite, swelling, or eye condition).

STRICT RULES:
- You are strictly an educational assistant, NOT a doctor.
- NEVER diagnose definitively.
- Speak empathetically and clearly.
- Describe what you see in the image clinically but simply.
- Suggest possible common conditions that could cause this appearance (for educational purposes).
- Advise the user on whether they should seek immediate emergency care, see a doctor soon, or if it looks like something they can manage at home with OTC care.
- Do NOT prescribe medications.
- Structure your response using markdown with clear headings (e.g., "What I See", "Possible Causes", "Recommended Next Steps").

${languageInstruction}`;

  const gemini = getGemini();
  const openai = getOpenAI();

  if (!gemini && !openai) {
    throw new Error('No Vision AI service (Gemini or OpenAI) is currently configured.');
  }

  // Sanitize base64 string if it contains the data prefix
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Try Gemini first
  if (gemini) {
    try {
      console.log('Using Gemini Vision AI...');
      const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      };

      const result = await model.generateContent([systemPrompt, imagePart]);
      const response = result.response;
      return response.text();
    } catch (geminiError) {
      console.error('Gemini vision error:', geminiError);
    }
  }

  // Fallback to OpenAI
  if (openai) {
    try {
      console.log('Using OpenAI Vision fallback...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please analyze this image based on your instructions.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${cleanBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      });
      return response.choices[0]?.message?.content || "I couldn't generate a visual analysis. Please try again.";
    } catch (openaiError) {
      console.error('OpenAI vision error:', openaiError);
    }
  }

  throw new Error("I'm having trouble analyzing the image. Please try again in a moment.");
}

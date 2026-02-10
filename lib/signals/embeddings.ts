import Groq from 'groq-sdk';

function getClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const groq = getClient();

// Groq uses OpenAI-compatible embeddings API
// Using text-embedding-3-small model (1536 dimensions)
const MODEL = 'text-embedding-3-small';
const DIMENSIONS = 1536;

/**
 * Generate embedding for a single text
 */
export function canGenerateEmbeddings(): boolean {
  return groq !== null;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!groq) throw new Error('GROQ_API_KEY is not set');
  try {
    const response = await groq.embeddings.create({
      model: MODEL,
      input: text,
      dimensions: DIMENSIONS,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!groq) throw new Error('GROQ_API_KEY is not set');
  try {
    const response = await groq.embeddings.create({
      model: MODEL,
      input: texts,
      dimensions: DIMENSIONS,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    throw error;
  }
}

/**
 * Convert embedding array to JSON string for storage
 */
export function embeddingToJson(embedding: number[]): string {
  return JSON.stringify(embedding);
}

/**
 * Parse embedding JSON string to array
 */
export function embeddingFromJson(json: string): number[] {
  return JSON.parse(json);
}

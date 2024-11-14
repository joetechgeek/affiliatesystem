import { HfInference } from '@huggingface/inference';
import { StreamingTextResponse } from 'ai';
import { Message } from 'ai';
import { getProductsForAI } from '@/utils/products';

// Validate environment variables
if (!process.env.HUGGINGFACE_API_KEY) {
  throw new Error('Missing HUGGINGFACE_API_KEY environment variable');
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface ChatMessage extends Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();
    
    if (!messages?.length) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }), 
        { status: 400 }
      );
    }

    // Fetch products from database
    const products = await getProductsForAI();
    
    // Group products by category
    const productsByCategory = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    // Format products by category
    const productCatalog = Object.entries(productsByCategory)
      .map(([category, products]) => {
        return `
CATEGORY: ${category.toUpperCase()}
${products.map(product => `
PRODUCT: ${product.name}
ID: ${product.id}
PRICE: $${product.price}
DESCRIPTION: ${product.description}
---`).join('\n')}
`;
      }).join('\n');

    const lastMessage = messages[messages.length - 1].content;

    const prompt = `[INST] You are Joe, the AI assistant for JoeTechStore. You have access to our current product catalog and must ONLY recommend products from this list.

PRODUCT CATALOG:
${productCatalog}

INSTRUCTIONS:
1. ONLY recommend products that are listed in the catalog above
2. Use EXACT product names and prices as shown
3. If a product isn't in the catalog, say "I apologize, but we don't currently carry that item"
4. When recommending products, always include:
   - Exact product name
   - Price
   - Brief description
5. Stay focused on tech products and shopping assistance

CUSTOMER MESSAGE: ${lastMessage}

Respond as Joe, being helpful and professional while strictly following these instructions. [/INST]`;

    const response = await hf.textGenerationStream({
      model: 'HuggingFaceH4/zephyr-7b-beta',
      inputs: prompt,
      parameters: {
        max_new_tokens: 400,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.1,
        return_full_text: false,
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.token.text) {
              controller.enqueue(chunk.token.text);
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 
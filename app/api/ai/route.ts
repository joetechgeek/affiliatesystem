import { HfInference } from '@huggingface/inference';
import { StreamingTextResponse } from 'ai';
import { Message } from 'ai';
import { getProductsForAI } from '@/utils/products';
import { Product } from '@/types/product';

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

    // Fetch fresh product data
    const products = await getProductsForAI();
    
    if (!products.length) {
      return new Response(
        JSON.stringify({ error: 'No products available' }), 
        { status: 500 }
      );
    }

    // Group products by category
    const productsByCategory = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    // Format products for the AI
    const productCatalog = Object.entries(productsByCategory)
      .map(([category, products]) => {
        return `
CATEGORY: ${category.toUpperCase()}
${products.map(product => `
PRODUCT: ${product.name}
ID: ${product.id}
PRICE: $${product.price.toFixed(2)}
STOCK: ${product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
DESCRIPTION: ${product.description}
FEATURES: ${Array.isArray(product.features) ? product.features.join(', ') : 'N/A'}
URL: ${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.id}
LAST UPDATED: ${new Date(product.updated_at || '').toLocaleString()}
---`).join('\n')}
`;
      }).join('\n');

    const lastMessage = messages[messages.length - 1].content;

    const prompt = `[INST] You are Joe, the AI assistant for JoeTechStore. You have access to our LIVE product catalog.

CURRENT PRODUCT CATALOG (Last Updated: ${new Date().toLocaleString()}):
${productCatalog}

STRICT INSTRUCTIONS:
1. ONLY recommend products from our current catalog
2. ALWAYS check stock before recommending (only suggest in-stock items)
3. Use EXACT product names and prices
4. Include product URLs when recommending items
5. When recommending products, include:
   - Exact product name
   - Current price
   - Stock availability
   - Direct product URL
   - Key features
6. If a product is out of stock, suggest similar in-stock alternatives
7. If asked about a product we don't carry, politely say we don't have it
8. Keep responses friendly but professional

CUSTOMER MESSAGE: ${lastMessage}

Respond as Joe, being helpful and accurate with product information. [/INST]`;

    const response = await hf.textGenerationStream({
      model: 'HuggingFaceH4/zephyr-7b-beta',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500, // Increased for more detailed responses
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
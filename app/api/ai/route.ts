import { HfInference } from '@huggingface/inference';
import { StreamingTextResponse } from 'ai';
import { Message } from 'ai';
import { getProductsForAI } from '@/utils/products';
import { Product } from '@/types/product';
import { createClient } from '@supabase/supabase-js';

// Validate Supabase connection first
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Move HF initialization inside the route handler
let hf: HfInference;

interface ChatMessage extends Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  // Add request ID for tracking
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] Starting AI chat request`);

  try {
    // Test Supabase connection first
    try {
      const { data, error } = await supabase.from('products').select('count');
      if (error) throw error;
      console.log(`[${requestId}] Supabase connection test successful`);
    } catch (e) {
      console.error(`[${requestId}] Supabase connection failed:`, e);
      throw new Error('Database connection failed');
    }

    // Initialize HF with validation
    if (!hf) {
      if (!process.env.HUGGINGFACE_API_KEY) {
        console.error(`[${requestId}] Missing HUGGINGFACE_API_KEY`);
        throw new Error('HUGGINGFACE_API_KEY is not configured');
      }
      try {
        hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        console.log(`[${requestId}] HuggingFace client initialized`);
      } catch (e) {
        console.error(`[${requestId}] HuggingFace initialization failed:`, e);
        throw new Error('Failed to initialize AI service');
      }
    }

    // Parse request body
    let messages: ChatMessage[];
    try {
      const body = await req.json();
      messages = body.messages;
      console.log(`[${requestId}] Request body parsed:`, {
        messageCount: messages?.length,
        lastMessage: messages?.[messages?.length - 1]?.content?.substring(0, 50)
      });
    } catch (e) {
      console.error(`[${requestId}] Request body parse failed:`, e);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          requestId 
        }), 
        { status: 400 }
      );
    }

    // Validate messages
    if (!Array.isArray(messages) || !messages.length) {
      console.error(`[${requestId}] Invalid messages format:`, messages);
      return new Response(
        JSON.stringify({ 
          error: 'Messages must be a non-empty array',
          requestId 
        }), 
        { status: 400 }
      );
    }

    // Fetch products
    let products: Product[];
    try {
      products = await getProductsForAI();
      console.log(`[${requestId}] Fetched ${products.length} products`);
      
      if (!products.length) {
        throw new Error('No products found');
      }
    } catch (e) {
      console.error(`[${requestId}] Product fetch failed:`, e);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch products',
          requestId,
          details: e instanceof Error ? e.message : undefined
        }), 
        { status: 500 }
      );
    }

    // Format catalog
    let productCatalog: string;
    try {
      const productsByCategory = products.reduce((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
      }, {} as Record<string, Product[]>);

      productCatalog = Object.entries(productsByCategory)
        .map(([category, products]) => `
CATEGORY: ${category.toUpperCase()}
${products.map(p => `
PRODUCT: ${p.name}
PRICE: $${p.price.toFixed(2)}
STOCK: ${p.stock > 0 ? `${p.stock} available` : 'Out of stock'}
DESCRIPTION: ${p.description || 'No description available'}
---`).join('\n')}`)
        .join('\n');

      console.log(`[${requestId}] Product catalog formatted successfully`);
    } catch (e) {
      console.error(`[${requestId}] Catalog formatting failed:`, e);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process product data',
          requestId 
        }), 
        { status: 500 }
      );
    }

    // Get user message
    const lastMessage = messages[messages.length - 1].content;

    // Call AI API
    let response;
    try {
      console.log(`[${requestId}] Calling HuggingFace API`);
      response = await hf.textGenerationStream({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: `[INST] You are Joe, the AI assistant for JoeTechStore.
Here is our current product catalog:
${productCatalog}

Customer message: ${lastMessage}

Respond as Joe, being helpful and accurate. Only recommend products from the catalog above. [/INST]`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.1,
          return_full_text: false,
        }
      });
      console.log(`[${requestId}] HuggingFace API call successful`);
    } catch (e) {
      console.error(`[${requestId}] HuggingFace API call failed:`, e);
      return new Response(
        JSON.stringify({ 
          error: 'AI service error',
          requestId,
          details: e instanceof Error ? e.message : undefined
        }), 
        { status: 503 }
      );
    }

    // Handle streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(`[${requestId}] Starting response stream`);
          for await (const chunk of response) {
            if (chunk.token.text) {
              controller.enqueue(chunk.token.text);
            }
          }
          controller.close();
          console.log(`[${requestId}] Stream completed successfully`);
        } catch (error) {
          console.error(`[${requestId}] Stream error:`, error);
          controller.error(error);
        }
      },
    });

    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        requestId,
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
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
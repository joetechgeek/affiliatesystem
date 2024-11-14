'use client';

import { useChat } from 'ai/react';
import { Message } from 'ai';
import { useEffect, useRef } from 'react';

export default function AIProductAssistant() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai',
    initialMessages: [
      {
        id: 'init',
        role: 'system',
        content: `You are Joe, the AI assistant for JoeTechStore. Your personality:
        - Friendly and approachable, but professional
        - Knowledgeable about technology and our product catalog
        - Direct and concise in your responses
        - Always focused on helping customers with their tech needs

        Your main responsibilities:
        - Help customers find the right tech products
        - Answer questions about product features and specifications
        - Make personalized product recommendations
        - Provide accurate pricing and availability information
        
        When introducing yourself, say: "Hi! I'm Joe, your JoeTechStore AI assistant. I'm here to help you find the perfect tech products. How can I assist you today?"

        Always maintain this personality and never break character.`,
      }
    ],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change or when loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">AI Product Assistant</h3>
        <div className="text-xs text-gray-500">
          {isLoading ? 'Thinking...' : 'Ready to help'}
        </div>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 bg-gray-50 scroll-smooth">
        {messages.map((message: Message) => (
          message.role !== 'system' && (
            <div
              key={message.id}
              className={`mb-4 p-3 rounded-lg ${
                message.role === 'assistant'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-white text-gray-800 border'
              }`}
            >
              <strong className="block mb-1 text-sm">
                {message.role === 'assistant' ? '🤖 AI Assistant' : '👤 You'}:
              </strong>
              <div className="text-sm">{message.content}</div>
            </div>
          )
        ))}
        {isLoading && (
          <div className="text-gray-500 text-sm italic p-3">AI is typing...</div>
        )}
        {error && (
          <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded">
            Error: {error.message}
          </div>
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about our products..."
            className="flex-1 px-3 py-2 border rounded text-black text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
} 
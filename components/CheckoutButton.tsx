import React, { useState } from 'react';
import { CartItem } from '@/types/cart';

interface CheckoutButtonProps {
  items: CartItem[];
  couponCode?: string;
  discountAmount?: number;
}

export default function CheckoutButton({ items, couponCode, discountAmount }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setCheckoutError(null);

    try {
      console.log('Sending checkout request with:', { items, couponCode, discountAmount });
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.product.name,
              },
              unit_amount: Math.round(item.product.price * 100),
            },
            quantity: item.quantity,
          })),
          couponCode: couponCode || undefined,
          discountAmount: discountAmount || undefined,
        }),
      });

      const data = await response.json();
      console.log('Received response:', data);

      if (!response.ok) {
        console.error('Server response:', data);
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      if (!data.sessionUrl) {
        throw new Error('No session URL returned from the server');
      }

      console.log('Redirecting to Stripe:', data.sessionUrl);
      window.location.href = data.sessionUrl;
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      setCheckoutError(`An error occurred during checkout: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {isLoading ? 'Processing...' : 'Proceed to Checkout'}
      </button>
      {checkoutError && <p className="text-red-500 mt-2">{checkoutError}</p>}
    </div>
  );
}

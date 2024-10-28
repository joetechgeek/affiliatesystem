import { syncProductsToStripe } from '@/src/stripe/sync-products';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.email !== 'joetechgeek@gmail.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await syncProductsToStripe();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

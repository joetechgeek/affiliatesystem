import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function validateCoupon(couponCode: string, userId: string | undefined) {
  if (!userId) {
    return { 
      valid: false, 
      message: 'User not authenticated',
      discountAmount: 0,
      code: '',
      couponOwnerId: ''
    }
  }

  try {
    // Check if the coupon exists in the profiles table
    const { data: couponOwner, error: couponError } = await supabase
      .from('profiles')
      .select('id, coupon_code')
      .eq('coupon_code', couponCode)
      .single()

    if (couponError || !couponOwner) {
      return { valid: false, message: 'Invalid coupon code' }
    }

    // Check if the coupon belongs to the current user
    if (couponOwner.id === userId) {
      return { valid: false, message: 'You cannot use your own coupon' }
    }

    // Comment out the check for previous usage to allow coupon reuse
    /*
    // Check if the coupon has been used
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('coupon_code', couponCode)
      .single()

    if (order) {
      return { valid: false, message: 'This coupon has already been used' }
    }
    */

    // If all checks pass, return valid coupon with 10% discount
    return { 
      valid: true, 
      discountAmount: 0.1, 
      code: couponCode,
      couponOwnerId: couponOwner.id,
      message: 'Coupon applied successfully'
    }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { 
      valid: false, 
      discountAmount: 0, 
      code: '', 
      couponOwnerId: '', 
      message: 'Error validating coupon' 
    }
  }
}

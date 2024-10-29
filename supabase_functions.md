
DECLARE
  v_order_id BIGINT;
  v_issuer_id UUID;
  v_commission_rate NUMERIC := 0.1; -- 10% commission
  v_commission_amount NUMERIC;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Create order record
    INSERT INTO orders (
      user_id,
      total_amount,
      discount_applied,
      coupon_code,
      stripe_payment_intent_id,
      status
    ) VALUES (
      p_user_id,
      p_total_amount,
      p_discount_amount,
      p_coupon_code,
      p_payment_intent_id,
      'completed'
    ) RETURNING id INTO v_order_id;

    -- 2. Update coupon if used
    IF p_coupon_code IS NOT NULL THEN
      -- Get issuer_id from profiles using coupon_code
      SELECT id INTO v_issuer_id 
      FROM profiles 
      WHERE coupon_code = p_coupon_code;

      -- Update coupon status
      UPDATE coupons 
      SET 
        used = TRUE,
        used_by = p_user_id,
        used_at = NOW()
      WHERE code = p_coupon_code;

      -- 3. Create commission record if coupon was used
      v_commission_amount := p_total_amount * v_commission_rate;
      
      INSERT INTO commissions (
        issuer_id,
        order_id,
        commission_amount,
        paid
      ) VALUES (
        v_issuer_id,
        v_order_id,
        v_commission_amount,
        FALSE
      );

      -- Update order with issuer
      UPDATE orders 
      SET issued_by = v_issuer_id 
      WHERE id = v_order_id;
    END IF;

    -- Return success
    RETURN json_build_object(
      'success', TRUE,
      'order_id', v_order_id
    );
  EXCEPTION WHEN OTHERS THEN
    -- Roll back transaction on error
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
END;



DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert order item
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price
    ) VALUES (
      p_order_id,
      (item->>'product_id')::BIGINT,
      (item->>'quantity')::INTEGER,
      (item->>'price')::NUMERIC
    );

    -- Update product stock
    UPDATE products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::BIGINT;
  END LOOP;
END;



BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, coupon_code)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name', NEW.email, NEW.raw_user_meta_data->>'coupon_code');
  RETURN NEW;
END;



BEGIN
  UPDATE products
  SET stock = GREATEST(stock - quantity, 0)
  WHERE id = p_id;
END;

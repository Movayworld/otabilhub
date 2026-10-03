-- OtabilHub Inventory Ledger

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_product ON public.inventory_movements(product_id);
CREATE INDEX idx_inv_reference ON public.inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inv_created ON public.inventory_movements(created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inv read" ON public.inventory_movements FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Inv insert" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Inv update" ON public.inventory_movements FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION public.perform_stock_operation(
  p_product_id UUID, p_movement_type TEXT, p_quantity_change INTEGER,
  p_reason TEXT DEFAULT NULL, p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL, p_notes TEXT DEFAULT NULL, p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, error TEXT, new_stock INTEGER, movement_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_current_stock INTEGER; v_new_stock INTEGER; v_movement_id UUID;
BEGIN
  IF p_movement_type NOT IN ('SALE','RESTOCK','MANUAL_ADJUSTMENT','CORRECTION','DAMAGED','CANCELLATION_RESTOCK') THEN
    RETURN QUERY SELECT FALSE, 'Invalid movement type'::TEXT, NULL::INTEGER, NULL::UUID; RETURN;
  END IF;
  SELECT stock_quantity INTO v_current_stock FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, 'Product not found'::TEXT, NULL::INTEGER, NULL::UUID; RETURN; END IF;
  v_new_stock := v_current_stock + p_quantity_change;
  IF v_new_stock < 0 THEN RETURN QUERY SELECT FALSE, 'Insufficient stock'::TEXT, NULL::INTEGER, NULL::UUID; RETURN; END IF;
  UPDATE public.products SET stock_quantity = v_new_stock, updated_at = now() WHERE id = p_product_id;
  IF p_created_by IS NULL THEN p_created_by := auth.uid(); END IF;
  INSERT INTO public.inventory_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reason, reference_type, reference_id, notes, created_by)
  VALUES (p_product_id, p_movement_type, p_quantity_change, v_current_stock, v_new_stock, p_reason, p_reference_type, p_reference_id, p_notes, p_created_by)
  RETURNING id INTO v_movement_id;
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_new_stock, v_movement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.perform_stock_operation TO authenticated;
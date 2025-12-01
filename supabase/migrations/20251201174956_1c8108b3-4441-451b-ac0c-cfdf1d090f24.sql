-- Create reviews table for order ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Customers can view their own reviews
CREATE POLICY "Customers can view their reviews" ON public.reviews
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = reviews.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Customers can create reviews for their orders
CREATE POLICY "Customers can create reviews" ON public.reviews
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = reviews.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Vendors can view reviews for their orders
CREATE POLICY "Vendors can view reviews" ON public.reviews
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    JOIN public.vendors ON orders.vendor_id = vendors.id
    WHERE orders.id = reviews.order_id 
    AND vendors.user_id = auth.uid()
  )
);

-- Insert student role for current user
INSERT INTO public.user_roles (user_id, role)
VALUES ('563d48a4-a534-487b-8db6-bef16455298f', 'student')
ON CONFLICT (user_id, role) DO NOTHING;
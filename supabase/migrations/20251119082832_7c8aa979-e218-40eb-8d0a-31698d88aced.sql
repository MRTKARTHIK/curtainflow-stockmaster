-- Add DELETE policy for stock_movements table
CREATE POLICY "Authenticated users can delete stock movements"
ON public.stock_movements
FOR DELETE
USING (auth.uid() IS NOT NULL);
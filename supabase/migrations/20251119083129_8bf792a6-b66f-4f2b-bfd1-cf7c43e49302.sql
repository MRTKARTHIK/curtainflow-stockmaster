-- Add DELETE policy for production_stages table (only completed stages)
CREATE POLICY "Authenticated users can delete completed production stages"
ON public.production_stages
FOR DELETE
USING (auth.uid() IS NOT NULL AND completed_at IS NOT NULL);
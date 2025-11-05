-- Create enum types for roles and movement types
CREATE TYPE public.app_role AS ENUM ('admin', 'store_manager', 'production_manager', 'staff');
CREATE TYPE public.movement_type AS ENUM ('IN', 'OUT', 'RETURN');
CREATE TYPE public.production_stage_name AS ENUM ('cutting', 'stitching', 'finishing', 'quality_check', 'packing_dispatch');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create fabrics master table
CREATE TABLE public.fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fabric_type TEXT NOT NULL,
  color TEXT,
  current_quantity DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  unit TEXT DEFAULT 'meters' NOT NULL,
  reorder_level DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fabrics"
  ON public.fabrics FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage fabrics"
  ON public.fabrics FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create fabric_batches table for tracking purchases
CREATE TABLE public.fabric_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID REFERENCES public.fabrics(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  supplier_name TEXT,
  supplier_contact TEXT,
  purchase_date DATE,
  unit_cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.fabric_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fabric batches"
  ON public.fabric_batches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage fabric batches"
  ON public.fabric_batches FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create stock_movements table for tracking all fabric movements
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID REFERENCES public.fabrics(id) ON DELETE CASCADE NOT NULL,
  movement_type movement_type NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  job_card_id UUID,
  batch_id UUID REFERENCES public.fabric_batches(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Create job_cards table
CREATE TABLE public.job_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  description TEXT,
  curtain_type TEXT,
  quantity INTEGER NOT NULL,
  current_stage production_stage_name DEFAULT 'cutting' NOT NULL,
  status TEXT DEFAULT 'in_progress' NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job cards"
  ON public.job_cards FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage job cards"
  ON public.job_cards FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create production_stages table for tracking job progress
CREATE TABLE public.production_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id UUID REFERENCES public.job_cards(id) ON DELETE CASCADE NOT NULL,
  stage production_stage_name NOT NULL,
  stage_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  responsible_user UUID REFERENCES public.profiles(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view production stages"
  ON public.production_stages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage production stages"
  ON public.production_stages FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create job_card_fabrics junction table
CREATE TABLE public.job_card_fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id UUID REFERENCES public.job_cards(id) ON DELETE CASCADE NOT NULL,
  fabric_id UUID REFERENCES public.fabrics(id) ON DELETE CASCADE NOT NULL,
  required_quantity DECIMAL(10, 2) NOT NULL,
  issued_quantity DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.job_card_fabrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job card fabrics"
  ON public.job_card_fabrics FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage job card fabrics"
  ON public.job_card_fabrics FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add foreign key constraint for stock_movements job_card_id
ALTER TABLE public.stock_movements
  ADD CONSTRAINT fk_stock_movements_job_card
  FOREIGN KEY (job_card_id) REFERENCES public.job_cards(id) ON DELETE CASCADE;

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update fabric quantity on stock movement
CREATE OR REPLACE FUNCTION public.update_fabric_quantity()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  IF NEW.movement_type = 'IN' THEN
    UPDATE public.fabrics
    SET current_quantity = current_quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.fabric_id;
  ELSIF NEW.movement_type = 'OUT' THEN
    UPDATE public.fabrics
    SET current_quantity = current_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.fabric_id;
  ELSIF NEW.movement_type = 'RETURN' THEN
    UPDATE public.fabrics
    SET current_quantity = current_quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.fabric_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_stock_movement_created
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_fabric_quantity();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_fabrics_updated_at
  BEFORE UPDATE ON public.fabrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_cards_updated_at
  BEFORE UPDATE ON public.job_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
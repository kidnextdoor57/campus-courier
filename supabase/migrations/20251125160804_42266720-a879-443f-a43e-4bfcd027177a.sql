-- Allow users to insert their own role during signup
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create function to auto-create vendor/rider profiles based on role
CREATE OR REPLACE FUNCTION public.handle_role_specific_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If vendor role, create vendor profile
  IF NEW.role = 'vendor' THEN
    INSERT INTO public.vendors (user_id, name, location, description)
    VALUES (
      NEW.user_id,
      (SELECT full_name FROM public.profiles WHERE id = NEW.user_id),
      'Babcock University Campus',
      'New vendor on campus'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- If rider role, create rider profile
  IF NEW.role = 'rider' THEN
    INSERT INTO public.rider_profiles (user_id, vehicle_type)
    VALUES (
      NEW.user_id,
      'Motorcycle'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role-specific profiles
DROP TRIGGER IF EXISTS on_user_role_created ON public.user_roles;
CREATE TRIGGER on_user_role_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_role_specific_profile();
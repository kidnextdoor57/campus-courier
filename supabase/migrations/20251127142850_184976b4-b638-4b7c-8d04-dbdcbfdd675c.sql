-- Fix search_path security warnings for trigger functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
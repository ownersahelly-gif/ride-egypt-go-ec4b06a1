
INSERT INTO public.user_roles (user_id, role) VALUES ('8cae77ab-3d55-4a69-b316-90ec593d2a81', 'admin') ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.profiles (user_id, full_name, user_type) VALUES ('8cae77ab-3d55-4a69-b316-90ec593d2a81', 'Ali Ehab', 'admin') ON CONFLICT (user_id) DO UPDATE SET user_type = 'admin';

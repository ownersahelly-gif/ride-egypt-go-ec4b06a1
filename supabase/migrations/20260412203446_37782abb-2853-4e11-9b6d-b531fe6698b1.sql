
CREATE TABLE public.partner_package_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partner_companies(id) ON DELETE CASCADE,
  route_request_id UUID REFERENCES public.partner_route_requests(id) ON DELETE SET NULL,
  package_name_en TEXT NOT NULL,
  package_name_ar TEXT NOT NULL DEFAULT '',
  ride_count INTEGER NOT NULL DEFAULT 10,
  validity_days INTEGER NOT NULL DEFAULT 30,
  suggested_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_package_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can create their own package requests"
ON public.partner_package_requests FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.partner_companies
  WHERE partner_companies.id = partner_package_requests.partner_id
  AND partner_companies.user_id = auth.uid()
));

CREATE POLICY "Partners can view their own package requests"
ON public.partner_package_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.partner_companies
  WHERE partner_companies.id = partner_package_requests.partner_id
  AND partner_companies.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all package requests"
ON public.partner_package_requests FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_partner_package_requests_updated_at
BEFORE UPDATE ON public.partner_package_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- First shift existing stops in the return route to make room at the beginning
-- Current stops are at positions 1-8, shift them to 3-10
UPDATE public.stops 
SET stop_order = stop_order + 2 
WHERE route_id = '7a5c2d7e-35bd-4cea-a4ba-9a319a274fcb';

-- Insert Sheraton stop at position 0 (last stop in original = first in return)
INSERT INTO public.stops (route_id, name_en, name_ar, lat, lng, stop_order, stop_type)
VALUES (
  '7a5c2d7e-35bd-4cea-a4ba-9a319a274fcb',
  'Sheraton, Sheraton Al Matar, HELIOPOLIS، Cairo Governorate 4471350, Egypt',
  'شيراتون، شيراتون المطار، هليوبوليس، القاهرة',
  30.102309, 31.380609,
  0,
  'both'
);

-- Insert El-Matbaa stop at position 1
INSERT INTO public.stops (route_id, name_en, name_ar, lat, lng, stop_order, stop_type)
VALUES (
  '7a5c2d7e-35bd-4cea-a4ba-9a319a274fcb',
  'El-Matbaa, Monshaat Al Bakari, Al Haram, Giza Governorate, Egypt',
  'المطبعة، منشأة البكاري، الهرم، الجيزة',
  30.11078, 31.344883,
  1,
  'both'
);

-- Insert شارع عمرو بن العاص المطبعة near the end (between position 9 and 10)
-- Current last stop (شارع الملك فيصل) is now at position 10, we need to shift it to 11
UPDATE public.stops 
SET stop_order = 11 
WHERE route_id = '7a5c2d7e-35bd-4cea-a4ba-9a319a274fcb' 
AND stop_order = 10;

INSERT INTO public.stops (route_id, name_en, name_ar, lat, lng, stop_order, stop_type)
VALUES (
  '7a5c2d7e-35bd-4cea-a4ba-9a319a274fcb',
  'شارع عمرو بن العاص المطبعة، King Faisal St, Monshaat Al Bakari, Al Haram, Giza Governorate 01211, Egypt',
  'شارع عمرو بن العاص المطبعة، شارع الملك فيصل، منشأة البكاري، الهرم، الجيزة',
  30.000978, 31.166602,
  10,
  'both'
);
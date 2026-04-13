-- Fix the gap at position 2 by shifting stops 3-11 down by 1
UPDATE public.stops 
SET stop_order = stop_order - 1 
WHERE route_id = '7a5c2d7e-35bd-4cea-a4ba-9a319a274fcb' 
AND stop_order >= 3;
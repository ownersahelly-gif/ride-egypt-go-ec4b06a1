import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';
import { ChevronLeft, ChevronRight, MapPin, Clock, Car, RefreshCw, Radio } from 'lucide-react';

const TrackShuttle = () => {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking');
  const Back = lang === 'ar' ? ChevronRight : ChevronLeft;

  const [booking, setBooking] = useState<any>(null);
  const [shuttle, setShuttle] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchData = async () => {
    if (!bookingId) { setLoading(false); return; }
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*, routes(*), shuttles(*)')
      .eq('id', bookingId)
      .single();
    
    if (bookingData) {
      setBooking(bookingData);
      setRoute(bookingData.routes);
      setShuttle(bookingData.shuttles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [bookingId]);

  // Supabase Realtime subscription for live shuttle location
  useEffect(() => {
    if (!shuttle?.id) return;
    
    const channel = supabase
      .channel(`shuttle-${shuttle.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shuttles',
          filter: `id=eq.${shuttle.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setShuttle((prev: any) => ({ ...prev, ...updated }));
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shuttle?.id]);

  // Fallback polling every 15s in case realtime is delayed
  useEffect(() => {
    if (!shuttle?.id) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from('shuttles').select('current_lat, current_lng, status').eq('id', shuttle.id).single();
      if (data) setShuttle((prev: any) => ({ ...prev, ...data }));
    }, 15000);
    return () => clearInterval(interval);
  }, [shuttle?.id]);

  const markers = [];
  if (route) {
    markers.push({ lat: route.origin_lat, lng: route.origin_lng, label: 'A', color: 'green' as const });
    markers.push({ lat: route.destination_lat, lng: route.destination_lng, label: 'B', color: 'red' as const });
  }
  if (shuttle?.current_lat && shuttle?.current_lng) {
    markers.push({ lat: shuttle.current_lat, lng: shuttle.current_lng, label: '🚐', color: 'blue' as const });
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto flex items-center h-16 px-4 gap-4">
          <Link to="/my-bookings"><Button variant="ghost" size="icon"><Back className="w-5 h-5" /></Button></Link>
          <h1 className="text-lg font-bold text-foreground">{t('tracking.title')}</h1>
          {isLive && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <Radio className="w-3 h-3 animate-pulse" />
              {lang === 'ar' ? 'مباشر' : 'Live'}
            </span>
          )}
          <div className="ms-auto">
            <Button variant="ghost" size="icon" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapView
          className="h-full min-h-[400px]"
          markers={markers}
          origin={route ? { lat: route.origin_lat, lng: route.origin_lng } : undefined}
          destination={route ? { lat: route.destination_lat, lng: route.destination_lng } : undefined}
          showDirections={!!route}
          center={shuttle?.current_lat ? { lat: shuttle.current_lat, lng: shuttle.current_lng } : undefined}
          zoom={13}
          showUserLocation={true}
        />

        {/* Bottom info card */}
        {booking && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-lg max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{lang === 'ar' ? route?.name_ar : route?.name_en}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  shuttle?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                }`}>
                  {shuttle?.status === 'active' ? t('tracking.onTheWay') : t('tracking.waiting')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lang === 'ar' ? route?.origin_name_ar : route?.origin_name_en}</span>
                <span>→</span>
                <span>{lang === 'ar' ? route?.destination_name_ar : route?.destination_name_en}</span>
              </div>
              {shuttle && (
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{shuttle.vehicle_model}</span>
                  <span>{shuttle.vehicle_plate}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{booking.scheduled_date} · {booking.scheduled_time}</span>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackShuttle;

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, Users, ArrowRight, Search, Ticket, ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';

const BookRide = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const Back = lang === 'ar' ? ChevronRight : ChevronLeft;

  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [selectedPickup, setSelectedPickup] = useState('');
  const [selectedDropoff, setSelectedDropoff] = useState('');
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'browse' | 'details'>('browse');

  // Date-based browsing
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rideInstances, setRideInstances] = useState<any[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);

  // Quick date buttons
  const getDateOptions = () => {
    const options: { label: string; date: string }[] = [];
    const today = new Date();
    const dayNames = lang === 'ar'
      ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      let label = '';
      if (i === 0) label = lang === 'ar' ? 'اليوم' : 'Today';
      else if (i === 1) label = lang === 'ar' ? 'غداً' : 'Tomorrow';
      else label = `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
      options.push({ label, date: dateStr });
    }
    return options;
  };

  useEffect(() => {
    supabase.from('routes').select('*').eq('status', 'active').then(({ data }) => {
      setRoutes(data || []);
    });
  }, []);

  useEffect(() => {
    fetchRideInstances(selectedDate);
  }, [selectedDate]);

  const fetchRideInstances = async (date: string) => {
    setLoadingRides(true);
    const { data } = await supabase
      .from('ride_instances')
      .select('*, routes(name_en, name_ar, origin_name_en, origin_name_ar, destination_name_en, destination_name_ar, price, estimated_duration_minutes)')
      .eq('ride_date', date)
      .eq('status', 'scheduled')
      .order('departure_time');
    setRideInstances(data || []);
    setLoadingRides(false);
  };

  const loadStops = async (routeId: string) => {
    if (stops[routeId]) return;
    const { data } = await supabase.from('stops').select('*').eq('route_id', routeId).order('stop_order');
    setStops((prev) => ({ ...prev, [routeId]: data || [] }));
  };

  const selectRide = (ride: any) => {
    setSelectedRide(ride);
    setSelectedRoute(ride.routes);
    loadStops(ride.route_id);
    setStep('details');
  };

  const filteredRoutes = routes.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name_en.toLowerCase().includes(q) || r.name_ar.includes(q) ||
      r.origin_name_en.toLowerCase().includes(q) || r.destination_name_en.toLowerCase().includes(q);
  });

  // Filter ride instances by search
  const filteredRides = rideInstances.filter((ri) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return ri.routes?.name_en?.toLowerCase().includes(q) || ri.routes?.name_ar?.includes(q) ||
      ri.routes?.origin_name_en?.toLowerCase().includes(q) || ri.routes?.destination_name_en?.toLowerCase().includes(q);
  });

  const handleBook = async () => {
    if (!user || !selectedRide) return;
    setLoading(true);
    try {
      // Check seat availability
      if (selectedRide.available_seats < seats) {
        toast({ title: lang === 'ar' ? 'المقاعد غير كافية' : 'Not enough seats', description: lang === 'ar' ? `متاح فقط ${selectedRide.available_seats} مقاعد` : `Only ${selectedRide.available_seats} seats available`, variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        route_id: selectedRide.route_id,
        shuttle_id: selectedRide.shuttle_id,
        pickup_stop_id: selectedPickup || null,
        dropoff_stop_id: selectedDropoff || null,
        seats,
        total_price: (selectedRide.routes?.price || 0) * seats,
        scheduled_date: selectedRide.ride_date,
        scheduled_time: selectedRide.departure_time,
        status: 'pending',
      });
      if (error) throw error;

      // Update available seats
      await supabase.from('ride_instances').update({
        available_seats: selectedRide.available_seats - seats,
      }).eq('id', selectedRide.id);

      toast({ title: t('booking.success'), description: t('booking.successDesc') });
      navigate('/my-bookings');
    } catch (error: any) {
      toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const routeStops = selectedRide ? stops[selectedRide.route_id] || [] : [];
  const dateOptions = getDateOptions();

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto flex items-center h-16 px-4 gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon"><Back className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">{t('booking.title')}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {step === 'browse' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input placeholder={t('booking.searchPlaceholder')} className="ps-11 h-12 text-base rounded-xl"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Date picker */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                <Calendar className="w-4 h-4 inline me-1" />
                {lang === 'ar' ? 'اختر اليوم' : 'Select Day'}
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map((opt) => (
                  <button key={opt.date} onClick={() => setSelectedDate(opt.date)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors ${
                      selectedDate === opt.date
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Extended date picker */}
              <div className="mt-2">
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-48" />
              </div>
            </div>

            {/* Available rides */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {lang === 'ar' ? 'الرحلات المتاحة' : 'Available Rides'}
              </h2>

              {loadingRides ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : filteredRides.length > 0 ? (
                <div className="space-y-3">
                  {filteredRides.map((ride) => (
                    <button key={ride.id} onClick={() => selectRide(ride)}
                      className="w-full text-start bg-card border border-border rounded-xl p-5 hover:border-secondary/40 hover:shadow-card-hover transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">
                          {lang === 'ar' ? ride.routes?.name_ar : ride.routes?.name_en}
                        </h3>
                        <span className="text-lg font-bold text-primary">{ride.routes?.price} EGP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="truncate">{lang === 'ar' ? ride.routes?.origin_name_ar : ride.routes?.origin_name_en}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                        <MapPin className="w-4 h-4 text-destructive shrink-0" />
                        <span className="truncate">{lang === 'ar' ? ride.routes?.destination_name_ar : ride.routes?.destination_name_en}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />{ride.departure_time?.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />{ride.routes?.estimated_duration_minutes} {t('booking.min')}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${ride.available_seats <= 3 ? 'text-destructive' : 'text-green-600'}`}>
                          <Users className="w-3.5 h-3.5" />
                          {ride.available_seats}/{ride.total_seats} {lang === 'ar' ? 'مقعد متاح' : 'seats left'}
                        </span>
                      </div>
                      {ride.available_seats <= 3 && ride.available_seats > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-destructive font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {lang === 'ar' ? 'عدد قليل متبقي!' : 'Few seats left!'}
                        </div>
                      )}
                      {ride.available_seats === 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-destructive font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {lang === 'ar' ? 'مكتمل - لا توجد مقاعد' : 'Full - No seats available'}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {lang === 'ar' ? 'لا توجد رحلات متاحة في هذا اليوم' : 'No rides available on this day'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ar' ? 'جرب يوم آخر أو اطلب مسار جديد' : 'Try another day or request a new route'}
                  </p>
                  <Link to="/request-route"><Button className="mt-4">{t('booking.requestNew')}</Button></Link>
                </div>
              )}
            </div>

            {/* All routes fallback */}
            {filteredRides.length === 0 && filteredRoutes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {lang === 'ar' ? 'جميع المسارات المتاحة (بدون جدول محدد):' : 'All available routes (no scheduled ride yet):'}
                </h3>
                <div className="space-y-2">
                  {filteredRoutes.slice(0, 5).map((route) => (
                    <div key={route.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground text-sm">{lang === 'ar' ? route.name_ar : route.name_en}</h4>
                        <span className="text-sm font-bold text-primary">{route.price} EGP</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 text-green-500" />
                        <span>{lang === 'ar' ? route.origin_name_ar : route.origin_name_en}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{lang === 'ar' ? route.destination_name_ar : route.destination_name_en}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'details' && selectedRide && selectedRoute && (
          <div className="space-y-6">
            <button onClick={() => { setStep('browse'); setSelectedRide(null); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Back className="w-4 h-4" />{t('booking.backToRoutes')}
            </button>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {lang === 'ar' ? selectedRoute.name_ar : selectedRoute.name_en}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>{lang === 'ar' ? selectedRoute.origin_name_ar : selectedRoute.origin_name_en}</span>
                <ArrowRight className="w-4 h-4" />
                <span>{lang === 'ar' ? selectedRoute.destination_name_ar : selectedRoute.destination_name_en}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-surface rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-primary">{selectedRoute.price} EGP</p>
                  <p className="text-xs text-muted-foreground">{t('booking.perSeat')}</p>
                </div>
                <div className="bg-surface rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-foreground">{selectedRide.departure_time?.slice(0, 5)}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الانطلاق' : 'Departure'}</p>
                </div>
                <div className="bg-surface rounded-xl p-4 text-center">
                  <p className={`text-xl font-bold ${selectedRide.available_seats <= 3 ? 'text-destructive' : 'text-green-600'}`}>
                    {selectedRide.available_seats}/{selectedRide.total_seats}
                  </p>
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مقاعد متاحة' : 'Seats left'}</p>
                </div>
              </div>

              <div className="bg-surface rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{selectedRide.ride_date}</span>
                  <span className="text-muted-foreground">·</span>
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{selectedRide.departure_time?.slice(0, 5)}</span>
                </div>
              </div>

              {routeStops.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div className="space-y-2">
                    <Label>{t('booking.pickupStop')}</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={selectedPickup} onChange={(e) => setSelectedPickup(e.target.value)}>
                      <option value="">{t('booking.selectStop')}</option>
                      {routeStops.filter(s => s.stop_type !== 'dropoff').map(s => (
                        <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('booking.dropoffStop')}</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={selectedDropoff} onChange={(e) => setSelectedDropoff(e.target.value)}>
                      <option value="">{t('booking.selectStop')}</option>
                      {routeStops.filter(s => s.stop_type !== 'pickup').map(s => (
                        <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-6">
                <Label>{t('booking.seats')}</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setSeats(Math.max(1, seats - 1))} disabled={seats <= 1}>-</Button>
                  <span className="text-lg font-bold w-8 text-center">{seats}</span>
                  <Button variant="outline" size="icon"
                    onClick={() => setSeats(Math.min(selectedRide.available_seats, seats + 1))}
                    disabled={seats >= selectedRide.available_seats}>+</Button>
                  <span className="text-xs text-muted-foreground">
                    ({lang === 'ar' ? `حد أقصى ${selectedRide.available_seats}` : `max ${selectedRide.available_seats}`})
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('booking.total')}</span>
                  <span className="text-primary">{selectedRoute.price * seats} EGP</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleBook}
                disabled={loading || selectedRide.available_seats === 0 || seats > selectedRide.available_seats}>
                {loading ? t('auth.loading') : (selectedRide.available_seats === 0
                  ? (lang === 'ar' ? 'مكتمل' : 'Full')
                  : t('booking.confirm'))}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookRide;
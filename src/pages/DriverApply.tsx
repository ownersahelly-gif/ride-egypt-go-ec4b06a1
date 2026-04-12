import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Car, Camera, Loader2 } from 'lucide-react';

const DriverApply = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const Back = lang === 'ar' ? ChevronRight : ChevronLeft;
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    license_number: '', vehicle_model: '', vehicle_plate: '', vehicle_year: '', experience_years: '',
  });
  const [facePhoto, setFacePhoto] = useState<File | null>(null);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: lang === 'ar' ? 'الملف كبير جداً' : 'File too large', variant: 'destructive' });
      return;
    }
    setFacePhoto(file);
    setFacePhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!facePhoto) {
      toast({ title: lang === 'ar' ? 'يرجى رفع صورة الوجه' : 'Please upload a face photo', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Upload face photo
      let avatarUrl: string | null = null;
      const ext = facePhoto.name.split('.').pop();
      const filePath = `driver-photos/${user.id}/${Date.now()}.${ext}`;
      const { uploadToBunny } = await import('@/lib/bunnyUpload');
      avatarUrl = await uploadToBunny(facePhoto, filePath);

      // Update profile with avatar
      if (avatarUrl) {
        await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', user.id);
      }

      const { error } = await supabase.from('driver_applications').insert({
        user_id: user.id,
        license_number: form.license_number,
        vehicle_model: form.vehicle_model,
        vehicle_plate: form.vehicle_plate,
        vehicle_year: parseInt(form.vehicle_year),
        experience_years: parseInt(form.experience_years) || 0,
      });
      if (error) throw error;
      toast({ title: t('driver.applicationSuccess'), description: t('driver.applicationSuccessDesc') });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      <header className="bg-card border-b border-border shrink-0 z-40 safe-area-top">
        <div className="container mx-auto flex items-center h-16 px-4 gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><Back className="w-5 h-5" /></Button></Link>
          <h1 className="text-lg font-bold text-foreground">{t('driver.applyTitle')}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto container mx-auto px-4 py-8 max-w-lg pb-24">
        {/* Face Photo Upload */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary transition-colors"
          >
            {facePhotoPreview ? (
              <img src={facePhotoPreview} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-primary" />
            )}
            <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-primary-foreground text-[10px] py-0.5 text-center">
              {lang === 'ar' ? 'صورة' : 'Photo'}
            </div>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        <p className="text-center text-xs text-muted-foreground mb-6">
          {lang === 'ar' ? 'يرجى رفع صورة واضحة لوجهك' : 'Please upload a clear photo of your face'}
        </p>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="space-y-2">
            <Label>{t('driver.licenseNumber')}</Label>
            <Input value={form.license_number} onChange={(e) => update('license_number', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('driver.vehicleModel')}</Label>
            <Input value={form.vehicle_model} onChange={(e) => update('vehicle_model', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('driver.vehiclePlate')}</Label>
            <Input value={form.vehicle_plate} onChange={(e) => update('vehicle_plate', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('driver.vehicleYear')}</Label>
              <Input type="number" value={form.vehicle_year} onChange={(e) => update('vehicle_year', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t('driver.experience')}</Label>
              <Input type="number" value={form.experience_years} onChange={(e) => update('experience_years', e.target.value)} />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (<><Loader2 className="w-4 h-4 me-1 animate-spin" />{t('auth.loading')}</>) : t('driver.submit')}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default DriverApply;
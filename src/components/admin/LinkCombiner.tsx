import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link2, Plus, Trash2, MapPin, Loader2, Route, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { ParsedLink, OrderedStop } from './link-combiner/types';
import { parseGoogleMapsLink, generateOptimizedStops } from './link-combiner/utils';
import RouteMapPreview from './link-combiner/RouteMapPreview';

const LinkCombiner = ({ lang }: { lang: string }) => {
  const [links, setLinks] = useState<ParsedLink[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [orderedStops, setOrderedStops] = useState<OrderedStop[] | null>(null);

  const addLink = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setParsing(true);
    try {
      const parsed = await parseGoogleMapsLink(trimmed);
      const newLink: ParsedLink = {
        id: crypto.randomUUID(),
        raw: trimmed,
        origin: parsed?.origin || null,
        destination: parsed?.destination || null,
        error: parsed ? undefined : (lang === 'ar' ? 'تعذر استخراج الإحداثيات' : 'Could not extract coordinates'),
      };
      setLinks(prev => [...prev, newLink]);
      setOrderedStops(null);
    } catch (err: any) {
      setLinks(prev => [...prev, {
        id: crypto.randomUUID(),
        raw: trimmed,
        origin: null,
        destination: null,
        error: err.message || (lang === 'ar' ? 'تعذر استخراج الإحداثيات' : 'Could not extract coordinates'),
      }]);
    }
    setParsing(false);
  };

  const addBulkLinks = async () => {
    const urls = bulkInput.split('\n').map(s => s.trim()).filter(Boolean);
    setBulkInput('');
    for (const url of urls) {
      await addLink(url);
    }
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
    setOrderedStops(null);
  };

  const generateRoute = () => {
    const stops = generateOptimizedStops(links);
    if (stops.length > 0) {
      setOrderedStops(stops);
      toast.success(lang === 'ar' ? 'تم إنشاء المسار — عدّل الترتيب يدوياً إذا أردت' : 'Route generated — reorder stops manually if needed');
    } else {
      toast.error(lang === 'ar' ? 'لا توجد روابط صالحة لدمجها' : 'No valid links to combine');
    }
  };

  const validCount = links.filter(l => l.origin && l.destination).length;

  // If we're in map preview mode
  if (orderedStops) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOrderedStops(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Route className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground text-lg">
            {lang === 'ar' ? 'تعديل المسار المجمع' : 'Edit Combined Route'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'ar'
            ? 'حرّك المحطات لأعلى أو لأسفل لتحسين المسار — الخريطة والرابط يتحدثان تلقائياً'
            : 'Move stops up or down to optimize the route — map and link update automatically'}
        </p>
        <RouteMapPreview stops={orderedStops} onReorder={setOrderedStops} lang={lang} />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Route className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground text-lg">
          {lang === 'ar' ? 'دمج روابط Google Maps' : 'Combine Google Maps Links'}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {lang === 'ar'
          ? 'الصق روابط رحلات Google Maps (بما فيها الروابط القصيرة) لأشخاص مختلفين وسيتم إنشاء رابط واحد يجمعهم'
          : 'Paste Google Maps links (including short links) for different people and generate one optimized combined route'}
      </p>

      {/* Single link input */}
      <div className="flex gap-2">
        <Input
          className="flex-1 text-sm"
          placeholder={lang === 'ar' ? 'الصق رابط Google Maps هنا (عادي أو قصير)...' : 'Paste a Google Maps link (full or short)...'}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          disabled={parsing}
          onKeyDown={e => {
            if (e.key === 'Enter' && inputValue.trim() && !parsing) {
              addLink(inputValue);
              setInputValue('');
            }
          }}
        />
        <Button
          size="sm"
          disabled={!inputValue.trim() || parsing}
          onClick={() => { addLink(inputValue); setInputValue(''); }}
        >
          {parsing ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Plus className="w-4 h-4 me-1" />}
          {lang === 'ar' ? 'إضافة' : 'Add'}
        </Button>
      </div>

      {/* Bulk paste */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          {lang === 'ar' ? 'إضافة عدة روابط دفعة واحدة' : 'Bulk paste multiple links'}
        </summary>
        <div className="mt-2 space-y-2">
          <Textarea
            className="text-xs"
            rows={4}
            placeholder={lang === 'ar' ? 'رابط واحد في كل سطر...' : 'One link per line...'}
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={addBulkLinks} disabled={!bulkInput.trim() || parsing}>
            {parsing ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Plus className="w-4 h-4 me-1" />}
            {lang === 'ar' ? 'إضافة الكل' : 'Add All'}
          </Button>
        </div>
      </details>

      {/* Parsing indicator */}
      {parsing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          {lang === 'ar' ? 'جارِ تحليل الرابط...' : 'Parsing link...'}
        </div>
      )}

      {/* Links list */}
      {links.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {lang === 'ar' ? `الروابط (${validCount} صالحة من ${links.length})` : `Links (${validCount} valid of ${links.length})`}
          </Label>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {links.map((link, idx) => (
              <div
                key={link.id}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                  link.error ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'
                }`}
              >
                <span className="font-mono text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                {link.origin && link.destination ? (
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{link.origin.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-destructive shrink-0" />
                      <span className="truncate">{link.destination.name}</span>
                    </div>
                  </div>
                ) : (
                  <span className="flex-1 text-destructive truncate">{link.error}</span>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeLink(link.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      {links.length >= 2 && validCount >= 2 && (
        <Button onClick={generateRoute} className="w-full gap-2">
          <Link2 className="w-4 h-4" />
          {lang === 'ar' ? `دمج ${validCount} رحلة وعرض الخريطة` : `Combine ${validCount} trips & show map`}
        </Button>
      )}

      {links.length === 1 && (
        <p className="text-xs text-muted-foreground text-center">
          {lang === 'ar' ? 'أضف رابطاً آخر على الأقل لدمج الرحلات' : 'Add at least one more link to combine trips'}
        </p>
      )}

      {/* Clear all */}
      {links.length > 0 && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setLinks([]); setOrderedStops(null); }}>
          <Trash2 className="w-3 h-3 me-1" />
          {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
        </Button>
      )}
    </div>
  );
};

export default LinkCombiner;

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, Trash2, Save, MapPin, Users, Navigation, X } from 'lucide-react';
import type { RouteStop, RouteRequestUser } from './types';

interface RouteBuilderProps {
  stops: RouteStop[];
  startPoint: { lat: number; lng: number; name: string } | null;
  endPoint: { lat: number; lng: number; name: string } | null;
  onRemoveStop: (id: string) => void;
  onReorderStops: (stops: RouteStop[]) => void;
  onClearRoute: () => void;
  onSaveRoute: () => void;
  routeInfo: { distance: string; duration: string } | null;
  users: RouteRequestUser[];
  saving: boolean;
  routeNameEn: string;
  routeNameAr: string;
  onRouteNameEnChange: (v: string) => void;
  onRouteNameArChange: (v: string) => void;
  price: string;
  onPriceChange: (v: string) => void;
}

const RouteBuilder = ({
  stops, startPoint, endPoint,
  onRemoveStop, onReorderStops, onClearRoute, onSaveRoute,
  routeInfo, users, saving,
  routeNameEn, routeNameAr, onRouteNameEnChange, onRouteNameArChange,
  price, onPriceChange,
}: RouteBuilderProps) => {
  const moveStop = (index: number, direction: -1 | 1) => {
    const newStops = [...stops];
    const [removed] = newStops.splice(index, 1);
    newStops.splice(index + direction, 0, removed);
    onReorderStops(newStops.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10 w-80 bg-card/95 backdrop-blur border-l border-border flex flex-col mt-[52px]">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">Route Builder</h3>
          <Button variant="ghost" size="sm" onClick={onClearRoute} className="h-7 text-xs gap-1">
            <X className="w-3 h-3" /> Clear
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Click map to set start → stops → end point</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Start point */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">S</div>
            <span className={startPoint ? 'text-foreground' : 'text-muted-foreground'}>
              {startPoint?.name || 'Click map to set start'}
            </span>
          </div>

          {/* Stops */}
          {stops.map((stop, i) => (
            <div key={stop.id} className="flex items-start gap-1 text-xs bg-background rounded-lg p-2 border border-border">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{stop.name}</p>
                {stop.assignedUsers.length > 0 && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Users className="w-3 h-3" /> {stop.assignedUsers.length} assigned
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {i > 0 && (
                  <button onClick={() => moveStop(i, -1)} className="text-muted-foreground hover:text-foreground text-[10px]">▲</button>
                )}
                {i < stops.length - 1 && (
                  <button onClick={() => moveStop(i, 1)} className="text-muted-foreground hover:text-foreground text-[10px]">▼</button>
                )}
              </div>
              <button onClick={() => onRemoveStop(stop.id)} className="text-muted-foreground hover:text-destructive mt-0.5">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* End point */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-white text-[10px] font-bold shrink-0">E</div>
            <span className={endPoint ? 'text-foreground' : 'text-muted-foreground'}>
              {endPoint?.name || (startPoint ? 'Click map to add stops/end' : 'Set start first')}
            </span>
          </div>

          {/* Route info */}
          {routeInfo && (
            <div className="bg-primary/10 rounded-lg p-2 text-xs space-y-1">
              <p className="text-foreground"><Navigation className="w-3 h-3 inline mr-1" />{routeInfo.distance}</p>
              <p className="text-foreground">🕐 {routeInfo.duration}</p>
            </div>
          )}

          {/* Save form */}
          {startPoint && endPoint && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Input className="h-7 text-xs" placeholder="Route name (EN)" value={routeNameEn} onChange={e => onRouteNameEnChange(e.target.value)} />
              <Input className="h-7 text-xs" placeholder="اسم المسار (AR)" value={routeNameAr} onChange={e => onRouteNameArChange(e.target.value)} dir="rtl" />
              <Input className="h-7 text-xs" placeholder="Price (EGP)" type="number" value={price} onChange={e => onPriceChange(e.target.value)} />
              <Button className="w-full h-8 text-xs gap-1" onClick={onSaveRoute} disabled={saving || !routeNameEn}>
                <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save Route'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RouteBuilder;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Phone, Clock, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import type { RouteRequestUser, RouteStop } from './types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface UserSidebarProps {
  users: RouteRequestUser[];
  hiddenUserIds: Set<string>;
  onToggleHide: (userId: string) => void;
  onHideAll: (userIds: string[]) => void;
  onUnhideAll: () => void;
  onSelectUser: (user: RouteRequestUser) => void;
  selectedUserId: string | null;
  routeMode: boolean;
  routeStops: RouteStop[];
  onAssignUser: (userId: string, stopId: string) => void;
}

const UserSidebar = ({
  users, hiddenUserIds, onToggleHide, onHideAll, onUnhideAll,
  onSelectUser, selectedUserId, routeMode, routeStops, onAssignUser,
}: UserSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const visibleUsers = users.filter(u => !hiddenUserIds.has(u.id));
  const hiddenUsers = users.filter(u => hiddenUserIds.has(u.id));
  const filtered = (showHidden ? hiddenUsers : visibleUsers).filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.originName.toLowerCase().includes(search.toLowerCase()) || u.destinationName.toLowerCase().includes(search.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="absolute left-0 top-16 z-10">
        <Button variant="secondary" size="icon" onClick={() => setCollapsed(false)} className="rounded-l-none">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-0 bottom-0 z-10 w-80 bg-card/95 backdrop-blur border-r border-border flex flex-col mt-[52px]">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              variant={!showHidden ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowHidden(false)}
              className="text-xs h-7 gap-1"
            >
              <Eye className="w-3 h-3" /> {visibleUsers.length}
            </Button>
            <Button
              variant={showHidden ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowHidden(true)}
              className="text-xs h-7 gap-1"
            >
              <EyeOff className="w-3 h-3" /> {hiddenUsers.length}
            </Button>
          </div>
          <div className="flex gap-1">
            {showHidden && hiddenUsers.length > 0 && (
              <Button variant="outline" size="sm" onClick={onUnhideAll} className="text-xs h-7">
                Unhide All
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(true)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-7 text-xs pl-7" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* User list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map(user => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`p-2 rounded-lg cursor-pointer border transition-colors text-xs space-y-1 ${
                selectedUserId === user.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground truncate">{user.name}</span>
                <div className="flex gap-1">
                  {routeMode && routeStops.length > 0 && (
                    <select
                      onClick={e => e.stopPropagation()}
                      onChange={e => { if (e.target.value) onAssignUser(user.id, e.target.value); e.target.value = ''; }}
                      className="h-5 text-[10px] bg-background border rounded px-1"
                      defaultValue=""
                    >
                      <option value="" disabled>Assign</option>
                      {routeStops.map(s => (
                        <option key={s.id} value={s.id}>Stop {s.order + 1}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onToggleHide(user.id); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {hiddenUserIds.has(user.id) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {user.phone && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {user.phone}
                </p>
              )}
              <div className="flex items-start gap-1">
                <MapPin className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground truncate">{user.originName}</span>
              </div>
              <div className="flex items-start gap-1">
                <MapPin className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                <span className="text-muted-foreground truncate">{user.destinationName}</span>
              </div>
              {user.preferredTime && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {user.preferredTime}
                </p>
              )}
              {user.preferredDays.length > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  {user.preferredDays.map(d => (
                    <span key={d} className="bg-primary/10 text-primary px-1 rounded text-[10px]">{DAY_LABELS[d]}</span>
                  ))}
                </div>
              )}
              <span className="text-[10px] text-muted-foreground">{user.requestIds.length} request{user.requestIds.length > 1 ? 's' : ''}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No users found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserSidebar;

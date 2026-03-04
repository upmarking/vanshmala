import { Bell, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useFamilyTree';
import { Button } from '@/components/ui/button';
import {
    Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const formatRelativeTime = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const { data: notifications = [] } = useNotifications(user?.id);
    const { mutate: markRead } = useMarkNotificationRead();
    const { mutate: markAllRead } = useMarkAllNotificationsRead();

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleClick = (notif: typeof notifications[0]) => {
        if (!notif.is_read && user) {
            markRead({ id: notif.id, userId: user.id });
        }
        if (notif.link) {
            navigate(notif.link);
            setOpen(false);
        }
    };

    const handleMarkAll = () => {
        if (user) markAllRead({ userId: user.id });
    };

    if (!user) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="relative p-2 rounded-full hover:bg-muted transition-colors"
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-0.5 leading-none animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-0 shadow-xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            onClick={handleMarkAll}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground gap-1"
                        >
                            <CheckCheck className="w-3 h-3" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* List */}
                <ScrollArea className="max-h-[360px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-2 text-muted-foreground">
                            <Bell className="w-8 h-8 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleClick(notif)}
                                    className={cn(
                                        'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors',
                                        !notif.is_read && 'bg-saffron/5'
                                    )}
                                >
                                    {/* Unread dot */}
                                    <div className="mt-1 flex-shrink-0">
                                        <span className={cn(
                                            'inline-block w-2 h-2 rounded-full',
                                            notif.is_read ? 'bg-transparent' : 'bg-saffron'
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn('text-sm leading-snug', !notif.is_read && 'font-semibold text-foreground')}>
                                            {notif.title}
                                        </p>
                                        {notif.body && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(notif.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

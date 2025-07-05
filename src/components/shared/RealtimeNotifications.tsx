'use client';

import React, { useEffect, useRef } from 'react';
import { useRealtimeData } from '@/context/RealtimeDataContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, Wifi, WifiOff } from 'lucide-react';

interface RealtimeNotificationsProps {
  lang?: 'ar' | 'en';
  enableSoundNotifications?: boolean;
  enableVisualNotifications?: boolean;
}

export function RealtimeNotifications({ 
  lang = 'ar', 
  enableSoundNotifications = false,
  enableVisualNotifications = true 
}: RealtimeNotificationsProps) {
  const { connectionStatus, lastUpdated } = useRealtimeData();
  const { toast } = useToast();
  const previousConnectionStatus = useRef(connectionStatus);
  const previousLastUpdated = useRef(lastUpdated);

  const t = {
    connected: lang === 'ar' ? 'تم الاتصال بالخادم' : 'Connected to server',
    disconnected: lang === 'ar' ? 'انقطع الاتصال بالخادم' : 'Disconnected from server',
    reconnected: lang === 'ar' ? 'تم إعادة الاتصال' : 'Reconnected',
    dataUpdated: lang === 'ar' ? 'تم تحديث البيانات' : 'Data updated',
    productsUpdated: lang === 'ar' ? 'تم تحديث المنتجات' : 'Products updated',
    ordersUpdated: lang === 'ar' ? 'تم تحديث الطلبات' : 'Orders updated',
    customersUpdated: lang === 'ar' ? 'تم تحديث العملاء' : 'Customers updated',
    financialsUpdated: lang === 'ar' ? 'تم تحديث المعاملات المالية' : 'Financial transactions updated',
    usersUpdated: lang === 'ar' ? 'تم تحديث المستخدمين' : 'Users updated',
    branchesUpdated: lang === 'ar' ? 'تم تحديث الفروع' : 'Branches updated',
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (enableSoundNotifications && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/notification.mp3'); // You'll need to add this file to public folder
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Fallback to system beep or ignore if audio fails
          console.log('Could not play notification sound');
        });
      } catch (error) {
        console.log('Audio not supported');
      }
    }
  };

  // Monitor connection status changes
  useEffect(() => {
    if (previousConnectionStatus.current !== connectionStatus) {
      if (connectionStatus === 'connected' && previousConnectionStatus.current === 'disconnected') {
        if (enableVisualNotifications) {
          toast({
            title: t.reconnected,
            description: t.connected,
            duration: 3000,
          });
        }
        playNotificationSound();
      } else if (connectionStatus === 'disconnected') {
        if (enableVisualNotifications) {
          toast({
            title: t.disconnected,
            description: lang === 'ar' ? 'يرجى التحقق من اتصال الإنترنت' : 'Please check your internet connection',
            variant: 'destructive',
            duration: 5000,
          });
        }
      }
      previousConnectionStatus.current = connectionStatus;
    }
  }, [connectionStatus, enableVisualNotifications, toast, t, lang]);

  // Monitor data updates
  useEffect(() => {
    const prev = previousLastUpdated.current;
    const current = lastUpdated;

    // Check for updates in each collection
    Object.entries(current).forEach(([collection, updateTime]) => {
      if (updateTime && (!prev[collection as keyof typeof prev] || 
          updateTime.getTime() !== prev[collection as keyof typeof prev]?.getTime())) {
        
        // Only show notification if this is not the initial load
        if (prev[collection as keyof typeof prev]) {
          const collectionName = collection as keyof typeof t;
          const message = t[`${collectionName}Updated` as keyof typeof t] || t.dataUpdated;
          
          if (enableVisualNotifications) {
            toast({
              title: t.dataUpdated,
              description: message,
              duration: 2000,
            });
          }
          playNotificationSound();
        }
      }
    });

    previousLastUpdated.current = current;
  }, [lastUpdated, enableVisualNotifications, toast, t]);

  return null; // This component doesn't render anything visible
}

// Connection status indicator component
export function ConnectionStatusIndicator({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  const { connectionStatus } = useRealtimeData();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return lang === 'ar' ? 'متصل' : 'Connected';
      case 'disconnected': return lang === 'ar' ? 'غير متصل' : 'Disconnected';
      case 'connecting': return lang === 'ar' ? 'جاري الاتصال' : 'Connecting';
      default: return lang === 'ar' ? 'غير معروف' : 'Unknown';
    }
  };

  const getIcon = () => {
    return connectionStatus === 'connected' ? 
      <Wifi className="h-3 w-3" /> : 
      <WifiOff className="h-3 w-3" />;
  };

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      {getIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </Badge>
  );
}

// Notification bell with count
export function NotificationBell({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  const { connectionStatus, lastUpdated } = useRealtimeData();
  const [hasNewUpdates, setHasNewUpdates] = React.useState(false);
  const [updateCount, setUpdateCount] = React.useState(0);
  const lastSeenRef = useRef<Date>(new Date());

  // Check for new updates since last seen
  useEffect(() => {
    const latestUpdate = Object.values(lastUpdated)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0];

    if (latestUpdate && latestUpdate > lastSeenRef.current) {
      setHasNewUpdates(true);
      setUpdateCount(prev => prev + 1);
    }
  }, [lastUpdated]);

  const handleClick = () => {
    setHasNewUpdates(false);
    setUpdateCount(0);
    lastSeenRef.current = new Date();
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-full hover:bg-muted transition-colors"
      title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
    >
      {hasNewUpdates ? (
        <BellRing className="h-5 w-5 text-primary" />
      ) : (
        <Bell className="h-5 w-5 text-muted-foreground" />
      )}
      
      {updateCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {updateCount > 9 ? '9+' : updateCount}
        </Badge>
      )}
    </button>
  );
}

// Hook for managing notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] = React.useState({
    enableSoundNotifications: false,
    enableVisualNotifications: true,
    enableConnectionNotifications: true,
    enableDataUpdateNotifications: true,
  });

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('realtimeNotificationPreferences');
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to parse notification preferences:', error);
        }
      }
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = (newPreferences: Partial<typeof preferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('realtimeNotificationPreferences', JSON.stringify(updated));
    }
  };

  return {
    preferences,
    updatePreferences,
  };
}

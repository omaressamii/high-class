'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { useRealtimeData } from '@/context/RealtimeDataContext';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

interface RealtimeStatusProps {
  lang?: 'ar' | 'en';
  showLastUpdated?: boolean;
  compact?: boolean;
}

export function RealtimeStatus({ lang = 'ar', showLastUpdated = true, compact = false }: RealtimeStatusProps) {
  const { connectionStatus, isLoading, refreshData, lastUpdated } = useRealtimeData();

  const t = {
    connected: lang === 'ar' ? 'متصل' : 'Connected',
    disconnected: lang === 'ar' ? 'غير متصل' : 'Disconnected',
    connecting: lang === 'ar' ? 'جاري الاتصال' : 'Connecting',
    refresh: lang === 'ar' ? 'تحديث' : 'Refresh',
    lastUpdated: lang === 'ar' ? 'آخر تحديث' : 'Last updated',
    realTimeUpdates: lang === 'ar' ? 'التحديثات المباشرة' : 'Real-time updates',
    clickToRefresh: lang === 'ar' ? 'انقر للتحديث' : 'Click to refresh',
  };

  const getStatusIcon = () => {
    if (isLoading || connectionStatus === 'connecting') {
      return <RefreshCw className="h-3 w-3 animate-spin" />;
    }
    return connectionStatus === 'connected' ? 
      <Wifi className="h-3 w-3" /> : 
      <WifiOff className="h-3 w-3" />;
  };

  const getStatusVariant = () => {
    if (isLoading || connectionStatus === 'connecting') return 'secondary';
    return connectionStatus === 'connected' ? 'default' : 'destructive';
  };

  const getStatusText = () => {
    if (isLoading || connectionStatus === 'connecting') return t.connecting;
    return connectionStatus === 'connected' ? t.connected : t.disconnected;
  };

  const getLatestUpdate = () => {
    const updates = Object.values(lastUpdated).filter(Boolean) as Date[];
    if (updates.length === 0) return null;
    return new Date(Math.max(...updates.map(d => d.getTime())));
  };

  const latestUpdate = getLatestUpdate();

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshData()}
              className="h-8 w-8 p-0"
              disabled={isLoading}
            >
              {getStatusIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">{t.realTimeUpdates}</p>
              <p className="text-sm text-muted-foreground">{getStatusText()}</p>
              {latestUpdate && showLastUpdated && (
                <p className="text-xs text-muted-foreground">
                  {t.lastUpdated}: {format(latestUpdate, 'HH:mm:ss', { 
                    locale: lang === 'ar' ? arSA : enUS 
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t.clickToRefresh}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
      
      {showLastUpdated && latestUpdate && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {t.lastUpdated}: {format(latestUpdate, 'HH:mm:ss', { 
              locale: lang === 'ar' ? arSA : enUS 
            })}
          </span>
        </div>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshData()}
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.refresh}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Connection status indicator for the header
export function HeaderRealtimeStatus({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  return (
    <div className="flex items-center">
      <RealtimeStatus lang={lang} compact showLastUpdated={false} />
    </div>
  );
}

// Detailed status for pages that need more information
export function DetailedRealtimeStatus({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  const { lastUpdated, connectionStatus } = useRealtimeData();
  
  const t = {
    dataStatus: lang === 'ar' ? 'حالة البيانات' : 'Data Status',
    products: lang === 'ar' ? 'المنتجات' : 'Products',
    orders: lang === 'ar' ? 'الطلبات' : 'Orders',
    customers: lang === 'ar' ? 'العملاء' : 'Customers',
    financials: lang === 'ar' ? 'المالية' : 'Financials',
    users: lang === 'ar' ? 'المستخدمون' : 'Users',
    branches: lang === 'ar' ? 'الفروع' : 'Branches',
    lastUpdated: lang === 'ar' ? 'آخر تحديث' : 'Last updated',
    never: lang === 'ar' ? 'لم يتم التحديث' : 'Never',
  };

  const collections = [
    { key: 'products', label: t.products },
    { key: 'orders', label: t.orders },
    { key: 'customers', label: t.customers },
    { key: 'financialTransactions', label: t.financials },
    { key: 'users', label: t.users },
    { key: 'branches', label: t.branches },
  ] as const;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t.dataStatus}</h4>
        <RealtimeStatus lang={lang} compact={false} showLastUpdated={false} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        {collections.map(({ key, label }) => {
          const updateTime = lastUpdated[key];
          return (
            <div key={key} className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span>{label}:</span>
              <span className="text-muted-foreground">
                {updateTime ? 
                  format(updateTime, 'HH:mm:ss', { locale: lang === 'ar' ? arSA : enUS }) : 
                  t.never
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

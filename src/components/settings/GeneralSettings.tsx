'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings2, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

interface GeneralSettingsData {
  companyName: string;
  companyNameAr: string;
  autoBackup: boolean;
  backupInterval: number; // in hours
  maxOrdersPerPage: number;
  maxProductsPerPage: number;
  enableNotifications: boolean;
  defaultCurrency: string;
}

interface GeneralSettingsProps {
  lang: 'ar' | 'en';
}

export function GeneralSettings({ lang }: GeneralSettingsProps) {
  const [settings, setSettings] = useState<GeneralSettingsData>({
    companyName: 'High Class',
    companyNameAr: 'هاي كلاس',
    autoBackup: true,
    backupInterval: 24,
    maxOrdersPerPage: 20,
    maxProductsPerPage: 20,
    enableNotifications: true,
    defaultCurrency: 'EGP'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const t = {
    generalSettingsTitle: lang === 'ar' ? 'الإعدادات العامة' : 'General Settings',
    generalSettingsDescription: lang === 'ar' ? 'إدارة الإعدادات العامة للتطبيق' : 'Manage general application settings',
    companyNameLabel: lang === 'ar' ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)',
    companyNameArLabel: lang === 'ar' ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)',
    autoBackupLabel: lang === 'ar' ? 'النسخ الاحتياطي التلقائي' : 'Auto Backup',
    backupIntervalLabel: lang === 'ar' ? 'فترة النسخ الاحتياطي (ساعات)' : 'Backup Interval (hours)',
    maxOrdersPerPageLabel: lang === 'ar' ? 'عدد الطلبات لكل صفحة' : 'Orders per Page',
    maxProductsPerPageLabel: lang === 'ar' ? 'عدد المنتجات لكل صفحة' : 'Products per Page',
    enableNotificationsLabel: lang === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications',
    defaultCurrencyLabel: lang === 'ar' ? 'العملة الافتراضية' : 'Default Currency',
    saveSettings: lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings',
    resetToDefault: lang === 'ar' ? 'إعادة تعيين افتراضي' : 'Reset to Default',
    saving: lang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    settingsSaved: lang === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully',
    settingsReset: lang === 'ar' ? 'تم إعادة تعيين الإعدادات للقيم الافتراضية' : 'Settings reset to default values',
    errorSaving: lang === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings',
    errorLoading: lang === 'ar' ? 'حدث خطأ أثناء تحميل الإعدادات' : 'Error loading settings',
    companyNameHint: lang === 'ar' ? 'اسم الشركة كما سيظهر في التقارير والفواتير' : 'Company name as it will appear in reports and invoices',
    backupIntervalHint: lang === 'ar' ? 'كم ساعة بين كل نسخة احتياطية (1-168)' : 'Hours between each backup (1-168)',
    maxItemsHint: lang === 'ar' ? 'عدد العناصر المعروضة في كل صفحة (10-100)' : 'Number of items displayed per page (10-100)',
    currencyHint: lang === 'ar' ? 'العملة المستخدمة في التطبيق' : 'Currency used in the application'
  };

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = ref(database, 'system_settings/generalSettings');
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setSettings({
            companyName: data.companyName || 'High Class',
            companyNameAr: data.companyNameAr || 'هاي كلاس',
            autoBackup: data.autoBackup !== undefined ? data.autoBackup : true,
            backupInterval: data.backupInterval || 24,
            maxOrdersPerPage: data.maxOrdersPerPage || 20,
            maxProductsPerPage: data.maxProductsPerPage || 20,
            enableNotifications: data.enableNotifications !== undefined ? data.enableNotifications : true,
            defaultCurrency: data.defaultCurrency || 'EGP'
          });
        }
      } catch (error) {
        console.error('Error loading general settings:', error);
        toast({
          title: t.errorLoading,
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsRef = ref(database, 'system_settings/generalSettings');
      await set(settingsRef, settings);
      
      toast({
        title: t.settingsSaved,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error saving general settings:', error);
      toast({
        title: t.errorSaving,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setSettings({
      companyName: 'High Class',
      companyNameAr: 'هاي كلاس',
      autoBackup: true,
      backupInterval: 24,
      maxOrdersPerPage: 20,
      maxProductsPerPage: 20,
      enableNotifications: true,
      defaultCurrency: 'EGP'
    });
    
    toast({
      title: t.settingsReset,
      variant: 'default'
    });
  };

  const handleInputChange = (field: keyof GeneralSettingsData, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Settings2 className="h-6 w-6 text-primary" />
            <CardTitle>{t.generalSettingsTitle}</CardTitle>
          </div>
          <CardDescription>{t.generalSettingsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">{lang === 'ar' ? 'جار التحميل...' : 'Loading...'}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Settings2 className="h-6 w-6 text-primary" />
          <CardTitle>{t.generalSettingsTitle}</CardTitle>
        </div>
        <CardDescription>{t.generalSettingsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name English */}
          <div className="space-y-2">
            <Label htmlFor="companyName">{t.companyNameLabel}</Label>
            <Input
              id="companyName"
              type="text"
              value={settings.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">{t.companyNameHint}</p>
          </div>

          {/* Company Name Arabic */}
          <div className="space-y-2">
            <Label htmlFor="companyNameAr">{t.companyNameArLabel}</Label>
            <Input
              id="companyNameAr"
              type="text"
              value={settings.companyNameAr}
              onChange={(e) => handleInputChange('companyNameAr', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">{t.companyNameHint}</p>
          </div>

          {/* Backup Interval */}
          <div className="space-y-2">
            <Label htmlFor="backupInterval">{t.backupIntervalLabel}</Label>
            <Input
              id="backupInterval"
              type="number"
              min="1"
              max="168"
              value={settings.backupInterval}
              onChange={(e) => handleInputChange('backupInterval', parseInt(e.target.value) || 24)}
            />
            <p className="text-sm text-muted-foreground">{t.backupIntervalHint}</p>
          </div>

          {/* Default Currency */}
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">{t.defaultCurrencyLabel}</Label>
            <Input
              id="defaultCurrency"
              type="text"
              value={settings.defaultCurrency}
              onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">{t.currencyHint}</p>
          </div>

          {/* Max Orders Per Page */}
          <div className="space-y-2">
            <Label htmlFor="maxOrdersPerPage">{t.maxOrdersPerPageLabel}</Label>
            <Input
              id="maxOrdersPerPage"
              type="number"
              min="10"
              max="100"
              value={settings.maxOrdersPerPage}
              onChange={(e) => handleInputChange('maxOrdersPerPage', parseInt(e.target.value) || 20)}
            />
            <p className="text-sm text-muted-foreground">{t.maxItemsHint}</p>
          </div>

          {/* Max Products Per Page */}
          <div className="space-y-2">
            <Label htmlFor="maxProductsPerPage">{t.maxProductsPerPageLabel}</Label>
            <Input
              id="maxProductsPerPage"
              type="number"
              min="10"
              max="100"
              value={settings.maxProductsPerPage}
              onChange={(e) => handleInputChange('maxProductsPerPage', parseInt(e.target.value) || 20)}
            />
            <p className="text-sm text-muted-foreground">{t.maxItemsHint}</p>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4">
          <Separator />
          
          {/* Auto Backup */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoBackup">{t.autoBackupLabel}</Label>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'تفعيل النسخ الاحتياطي التلقائي للبيانات' : 'Enable automatic data backup'}
              </p>
            </div>
            <Switch
              id="autoBackup"
              checked={settings.autoBackup}
              onCheckedChange={(checked) => handleInputChange('autoBackup', checked)}
            />
          </div>

          {/* Enable Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableNotifications">{t.enableNotificationsLabel}</Label>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'تفعيل الإشعارات في التطبيق' : 'Enable in-app notifications'}
              </p>
            </div>
            <Switch
              id="enableNotifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => handleInputChange('enableNotifications', checked)}
            />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            className="w-full sm:w-auto"
          >
            <RotateCcw className={`h-4 w-4 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t.resetToDefault}
          </Button>
          
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${lang === 'ar' ? 'ml-2' : 'mr-2'}`}></div>
                {t.saving}
              </>
            ) : (
              <>
                <Save className={`h-4 w-4 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t.saveSettings}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

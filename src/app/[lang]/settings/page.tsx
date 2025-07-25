'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageTitle } from '@/components/shared/PageTitle';
import { Settings, Barcode, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import { BarcodePreview } from '@/components/settings/BarcodePreview';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface BarcodeSettings {
  width: number;
  height: number;
  fontSize: number;
  margin: number;
  spacing: number;
  containerWidth: string;
  containerHeight: string;
  // Element visibility settings
  showCompanyName: boolean;
  showProductName: boolean;
  showBarcode: boolean;
  showProductCode: boolean;
  showPrice: boolean;
}

interface SettingsPageProps {
  params: Promise<{ lang: string }>;
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const [lang, setLang] = useState<string>('ar');
  const [barcodeSettings, setBarcodeSettings] = useState<BarcodeSettings>({
    width: 3.5,
    height: 70,
    fontSize: 12,
    margin: 5,
    spacing: 2,
    containerWidth: '4cm',
    containerHeight: '2.5cm',
    // Element visibility defaults (all enabled by default)
    showCompanyName: true,
    showProductName: true,
    showBarcode: true,
    showProductCode: true,
    showPrice: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { currentUser, hasPermission, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLang(resolvedParams.lang === 'en' ? 'en' : 'ar');
    };
    resolveParams();
  }, [params]);

  // Check permissions
  useEffect(() => {
    if (!authLoading && !hasPermission('users_manage')) {
      toast({
        title: lang === 'ar' ? 'وصول مرفوض' : 'Access Denied',
        description: lang === 'ar' ? 'ليس لديك الصلاحية للوصول لصفحة الإعدادات.' : 'You do not have permission to access the settings page.',
        variant: 'destructive',
      });
      router.push(`/${lang}`);
    }
  }, [authLoading, hasPermission, lang, router, toast]);

  const effectiveLang = lang;

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'إعدادات التطبيق' : 'Application Settings',
    pageDescription: effectiveLang === 'ar' ? 'إدارة إعدادات التطبيق العامة' : 'Manage general application settings',
    barcodeSettingsTitle: effectiveLang === 'ar' ? 'إعدادات الباركود' : 'Barcode Settings',
    barcodeSettingsDescription: effectiveLang === 'ar' ? 'تخصيص مقاس وشكل الباركود المطبوع' : 'Customize the size and appearance of printed barcodes',
    widthLabel: effectiveLang === 'ar' ? 'عرض الباركود' : 'Barcode Width',
    heightLabel: effectiveLang === 'ar' ? 'ارتفاع الباركود' : 'Barcode Height',
    fontSizeLabel: effectiveLang === 'ar' ? 'حجم الخط' : 'Font Size',
    marginLabel: effectiveLang === 'ar' ? 'الهامش' : 'Margin',
    spacingLabel: effectiveLang === 'ar' ? 'المسافات بين العناصر' : 'Element Spacing',
    containerWidthLabel: effectiveLang === 'ar' ? 'عرض الحاوية' : 'Container Width',
    containerHeightLabel: effectiveLang === 'ar' ? 'ارتفاع الحاوية' : 'Container Height',
    saveSettings: effectiveLang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings',
    resetToDefault: effectiveLang === 'ar' ? 'إعادة تعيين افتراضي' : 'Reset to Default',
    saving: effectiveLang === 'ar' ? 'جار الحفظ...' : 'Saving...',
    settingsSaved: effectiveLang === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully',
    settingsReset: effectiveLang === 'ar' ? 'تم إعادة تعيين الإعدادات للقيم الافتراضية' : 'Settings reset to default values',
    errorSaving: effectiveLang === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings',
    errorLoading: effectiveLang === 'ar' ? 'حدث خطأ أثناء تحميل الإعدادات' : 'Error loading settings',
    widthHint: effectiveLang === 'ar' ? 'عرض خطوط الباركود (1-5)' : 'Width of barcode lines (1-5)',
    heightHint: effectiveLang === 'ar' ? 'ارتفاع الباركود بالبكسل (40-100)' : 'Height of barcode in pixels (40-100)',
    fontSizeHint: effectiveLang === 'ar' ? 'حجم خط النص (8-16)' : 'Text font size (8-16)',
    marginHint: effectiveLang === 'ar' ? 'الهامش حول الباركود (0-10)' : 'Margin around barcode (0-10)',
    spacingHint: effectiveLang === 'ar' ? 'المسافات بين عناصر الباركود (0-10)' : 'Spacing between barcode elements (0-10)',
    containerWidthHint: effectiveLang === 'ar' ? 'عرض حاوية الطباعة (مثل: 4cm, 50mm)' : 'Print container width (e.g., 4cm, 50mm)',
    containerHeightHint: effectiveLang === 'ar' ? 'ارتفاع حاوية الطباعة (مثل: 2.5cm, 30mm)' : 'Print container height (e.g., 2.5cm, 30mm)',
    // Element visibility translations
    elementVisibilityTitle: effectiveLang === 'ar' ? 'عناصر الباركود المرئية' : 'Visible Barcode Elements',
    elementVisibilityDescription: effectiveLang === 'ar' ? 'اختر العناصر التي تريد إظهارها في الباركود المطبوع' : 'Choose which elements to show in the printed barcode',
    showCompanyNameLabel: effectiveLang === 'ar' ? 'إظهار اسم الشركة' : 'Show Company Name',
    showProductNameLabel: effectiveLang === 'ar' ? 'إظهار اسم المنتج' : 'Show Product Name',
    showBarcodeLabel: effectiveLang === 'ar' ? 'إظهار الباركود' : 'Show Barcode',
    showProductCodeLabel: effectiveLang === 'ar' ? 'إظهار كود المنتج' : 'Show Product Code',
    showPriceLabel: effectiveLang === 'ar' ? 'إظهار السعر' : 'Show Price'
  };

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = ref(database, 'system_settings/barcodeSettings');
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setBarcodeSettings({
            width: data.width || 3.5,
            height: data.height || 70,
            fontSize: data.fontSize || 12,
            margin: data.margin || 5,
            spacing: data.spacing || 2,
            containerWidth: data.containerWidth || '4cm',
            containerHeight: data.containerHeight || '2.5cm',
            showCompanyName: data.showCompanyName !== undefined ? data.showCompanyName : true,
            showProductName: data.showProductName !== undefined ? data.showProductName : true,
            showBarcode: data.showBarcode !== undefined ? data.showBarcode : true,
            showProductCode: data.showProductCode !== undefined ? data.showProductCode : true,
            showPrice: data.showPrice !== undefined ? data.showPrice : true
          });
        }
      } catch (error) {
        console.error('Error loading barcode settings:', error);
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
      const settingsRef = ref(database, 'system_settings/barcodeSettings');
      await set(settingsRef, barcodeSettings);
      
      toast({
        title: t.settingsSaved,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error saving barcode settings:', error);
      toast({
        title: t.errorSaving,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setBarcodeSettings({
      width: 3.5,
      height: 70,
      fontSize: 12,
      margin: 5,
      spacing: 2,
      containerWidth: '4cm',
      containerHeight: '2.5cm',
      showCompanyName: true,
      showProductName: true,
      showBarcode: true,
      showProductCode: true,
      showPrice: true
    });
    
    toast({
      title: t.settingsReset,
      variant: 'default'
    });
  };

  const handleInputChange = (field: keyof BarcodeSettings, value: string | number | boolean) => {
    setBarcodeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle>{t.pageTitle}</PageTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{effectiveLang === 'ar' ? 'جار التحميل...' : 'Loading...'}</div>
        </div>
      </div>
    );
  }

  if (!hasPermission('users_manage')) {
    return (
      <div className="space-y-8">
        <PageTitle>{t.pageTitle}</PageTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{effectiveLang === 'ar' ? 'ليس لديك الصلاحية للوصول لهذه الصفحة.' : 'You do not have permission to access this page.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Settings className="h-8 w-8 text-primary" />
        <PageTitle>{t.pageTitle}</PageTitle>
      </div>
      
      <p className="text-muted-foreground">{t.pageDescription}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Card */}
        <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Barcode className="h-6 w-6 text-primary" />
            <CardTitle>{t.barcodeSettingsTitle}</CardTitle>
          </div>
          <CardDescription>{t.barcodeSettingsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Barcode Width */}
            <div className="space-y-2">
              <Label htmlFor="width">{t.widthLabel}</Label>
              <Input
                id="width"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={barcodeSettings.width}
                onChange={(e) => handleInputChange('width', parseFloat(e.target.value) || 3.5)}
              />
              <p className="text-sm text-muted-foreground">{t.widthHint}</p>
            </div>

            {/* Barcode Height */}
            <div className="space-y-2">
              <Label htmlFor="height">{t.heightLabel}</Label>
              <Input
                id="height"
                type="number"
                min="40"
                max="100"
                value={barcodeSettings.height}
                onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 70)}
              />
              <p className="text-sm text-muted-foreground">{t.heightHint}</p>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="fontSize">{t.fontSizeLabel}</Label>
              <Input
                id="fontSize"
                type="number"
                min="8"
                max="16"
                value={barcodeSettings.fontSize}
                onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value) || 12)}
              />
              <p className="text-sm text-muted-foreground">{t.fontSizeHint}</p>
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <Label htmlFor="margin">{t.marginLabel}</Label>
              <Input
                id="margin"
                type="number"
                min="0"
                max="10"
                value={barcodeSettings.margin}
                onChange={(e) => handleInputChange('margin', parseInt(e.target.value) || 5)}
              />
              <p className="text-sm text-muted-foreground">{t.marginHint}</p>
            </div>

            {/* Element Spacing */}
            <div className="space-y-2">
              <Label htmlFor="spacing">{t.spacingLabel}</Label>
              <Input
                id="spacing"
                type="number"
                min="0"
                max="10"
                value={barcodeSettings.spacing}
                onChange={(e) => handleInputChange('spacing', parseInt(e.target.value) || 2)}
              />
              <p className="text-sm text-muted-foreground">{t.spacingHint}</p>
            </div>

            {/* Container Width */}
            <div className="space-y-2">
              <Label htmlFor="containerWidth">{t.containerWidthLabel}</Label>
              <Input
                id="containerWidth"
                type="text"
                value={barcodeSettings.containerWidth}
                onChange={(e) => handleInputChange('containerWidth', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">{t.containerWidthHint}</p>
            </div>

            {/* Container Height */}
            <div className="space-y-2">
              <Label htmlFor="containerHeight">{t.containerHeightLabel}</Label>
              <Input
                id="containerHeight"
                type="text"
                value={barcodeSettings.containerHeight}
                onChange={(e) => handleInputChange('containerHeight', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">{t.containerHeightHint}</p>
            </div>
          </div>

          <Separator />

          {/* Element Visibility Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{t.elementVisibilityTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.elementVisibilityDescription}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Show Company Name */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="showCompanyName"
                  checked={barcodeSettings.showCompanyName}
                  onChange={(e) => handleInputChange('showCompanyName', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="showCompanyName" className="text-sm font-medium">
                  {t.showCompanyNameLabel}
                </Label>
              </div>

              {/* Show Product Name */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="showProductName"
                  checked={barcodeSettings.showProductName}
                  onChange={(e) => handleInputChange('showProductName', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="showProductName" className="text-sm font-medium">
                  {t.showProductNameLabel}
                </Label>
              </div>

              {/* Show Barcode */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="showBarcode"
                  checked={barcodeSettings.showBarcode}
                  onChange={(e) => handleInputChange('showBarcode', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="showBarcode" className="text-sm font-medium">
                  {t.showBarcodeLabel}
                </Label>
              </div>

              {/* Show Product Code */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="showProductCode"
                  checked={barcodeSettings.showProductCode}
                  onChange={(e) => handleInputChange('showProductCode', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="showProductCode" className="text-sm font-medium">
                  {t.showProductCodeLabel}
                </Label>
              </div>

              {/* Show Price */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id="showPrice"
                  checked={barcodeSettings.showPrice}
                  onChange={(e) => handleInputChange('showPrice', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="showPrice" className="text-sm font-medium">
                  {t.showPriceLabel}
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              className="w-full sm:w-auto"
            >
              <RotateCcw className={`h-4 w-4 ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t.resetToDefault}
            </Button>
            
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'}`}></div>
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className={`h-4 w-4 ${effectiveLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t.saveSettings}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

        {/* Preview Card */}
        <BarcodePreview settings={barcodeSettings} lang={effectiveLang as 'ar' | 'en'} />
      </div>

      {/* General Settings */}
      <GeneralSettings lang={effectiveLang as 'ar' | 'en'} />
    </div>
  );
}

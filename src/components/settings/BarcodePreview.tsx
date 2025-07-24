'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface BarcodeSettings {
  width: number;
  height: number;
  fontSize: number;
  margin: number;
  spacing: number;
  containerWidth: string;
  containerHeight: string;
}

interface BarcodePreviewProps {
  settings: BarcodeSettings;
  lang: 'ar' | 'en';
}

export function BarcodePreview({ settings, lang }: BarcodePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = {
    previewTitle: lang === 'ar' ? 'معاينة الباركود' : 'Barcode Preview',
    previewDescription: lang === 'ar' ? 'معاينة مباشرة لشكل الباركود بالإعدادات الحالية' : 'Live preview of how the barcode will look with current settings',
    sampleProduct: lang === 'ar' ? 'منتج تجريبي' : 'Sample Product',
    samplePrice: lang === 'ar' ? '150 ج.م' : '150 EGP',
    companyName: lang === 'ar' ? 'هاي كلاس' : 'High Class'
  };

  useEffect(() => {
    if (canvasRef.current) {
      try {
        // Clear the canvas first
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Generate barcode with current settings
        JsBarcode(canvas, "90000123", {
          format: "CODE128",
          width: settings.width,
          height: settings.height,
          displayValue: true,
          fontSize: settings.fontSize,
          margin: settings.margin,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (error) {
        console.error('Error generating barcode preview:', error);
      }
    }
  }, [settings]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Eye className="h-6 w-6 text-primary" />
          <CardTitle>{t.previewTitle}</CardTitle>
        </div>
        <CardDescription>{t.previewDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div 
            className="border border-gray-300 bg-white p-3 flex flex-col items-center justify-center"
            style={{
              width: settings.containerWidth,
              height: settings.containerHeight,
              minWidth: '150px',
              minHeight: '100px'
            }}
          >
            {/* Company Name */}
            <div
              className="font-bold text-gray-800 uppercase tracking-wide"
              style={{
                fontSize: '10px',
                marginBottom: `${settings.spacing}px`
              }}
            >
              {t.companyName}
            </div>

            {/* Product Name */}
            <div
              className="font-bold text-gray-600 text-center"
              style={{
                fontSize: '8px',
                marginBottom: `${settings.spacing}px`
              }}
            >
              {t.sampleProduct}
            </div>

            {/* Barcode Canvas */}
            <canvas
              ref={canvasRef}
              className="max-w-full"
              style={{
                margin: `${settings.spacing}px 0`
              }}
            />

            {/* Barcode Number */}
            <div
              className="font-mono font-bold text-gray-500"
              style={{
                fontSize: '8px',
                marginTop: `${settings.spacing}px`,
                marginBottom: `${settings.spacing}px`
              }}
            >
              90000123
            </div>

            {/* Price */}
            <div
              className="font-bold text-red-600 px-1 border border-red-600 rounded"
              style={{
                fontSize: '10px',
                marginTop: `${settings.spacing}px`
              }}
            >
              {t.samplePrice}
            </div>
          </div>
        </div>
        
        {/* Settings Summary */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-2">
            {lang === 'ar' ? 'الإعدادات الحالية:' : 'Current Settings:'}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>{lang === 'ar' ? 'العرض:' : 'Width:'} {settings.width}</div>
            <div>{lang === 'ar' ? 'الارتفاع:' : 'Height:'} {settings.height}px</div>
            <div>{lang === 'ar' ? 'حجم الخط:' : 'Font Size:'} {settings.fontSize}px</div>
            <div>{lang === 'ar' ? 'الهامش:' : 'Margin:'} {settings.margin}px</div>
            <div>{lang === 'ar' ? 'عرض الحاوية:' : 'Container Width:'} {settings.containerWidth}</div>
            <div>{lang === 'ar' ? 'ارتفاع الحاوية:' : 'Container Height:'} {settings.containerHeight}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

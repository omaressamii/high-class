
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Barcode } from 'lucide-react';

interface PrintBarcodeButtonProps {
  productId?: string;
  productCode?: string;
  lang: 'ar' | 'en';
  buttonText: string;
  alertTextTemplate: string; // Changed from (code: string) => string
}

export function PrintBarcodeButton({
  productId,
  productCode,
  lang,
  buttonText,
  alertTextTemplate,
}: PrintBarcodeButtonProps) {
  const handlePrintBarcode = () => {
    console.log(`Printing barcode for product ID: ${productId}, Code: ${productCode}`);
    if (productCode) {
      // Replace placeholder in the template string with the actual product code
      const alertMessage = alertTextTemplate.replace('{CODE}', productCode);
      alert(alertMessage);
    } else {
      alert(lang === 'ar' ? 'كود المنتج غير متوفر للطباعة.' : 'Product code not available for printing.');
    }
  };

  return (
    <Button variant="outline" onClick={handlePrintBarcode}>
      <Barcode className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
      {buttonText}
    </Button>
  );
}

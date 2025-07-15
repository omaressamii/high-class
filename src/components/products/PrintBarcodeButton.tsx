
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Barcode } from 'lucide-react';
import JsBarcode from 'jsbarcode';

// Function to convert product code to EAN-13 format
function convertToEAN13(productCode: string): string {
  // Remove any non-numeric characters
  const numericCode = productCode.replace(/\D/g, '');

  // If the code is already 13 digits, return as is
  if (numericCode.length === 13) {
    return numericCode;
  }

  // If the code is 12 digits or less, pad with zeros and calculate check digit
  let code12 = numericCode.padStart(12, '0').substring(0, 12);

  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return code12 + checkDigit;
}

interface PrintBarcodeButtonProps {
  productId?: string;
  productCode?: string;
  productName?: string;
  productPrice?: number;
  lang: 'ar' | 'en';
  buttonText: string;
  alertTextTemplate: string; // Changed from (code: string) => string
}

export function PrintBarcodeButton({
  productId,
  productCode,
  productName,
  productPrice,
  lang,
  buttonText,
  alertTextTemplate,
}: PrintBarcodeButtonProps) {
  const handlePrintBarcode = () => {
    console.log(`Printing barcode for product ID: ${productId}, Code: ${productCode}`);
    if (productCode) {
      // Create a new window for printing the barcode
      const printWindow = window.open('', '_blank', 'width=400,height=350');
      if (!printWindow) return;

      const currencySymbol = lang === 'ar' ? 'ج.م' : 'EGP';
      const priceText = productPrice ? `${productPrice} ${currencySymbol}` : '';
      const companyName = lang === 'ar' ? 'هاي كلاس' : 'High Class';

      // Convert to EAN-13 format
      const ean13Code = convertToEAN13(productCode);

      const barcodeHTML = `
        <!DOCTYPE html>
        <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <title>${lang === 'ar' ? 'طباعة الباركود' : 'Print Barcode'}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
              background: white;
            }
            .barcode-container {
              border: 1px solid #000;
              padding: 10px;
              margin: 5px auto;
              width: fit-content;
              max-width: 300px;
              background: white;
            }
            .company-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #1f2937;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .product-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
              word-wrap: break-word;
              color: #374151;
            }
            .barcode-svg {
              margin: 8px 0;
            }
            .price {
              font-size: 16px;
              font-weight: bold;
              color: #dc2626;
              margin-top: 8px;
              padding: 4px 8px;
              border: 1px solid #dc2626;
              border-radius: 4px;
              display: inline-block;
            }
            .barcode-number {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin-top: 5px;
              color: #6b7280;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="company-name">${companyName}</div>
            ${productName ? `<div class="product-name">${productName}</div>` : ''}
            <svg id="barcode" class="barcode-svg"></svg>
            <div class="barcode-number">${productCode}</div>
            ${priceText ? `<div class="price">${priceText}</div>` : ''}
          </div>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; font-size: 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
              ${lang === 'ar' ? 'طباعة' : 'Print'}
            </button>
            <button onclick="window.close()" style="padding: 12px 24px; font-size: 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
              ${lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>

          <script>
            // Generate EAN-13 barcode
            JsBarcode("#barcode", "${ean13Code}", {
              format: "EAN13",
              width: 2,
              height: 60,
              displayValue: true,
              fontSize: 12,
              margin: 5,
              background: "#ffffff",
              lineColor: "#000000"
            });
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(barcodeHTML);
      printWindow.document.close();

      // Auto-focus the print window
      printWindow.focus();
    } else {
      alert(lang === 'ar' ? 'باركود المنتج غير متوفر للطباعة.' : 'Product barcode not available for printing.');
    }
  };

  return (
    <Button variant="outline" onClick={handlePrintBarcode}>
      <Barcode className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
      {buttonText}
    </Button>
  );
}

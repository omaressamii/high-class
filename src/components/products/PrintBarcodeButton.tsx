
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Barcode } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useBarcodeSettings, useGeneralSettings } from '@/hooks/use-app-settings';

// CODE 128 can handle alphanumeric characters, so no conversion needed

interface PrintBarcodeButtonProps {
  productId?: string;
  productCode?: string;
  productName?: string;
  productPrice?: number;
  lang: 'ar' | 'en';
  buttonText: string;
  alertTextTemplate: string; // Changed from (code: string) => string
  className?: string;
}

export function PrintBarcodeButton({
  productId,
  productCode,
  productName,
  productPrice,
  lang,
  buttonText,
  alertTextTemplate,
  className,
}: PrintBarcodeButtonProps) {
  const { settings: barcodeSettings } = useBarcodeSettings();
  const { settings: generalSettings } = useGeneralSettings();

  const handlePrintBarcode = () => {
    console.log(`Printing barcode for product ID: ${productId}, Code: ${productCode}`);
    if (productCode) {
      // Create a new window for printing the barcode
      const printWindow = window.open('', '_blank', 'width=400,height=350');
      if (!printWindow) return;

      const currencySymbol = lang === 'ar' ? 'ج.م' : 'EGP';
      const priceText = productPrice ? `${productPrice} ${currencySymbol}` : '';
      const companyName = lang === 'ar' ? generalSettings.companyNameAr : generalSettings.companyName;

      // Use original product code for CODE 128 (no conversion needed)
      const barcodeValue = productCode;

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
              width: ${barcodeSettings.containerWidth};
              height: ${barcodeSettings.containerHeight};
              background: white;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .company-name {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: ${barcodeSettings.spacing}px;
              color: #1f2937;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .product-name {
              font-size: 8px;
              font-weight: bold;
              margin-bottom: ${barcodeSettings.spacing}px;
              word-wrap: break-word;
              color: #374151;
              text-align: center;
              max-height: 20px;
              overflow: hidden;
            }
            .barcode-svg {
              margin: ${barcodeSettings.spacing}px 0;
              max-width: 100%;
            }
            .price {
              font-size: 10px;
              font-weight: bold;
              color: #dc2626;
              margin-top: ${barcodeSettings.spacing}px;
              padding: 2px 4px;
              border: 1px solid #dc2626;
              border-radius: 2px;
              display: inline-block;
            }
            .barcode-number {
              font-family: 'Courier New', monospace;
              font-size: 8px;
              margin-top: ${barcodeSettings.spacing}px;
              margin-bottom: ${barcodeSettings.spacing}px;
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
            ${barcodeSettings.showCompanyName ? `<div class="company-name">${companyName}</div>` : ''}
            ${barcodeSettings.showProductName && productName ? `<div class="product-name">${productName}</div>` : ''}
            ${barcodeSettings.showBarcode ? `<svg id="barcode" class="barcode-svg"></svg>` : ''}
            ${barcodeSettings.showProductCode ? `<div class="barcode-number">${productCode}</div>` : ''}
            ${barcodeSettings.showPrice && priceText ? `<div class="price">${priceText}</div>` : ''}
          </div>

          <script>
            // Generate CODE 128 barcode with custom settings only if barcode is visible
            ${barcodeSettings.showBarcode ? `
            JsBarcode("#barcode", "${barcodeValue}", {
              format: "CODE128",
              width: ${barcodeSettings.width},
              height: ${barcodeSettings.height},
              displayValue: true,
              fontSize: ${barcodeSettings.fontSize},
              margin: ${barcodeSettings.margin},
              background: "#ffffff",
              lineColor: "#000000"
            });` : ''};

            // Auto-print when page loads
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // Close window after printing
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
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
    <Button variant="outline" onClick={handlePrintBarcode} className={className}>
      <Barcode className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
      {buttonText}
    </Button>
  );
}

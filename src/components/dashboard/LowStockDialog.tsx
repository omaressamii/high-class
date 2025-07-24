'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package, Eye, Edit, ExternalLink } from 'lucide-react';
import type { Product, ProductTypeDefinition } from '@/types';
import Link from 'next/link';

interface LowStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  productTypes: ProductTypeDefinition[];
  lang: 'ar' | 'en';
}

export function LowStockDialog({ isOpen, onClose, products, productTypes, lang }: LowStockDialogProps) {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const t = {
    lowStockProducts: lang === 'ar' ? 'المنتجات قليلة المخزون' : 'Low Stock Products',
    description: lang === 'ar' 
      ? 'المنتجات التي تحتوي على أقل من 10 قطع في المخزون'
      : 'Products with less than 10 items in stock',
    productName: lang === 'ar' ? 'اسم المنتج' : 'Product Name',
    productCode: lang === 'ar' ? 'كود المنتج' : 'Product Code',
    type: lang === 'ar' ? 'النوع' : 'Type',
    category: lang === 'ar' ? 'الفئة' : 'Category',
    currentStock: lang === 'ar' ? 'المخزون الحالي' : 'Current Stock',
    rented: lang === 'ar' ? 'مؤجر' : 'Rented',
    available: lang === 'ar' ? 'متاح' : 'Available',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    viewDetails: lang === 'ar' ? 'عرض التفاصيل' : 'View Details',
    editProduct: lang === 'ar' ? 'تعديل المنتج' : 'Edit Product',
    noLowStockProducts: lang === 'ar' 
      ? 'لا توجد منتجات قليلة المخزون حالياً' 
      : 'No low stock products currently',
    close: lang === 'ar' ? 'إغلاق' : 'Close',
    rental: lang === 'ar' ? 'إيجار' : 'Rental',
    sale: lang === 'ar' ? 'بيع' : 'Sale',
    pieces: lang === 'ar' ? 'قطعة' : 'pieces',
  };

  useEffect(() => {
    // Filter products with low stock (less than 10 items)
    const lowStock = products.filter(product => 
      (product.quantityInStock || 0) < 10
    );
    setLowStockProducts(lowStock);
  }, [products]);

  const getProductTypeName = (typeId: string) => {
    const productType = productTypes.find(pt => pt.id === typeId);
    return productType ? (lang === 'ar' ? productType.name_ar : productType.name) : typeId;
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (stock <= 3) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    if (stock <= 6) return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {t.lowStockProducts}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh]">
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">{t.noLowStockProducts}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.productName}</TableHead>
                  <TableHead>{t.productCode}</TableHead>
                  <TableHead>{t.type}</TableHead>
                  <TableHead>{t.category}</TableHead>
                  <TableHead className="text-center">{t.currentStock}</TableHead>
                  <TableHead className="text-center">{t.rented}</TableHead>
                  <TableHead className="text-center">{t.available}</TableHead>
                  <TableHead className="text-center">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => {
                  const stock = product.quantityInStock || 0;
                  const rented = product.quantityRented || 0;
                  const available = stock - rented;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {product.productCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        {getProductTypeName(product.type)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.category === 'Rental' ? 'default' : 'secondary'}>
                          {product.category === 'Rental' ? t.rental : t.sale}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={getStockStatusColor(stock)}
                        >
                          {stock} {t.pieces}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {product.category === 'Rental' ? (
                          <span className="text-sm text-muted-foreground">
                            {rented} {t.pieces}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-medium ${
                          available <= 0 ? 'text-red-600' : 
                          available <= 3 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {available} {t.pieces}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/${lang}/products/${product.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/${lang}/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {lowStockProducts.length > 0 && (
              <>
                {lang === 'ar' ? 'إجمالي' : 'Total'}: {lowStockProducts.length} {lang === 'ar' ? 'منتج' : 'products'}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/${lang}/products`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {lang === 'ar' ? 'عرض جميع المنتجات' : 'View All Products'}
              </Link>
            </Button>
            <Button onClick={onClose}>
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

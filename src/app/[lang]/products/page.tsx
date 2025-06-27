
import React from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/shared/PageTitle';
import type { Product, ProductCategory, ProductStatus, ProductSize, ProductTypeDefinition } from '@/types'; // Updated ProductType to ProductTypeDefinition
import { ref, get, query, orderByChild } from 'firebase/database';
import { database } from '@/lib/firebase';
import { ClientAuthWrapper } from '@/components/products/ClientAuthWrapper';
import { ProductFiltersClientWrapper } from '@/components/products/ProductFiltersClientWrapper';
import { DeleteAllProductsButton } from '@/components/products/DeleteAllProductsButton';

interface ProductsPageProps {
  params: { lang: string };
}

async function getProductsFromRealtimeDB(): Promise<Product[]> {
  const productsRef = ref(database, 'products');

  try {
    const productSnapshot = await get(productsRef);
    const productList: Product[] = [];

    if (!productSnapshot.exists()) {
      return productList;
    }

    const productsData = productSnapshot.val();
    for (const [id, data] of Object.entries(productsData)) {
      try {
        const productData = data as any;

        const name = data.name !== undefined && data.name !== null ? String(data.name) : '';
        const type = data.type !== undefined && data.type !== null ? String(data.type) : 'suit'; // Default type ID
        const category = (data.category && ['Rental', 'Sale'].includes(data.category) ? data.category : 'Rental') as ProductCategory;
        const size = (data.size && ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'].includes(data.size) ? data.size : 'M') as ProductSize;

        let price = 0;
        if (typeof data.price === 'number' && !isNaN(data.price)) {
            price = Number(data.price);
        } else if (typeof data.price === 'string' && !isNaN(parseFloat(data.price))) {
            price = parseFloat(data.price);
        }

        const status = (data.status && ['Available', 'Rented', 'Sold'].includes(data.status) ? data.status : 'Available') as ProductStatus;

        let imageUrl = data.imageUrl !== undefined && data.imageUrl !== null ? String(data.imageUrl) : 'https://placehold.co/600x400.png';
        // Allow both HTTP URLs and local paths starting with /uploads/
        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/uploads/')) {
          imageUrl = 'https://placehold.co/600x400.png';
        }

        const description = data.description !== undefined && data.description !== null ? String(data.description) : '';
        const notes = data.notes !== undefined && data.notes !== null ? String(data.notes) : undefined;
        const dataAiHint = data['data-ai-hint'] !== undefined && data['data-ai-hint'] !== null ? String(data['data-ai-hint']) : undefined;

        let initialStock = 0;
        if (typeof data.initialStock === 'number' && !isNaN(data.initialStock)) {
            initialStock = Number(data.initialStock);
        } else if (typeof data.initialStock === 'string' && !isNaN(parseInt(data.initialStock, 10))) {
            initialStock = parseInt(data.initialStock, 10);
        }

        let quantityInStock = 0;
         if (typeof data.quantityInStock === 'number' && !isNaN(data.quantityInStock)) {
            quantityInStock = Number(data.quantityInStock);
        } else if (typeof data.quantityInStock === 'string' && !isNaN(parseInt(data.quantityInStock, 10))) {
            quantityInStock = parseInt(data.quantityInStock, 10);
        }

        let quantityRented = 0;
        if (typeof data.quantityRented === 'number' && !isNaN(data.quantityRented)) {
            quantityRented = Number(data.quantityRented);
        } else if (typeof data.quantityRented === 'string' && !isNaN(parseInt(data.quantityRented, 10))) {
            quantityRented = parseInt(data.quantityRented, 10);
        }

        const productCode = data.productCode !== undefined && data.productCode !== null ? String(data.productCode) : '';
        const branchId = data.branchId !== undefined ? String(data.branchId) : undefined;
        const branchName = data.branchName !== undefined ? String(data.branchName) : undefined;
        const isGlobalProduct = typeof data.isGlobalProduct === 'boolean' ? data.isGlobalProduct : false;


        productList.push({
          id,
          name,
          productCode,
          type, // This is the type ID
          category,
          size,
          price,
          status,
          imageUrl,
          description,
          notes,
          "data-ai-hint": dataAiHint,
          initialStock,
          quantityInStock,
          quantityRented,
          branchId,
          branchName,
          isGlobalProduct,
        });
      } catch (mapError: any) {
        console.error(`Error mapping product ${id}:`, mapError.message, "Product data:", data);
      }
    }
    return productList;

  } catch (fetchError: any) {
    console.error("Realtime Database fetch error in getProductsFromRealtimeDB: ", fetchError);
    return [];
  }
}

async function getProductTypesFromRealtimeDB(): Promise<ProductTypeDefinition[]> {
  try {
    const typesConfigRef = ref(database, 'system_settings/productTypesConfig');
    const docSnap = await get(typesConfigRef);
    if (docSnap.exists()) {
      const configData = docSnap.val();
      return (configData.types || []) as ProductTypeDefinition[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching product types for ProductsPage:", error);
    return [];
  }
}

export default async function ProductsPage({ params: routeParams }: { params: Promise<{ lang: string }> }) {
  const { lang } = await routeParams;
  const pageLang = lang as string;
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';

  const products = await getProductsFromRealtimeDB();
  const productTypes = await getProductTypesFromRealtimeDB();

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'مجموعتنا' : 'Our Collection',
    addProduct: effectiveLang === 'ar' ? 'إضافة منتج' : 'Add Product',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <PageTitle>{t.pageTitle}</PageTitle>
        <div className="flex items-center gap-2">
            <ClientAuthWrapper lang={effectiveLang} addProductText={t.addProduct} />
            <DeleteAllProductsButton lang={effectiveLang} />
        </div>
      </div>
      <ProductFiltersClientWrapper
        allProducts={products}
        allProductTypes={productTypes}
        lang={effectiveLang}
      />
    </div>
  );
}

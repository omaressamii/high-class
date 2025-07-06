# استبدال زر "إضافة دفعة" في صفحة التجهيز

## التحديث المطبق

تم استبدال زر "إضافة دفعة" في صفحة تجهيز الطلبات ليفتح حوار إضافة الدفعة مباشرة بدلاً من التوجيه لصفحة تفاصيل الطلب.

## التغييرات المطبقة

### 1. تحديث مكون DeliverOrdersTable

#### إضافة الواردات والحالة:
```typescript
import { AddPaymentDialog } from './AddPaymentDialog';
import React, { useState } from 'react';

// إضافة state لإدارة حوار الدفعة
const [showPaymentDialog, setShowPaymentDialog] = useState(false);
const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OrderWithDetails | null>(null);
```

#### إضافة دوال المعالجة:
```typescript
const handleAddPayment = (order: OrderWithDetails) => {
  setSelectedOrderForPayment(order);
  setShowPaymentDialog(true);
};

const handlePaymentAdded = () => {
  setShowPaymentDialog(false);
  setSelectedOrderForPayment(null);
  // Refresh the page to show updated data
  window.location.reload();
};
```

#### تحديث زر إضافة الدفعة:
```typescript
// قبل التحديث (رابط لصفحة التفاصيل)
<Button variant="outline" size="sm" asChild className="text-blue-600 border-blue-600 hover:bg-blue-50">
  <Link href={`/${lang}/orders/${order.id}`}>
    <CreditCard className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
    {lang === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
  </Link>
</Button>

// بعد التحديث (فتح حوار مباشر)
<Button 
  variant="outline" 
  size="sm" 
  onClick={() => handleAddPayment(order)}
  className="text-blue-600 border-blue-600 hover:bg-blue-50"
>
  <CreditCard className="mr-1 rtl:ml-1 rtl:mr-0 h-4 w-4" />
  {lang === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
</Button>
```

#### إضافة حوار إضافة الدفعة:
```typescript
{/* Add Payment Dialog */}
{showPaymentDialog && selectedOrderForPayment && (
  <AddPaymentDialog
    isOpen={showPaymentDialog}
    setIsOpen={setShowPaymentDialog}
    order={selectedOrderForPayment}
    lang={lang}
    currentUserName={currentUserName || 'Unknown User'}
    onPaymentAdded={handlePaymentAdded}
  />
)}
```

### 2. تحديث صفحة التجهيز

#### إضافة اسم المستخدم الحالي:
```typescript
<DeliverOrdersTable
  orders={readyForDeliveryOrders}
  onMarkAsDelivered={handleMarkAsDelivered}
  onViewDetails={handleOpenDetailsModal}
  lang={effectiveLang}
  hasEditPermission={hasPermission('orders_prepare')}
  currentUserName={currentUser?.fullName || currentUser?.username || 'Unknown User'}
/>
```

## المزايا الجديدة

### 1. **تجربة مستخدم محسنة**
- لا حاجة للانتقال بين الصفحات
- إضافة دفعة مباشرة من جدول التسليم
- توفير الوقت والخطوات

### 2. **سير عمل أكثر كفاءة**
- عرض جميع الطلبات الجاهزة للتسليم
- إضافة دفعة فورية للطلبات غير المسددة
- تحديث فوري لحالة الطلب

### 3. **تكامل كامل**
- نفس حوار إضافة الدفعة المستخدم في صفحة التفاصيل
- نفس التحققات الأمنية والتحديثات
- تسجيل المعاملات المالية بنفس الطريقة

## كيفية الاختبار

### 1. اختبار الوظيفة الجديدة
1. انتقل إلى صفحة التحضير والتسليم
2. ابحث عن طلب في قسم "الطلبات الجاهزة للتسليم" له مبلغ متبقي
3. اضغط على زر "إضافة دفعة" الأزرق
4. **النتيجة المتوقعة**: فتح حوار إضافة الدفعة مباشرة (وليس الانتقال لصفحة أخرى)

### 2. اختبار إضافة دفعة
1. في الحوار المفتوح، أدخل مبلغ الدفعة
2. اختر طريقة الدفع
3. أضف ملاحظات (اختياري)
4. اضغط "إضافة الدفعة"
5. **النتيجة المتوقعة**: 
   - إغلاق الحوار
   - تحديث الصفحة
   - تحديث المبلغ المتبقي في الجدول
   - إذا تم سداد المبلغ كاملاً، تفعيل زر التسليم

### 3. اختبار التكامل
1. بعد إضافة الدفعة، تحقق من:
   - تحديث المبلغ المتبقي في الجدول
   - ظهور المعاملة المالية في صفحة المالية
   - تحديث تفاصيل الطلب في صفحة التفاصيل
   - إمكانية التسليم إذا تم السداد كاملاً

## السيناريوهات المختلفة

### سيناريو 1: دفعة جزئية
- طلب متبقي عليه 300 جنيه
- إضافة دفعة 200 جنيه
- **النتيجة**: متبقي 100 جنيه، زر التسليم لا يزال معطل

### سيناريو 2: دفعة كاملة
- طلب متبقي عليه 300 جنيه
- إضافة دفعة 300 جنيه
- **النتيجة**: متبقي 0 جنيه، زر التسليم يصبح نشط

### سيناريو 3: عدة دفعات
- طلب متبقي عليه 500 جنيه
- إضافة دفعة 200 جنيه (متبقي 300)
- إضافة دفعة 300 جنيه (متبقي 0)
- **النتيجة**: يمكن التسليم

## الملفات المعدلة
1. `src/components/orders/DeliverOrdersTable.tsx` - تحديث زر إضافة الدفعة وإضافة الحوار
2. `src/app/[lang]/orders/prepare/page.tsx` - إضافة اسم المستخدم الحالي

## الفوائد
1. **كفاءة أكبر**: لا حاجة للانتقال بين الصفحات
2. **تجربة أفضل**: إجراء واحد لإضافة الدفعة والتسليم
3. **توفير الوقت**: عملية أسرع لمعالجة الطلبات
4. **تقليل الأخطاء**: أقل خطوات تعني أقل احتمالية للخطأ
5. **تدفق طبيعي**: من إضافة الدفعة مباشرة للتسليم

## ملاحظات مهمة
- الحوار هو نفسه المستخدم في صفحة تفاصيل الطلب
- جميع التحققات الأمنية والتحديثات تعمل بنفس الطريقة
- يتم تحديث الصفحة تلقائياً بعد إضافة الدفعة
- زر "إضافة دفعة" يظهر فقط للطلبات التي لها مبلغ متبقي

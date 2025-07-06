# إضافة ميزة "إضافة دفعة" في صفحة تفاصيل الطلب

## المشكلة الأصلية
عند الضغط على "إضافة دفعة" في جدول التسليم، كان يتم توجيه المستخدم لصفحة تفاصيل الطلب ولكن لا توجد إمكانية لإضافة دفعة هناك.

## الحل المطبق

### 1. إنشاء مكون AddPaymentDialog
تم إنشاء مكون جديد `AddPaymentDialog.tsx` يحتوي على:

#### الميزات الرئيسية:
- **حقل مبلغ الدفعة**: مع تحديد الحد الأقصى بالمبلغ المتبقي
- **اختيار طريقة الدفع**: نقدي، بطاقة، تحويل بنكي، أخرى
- **حقل ملاحظات**: لإضافة تفاصيل إضافية
- **عرض المبلغ المتبقي**: قبل وبعد الدفعة
- **التحقق من صحة البيانات**: منع إدخال مبالغ خاطئة

#### التحققات الأمنية:
```typescript
// التحقق من صحة المبلغ
if (!paymentAmount || paymentAmount <= 0) {
  toast({ title: t.invalidPaymentAmount, variant: 'destructive' });
  return;
}

// التحقق من طريقة الدفع
if (!paymentMethod) {
  toast({ title: t.paymentMethodRequired, variant: 'destructive' });
  return;
}

// التحقق من عدم تجاوز المبلغ المتبقي
if (paymentAmount > remainingAmount) {
  toast({ title: t.paymentTooHigh, variant: 'destructive' });
  return;
}
```

### 2. تحديث صفحة تفاصيل الطلب
تم إضافة الميزات التالية لصفحة `OrderDetailClientPage.tsx`:

#### إضافة زر "إضافة دفعة":
- يظهر فقط للطلبات التي لها مبلغ متبقي
- يظهر فقط للطلبات غير المكتملة أو المسلمة
- يتطلب صلاحية `payments_record`

```typescript
{hasPermission('payments_record') && order.remainingAmount && order.remainingAmount > 0 && 
 order.status !== 'Delivered to Customer' && order.status !== 'Completed' && (
  <Button variant="outline" onClick={() => setShowPaymentDialog(true)} 
          className="text-blue-600 border-blue-600 hover:bg-blue-50">
    <CreditCard className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {t.addPayment}
  </Button>
)}
```

#### إضافة حوار إضافة الدفعة:
```typescript
{showPaymentDialog && (
  <AddPaymentDialog
    isOpen={showPaymentDialog}
    setIsOpen={setShowPaymentDialog}
    order={order}
    lang={effectiveLang}
    currentUserName={currentUser?.fullName || currentUser?.username || 'Unknown User'}
    onPaymentAdded={handlePaymentAdded}
  />
)}
```

### 3. العمليات المنفذة عند إضافة دفعة

#### تحديث بيانات الطلب:
```typescript
await update(orderRef, {
  paidAmount: newPaidAmount,           // زيادة المبلغ المدفوع
  remainingAmount: newRemainingAmountFinal, // تقليل المبلغ المتبقي
  notes: updatedNotes,                 // إضافة ملاحظة الدفعة
  updatedAt: new Date().toISOString()  // تحديث وقت التعديل
});
```

#### إنشاء معاملة مالية:
```typescript
const paymentTransaction: Omit<FinancialTransaction, 'id'> = {
  type: 'Payment Received',
  transactionCategory: 'Payment',
  description: `دفعة مستلمة للطلب: ${order.orderCode}`,
  amount: paymentAmount,
  paymentMethod: paymentMethod,
  // ... باقي البيانات
};
```

#### إضافة ملاحظة للطلب:
```typescript
const paymentNote = `[${timestamp}] - تم إضافة دفعة بقيمة ${paymentAmount} جنيه بواسطة ${currentUserName}. طريقة الدفع: ${paymentMethod}`;
```

## كيفية الاختبار

### 1. اختبار من جدول التسليم
1. انتقل إلى صفحة التحضير والتسليم
2. ابحث عن طلب له مبلغ متبقي
3. اضغط على زر "إضافة دفعة" الأزرق
4. تأكد من الانتقال لصفحة تفاصيل الطلب

### 2. اختبار إضافة دفعة
1. في صفحة تفاصيل الطلب، اضغط على "إضافة دفعة"
2. أدخل مبلغ الدفعة (أقل من أو يساوي المبلغ المتبقي)
3. اختر طريقة الدفع
4. أضف ملاحظات (اختياري)
5. اضغط "إضافة الدفعة"

### 3. التحقق من النتائج
بعد إضافة الدفعة، تحقق من:
- تحديث المبلغ المتبقي في تفاصيل الطلب
- ظهور ملاحظة الدفعة في قسم الملاحظات
- ظهور المعاملة المالية في صفحة المالية
- تحديث حالة الطلب في جدول التسليم

### 4. اختبار التحققات
جرب السيناريوهات التالية للتأكد من التحققات:
- إدخال مبلغ أكبر من المبلغ المتبقي
- إدخال مبلغ صفر أو سالب
- عدم اختيار طريقة دفع
- إضافة دفعة لطلب مسدد بالكامل

## السيناريوهات المختلفة

### سيناريو 1: دفعة جزئية
- طلب بقيمة 1000 جنيه، مدفوع 600 جنيه، متبقي 400 جنيه
- إضافة دفعة 200 جنيه
- **النتيجة**: مدفوع 800 جنيه، متبقي 200 جنيه

### سيناريو 2: دفعة كاملة
- طلب بقيمة 1000 جنيه، مدفوع 600 جنيه، متبقي 400 جنيه
- إضافة دفعة 400 جنيه
- **النتيجة**: مدفوع 1000 جنيه، متبقي 0 جنيه، يمكن التسليم

### سيناريو 3: طلب مع خصم
- طلب بقيمة 1000 جنيه، خصم 100 جنيه، مدفوع 600 جنيه، متبقي 300 جنيه
- إضافة دفعة 300 جنيه
- **النتيجة**: مدفوع 900 جنيه، متبقي 0 جنيه، يمكن التسليم

## الملفات المضافة/المعدلة
1. **جديد**: `src/components/orders/AddPaymentDialog.tsx` - مكون حوار إضافة الدفعة
2. **معدل**: `src/components/orders/OrderDetailClientPage.tsx` - إضافة زر وحوار إضافة الدفعة

## الفوائد
1. **سهولة الاستخدام**: إضافة دفعة مباشرة من صفحة تفاصيل الطلب
2. **تتبع دقيق**: تسجيل جميع الدفعات في المعاملات المالية
3. **أمان**: تحققات شاملة لمنع الأخطاء
4. **شفافية**: ملاحظات واضحة لكل دفعة
5. **تكامل**: يعمل مع نظام منع التسليم قبل السداد

## ملاحظات مهمة
- الزر يظهر فقط للمستخدمين الذين لديهم صلاحية `payments_record`
- لا يمكن إضافة دفعة للطلبات المكتملة أو المسلمة
- يتم تحديث الصفحة تلقائياً بعد إضافة الدفعة
- جميع الدفعات تُسجل في المعاملات المالية لأغراض المراجعة

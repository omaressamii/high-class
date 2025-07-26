# نظام تفريغ الخزنة المحسن - User Cashout System

## نظرة عامة - Overview

تم تطوير نظام تفريغ الخزنة ليكون منفصلاً تماماً عن النظام المالي الأساسي، مما يضمن عدم التأثير على التقارير المالية والحسابات الأخرى في النظام.

The cashout system has been developed to be completely separate from the core financial system, ensuring no impact on financial reports and other system calculations.

## الهيكل الجديد - New Architecture

### 1. فصل البيانات - Data Separation

- **المعاملات المالية الأصلية**: تبقى في `financial_transactions` دون تغيير
- **عمليات التفريغ**: تُسجل في جدول منفصل `user_cashouts`
- **حساب الرصيد**: يعتمد على الفترة منذ آخر تفريغ

### 2. آلية الحساب الجديدة - New Calculation Logic

```typescript
رصيد المستخدم = مجموع Payment Received منذ آخر تفريغ
User Balance = Sum of Payment Received since last cashout
```

## الواجهات - Interfaces

### UserCashout Interface
```typescript
interface UserCashout {
  id: string;
  userId: string;
  userName: string;
  amount: number; // المبلغ المُفرغ (قيمة موجبة)
  cashoutDate: string; // YYYY-MM-DD
  processedByUserId: string;
  processedByUserName: string;
  branchId?: string;
  branchName?: string;
  notes?: string;
  createdAt: string; // ISO timestamp
}
```

## الدوال الأساسية - Core Functions

### 1. calculateUserCashBalance
```typescript
calculateUserCashBalance(userId: string, transactions: FinancialTransaction[], cashouts: UserCashout[]): number
```
- حساب رصيد المستخدم منذ آخر تفريغ
- تعتمد فقط على معاملات `Payment Received`

### 2. getUserCashTransactions
```typescript
getUserCashTransactions(userId: string, transactions: FinancialTransaction[], cashouts: UserCashout[]): FinancialTransaction[]
```
- إرجاع المعاملات منذ آخر تفريغ

### 3. getLastUserCashout
```typescript
getLastUserCashout(userId: string, cashouts: UserCashout[]): UserCashout | null
```
- إرجاع آخر عملية تفريغ للمستخدم

## كيفية الاستخدام - How to Use

### 1. الوصول للميزة - Accessing the Feature
- اذهب إلى صفحة "إدارة المستخدمين"
- تأكد من وجود صلاحية `cashout_manage`
- ابحث عن زر المحفظة في كارت المستخدم

### 2. عملية التفريغ - Cashout Process
1. اضغط على زر المحفظة (💼)
2. راجع المعلومات المعروضة:
   - المبلغ المحصل منذ آخر تفريغ
   - الرصيد الحالي
   - عدد المعاملات
   - تاريخ آخر تفريغ
3. اضغط "تأكيد التفريغ"
4. سيصبح الرصيد = 0

### 3. النتيجة - Result
- يتم إنشاء سجل في `user_cashouts`
- رصيد المستخدم يصبح صفر
- المعاملات الأصلية تبقى دون تغيير
- لا تأثير على الصفحات الأخرى

## المزايا - Benefits

### ✅ العزل التام - Complete Isolation
- عمليات التفريغ منفصلة عن المعاملات المالية
- لا تأثير على صفحة السجل المالي
- لا تأثير على التقارير

### ✅ الدقة - Accuracy
- حسابات دقيقة للرصيد
- تتبع كامل لعمليات التفريغ
- حفظ تاريخ كل عملية

### ✅ الشفافية - Transparency
- كل عملية تفريغ مسجلة
- معرفة من قام بالتفريغ ومتى
- عرض تاريخ آخر تفريغ

### ✅ الأمان - Security
- صلاحيات محكمة
- تأكيد قبل التفريغ
- لا يمكن التراجع عن العملية

## قاعدة البيانات - Database Structure

### الجداول المستخدمة - Tables Used
- `financial_transactions`: المعاملات المالية الأصلية (لا تتغير)
- `user_cashouts`: عمليات التفريغ (جدول جديد)

### مثال على البيانات - Data Example
```json
// في user_cashouts
{
  "cashout_001": {
    "userId": "user123",
    "userName": "أحمد محمد",
    "amount": 1250,
    "cashoutDate": "2024-01-15",
    "processedByUserId": "admin",
    "processedByUserName": "المدير",
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

## الاختبار - Testing

تم إنشاء ملف اختبار شامل في:
```
src/lib/__tests__/cashout-utils.test.ts
```

يمكن تشغيل الاختبارات للتأكد من صحة الحسابات.

## الصيانة - Maintenance

### مراقبة النظام - System Monitoring
- تحقق من دقة الحسابات دورياً
- راقب حجم جدول `user_cashouts`
- تأكد من عدم تأثر الصفحات الأخرى

### النسخ الاحتياطي - Backup
- تأكد من تضمين `user_cashouts` في النسخ الاحتياطية
- احتفظ بسجلات التفريغ للمراجعة

## الدعم الفني - Technical Support

في حالة وجود مشاكل:
1. تحقق من الصلاحيات
2. راجع console للأخطاء
3. تأكد من تحميل البيانات بشكل صحيح
4. راجع ملف الاختبار للتأكد من صحة الحسابات

# صفحة إعدادات التطبيق / Application Settings Page

## نظرة عامة / Overview

صفحة إعدادات التطبيق تسمح للمستخدمين المخولين بتخصيص وإدارة إعدادات التطبيق المختلفة، بما في ذلك إعدادات الباركود والإعدادات العامة.

The Application Settings page allows authorized users to customize and manage various application settings, including barcode settings and general settings.

## الميزات / Features

### إعدادات الباركود / Barcode Settings
- تخصيص عرض الباركود (1-5)
- تخصيص ارتفاع الباركود (40-100 بكسل)
- تخصيص حجم الخط (8-16 بكسل)
- تخصيص الهامش (0-10 بكسل)
- تخصيص المسافات بين عناصر الباركود (0-10 بكسل)
- تخصيص أبعاد حاوية الطباعة
- معاينة مباشرة للباركود بالإعدادات الحالية

### الإعدادات العامة / General Settings
- إعداد اسم الشركة (عربي وإنجليزي)
- تفعيل/إلغاء النسخ الاحتياطي التلقائي
- تحديد فترة النسخ الاحتياطي
- تحديد عدد العناصر المعروضة في كل صفحة
- تفعيل/إلغاء الإشعارات
- تحديد العملة الافتراضية

## الملفات / Files

### الصفحة الرئيسية / Main Page
- `page.tsx` - الصفحة الرئيسية لإعدادات التطبيق

### المكونات / Components
- `src/components/settings/BarcodePreview.tsx` - مكون معاينة الباركود
- `src/components/settings/GeneralSettings.tsx` - مكون الإعدادات العامة

### التحديثات على الملفات الموجودة / Updates to Existing Files
- `src/components/products/PrintBarcodeButton.tsx` - محدث لاستخدام إعدادات الباركود المحفوظة
- `src/components/layout/SiteHeader.tsx` - محدث لإضافة رابط صفحة الإعدادات

## الصلاحيات / Permissions

يتطلب الوصول إلى صفحة الإعدادات صلاحية `users_manage`.

Access to the settings page requires `users_manage` permission.

## قاعدة البيانات / Database Structure

### إعدادات الباركود / Barcode Settings
```
system_settings/barcodeSettings/
├── width: number (1-5)
├── height: number (40-100)
├── fontSize: number (8-16)
├── margin: number (0-10)
├── spacing: number (0-10)
├── containerWidth: string (e.g., "4cm")
└── containerHeight: string (e.g., "2.5cm")
```

### الإعدادات العامة / General Settings
```
system_settings/generalSettings/
├── companyName: string
├── companyNameAr: string
├── autoBackup: boolean
├── backupInterval: number (1-168 hours)
├── maxOrdersPerPage: number (10-100)
├── maxProductsPerPage: number (10-100)
├── enableNotifications: boolean
└── defaultCurrency: string
```

## الاستخدام / Usage

1. انتقل إلى صفحة الإعدادات من القائمة الرئيسية
2. قم بتعديل الإعدادات المطلوبة
3. استخدم معاينة الباركود لرؤية التغييرات
4. اضغط "حفظ الإعدادات" لحفظ التغييرات
5. استخدم "إعادة تعيين افتراضي" للعودة للقيم الافتراضية

1. Navigate to Settings page from the main menu
2. Modify the desired settings
3. Use barcode preview to see changes
4. Click "Save Settings" to save changes
5. Use "Reset to Default" to restore default values

## التطوير المستقبلي / Future Development

يمكن إضافة المزيد من الإعدادات مثل:
- إعدادات الألوان والثيمات
- إعدادات التقارير
- إعدادات الأمان
- إعدادات التكامل مع الأنظمة الخارجية

Future settings can be added such as:
- Color and theme settings
- Report settings
- Security settings
- External system integration settings

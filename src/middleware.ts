/**
 * @file src/middleware.ts
 * @description ملف الوسيط (Middleware) الخاص بـ Next.js.
 * هذا الوسيط مسؤول عن معالجة طلبات التوجيه (routing) قبل وصولها إلى الصفحات.
 * وظيفته الأساسية هنا هي إدارة التدويل (i18n):
 * 1. تحديد اللغات المدعومة في التطبيق (حالياً 'en' و 'ar').
 * 2. تحديد اللغة الافتراضية ('ar').
 * 3. التحقق مما إذا كان مسار الطلب الحالي يحتوي بالفعل على بادئة لغة (مثل /ar/products).
 * 4. إذا لم يكن المسار يحتوي على بادئة لغة، يقوم الوسيط بإعادة توجيه المستخدم إلى نفس المسار
 *    ولكن مع إضافة بادئة اللغة الافتراضية (مثلاً، /products يتم توجيهها إلى /ar/products).
 * 
 * يتم تطبيق هذا الوسيط على جميع المسارات باستثناء تلك المحددة في `config.matcher`
 * (مثل مسارات API، ملفات Next.js الداخلية، وملف favicon.ico).
 * 
 * @param {NextRequest} request - كائن يمثل الطلب الوارد.
 * @returns {NextResponse} - كائن يمثل الاستجابة، إما بإعادة التوجيه أو السماح للطلب بالمرور.
 */
import { NextRequest, NextResponse } from 'next/server';

// اللغات المدعومة في التطبيق
const locales = ['en', 'ar'];
// اللغة الافتراضية التي يتم التوجيه إليها إذا لم يتم تحديد لغة في المسار
const defaultLocale = 'ar';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // التحقق مما إذا كان المسار يبدأ بالفعل ببادئة لغة مدعومة
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // إذا كان المسار يحتوي على لغة، اسمح للطلب بالمرور كالمعتاد
    return NextResponse.next();
  }

  // إذا لم يتم العثور على بادئة لغة، قم بإعادة التوجيه إلى نفس المسار تحت اللغة الافتراضية
  // تأكد من أن المسار يبدأ بشرطة مائلة (/) لبناء عنوان URL صحيح
  const newPathname = `/${defaultLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  
  // استنساخ عنوان URL لتعديل مساره
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = newPathname;
  
  // إعادة توجيه المستخدم إلى المسار الجديد مع بادئة اللغة
  return NextResponse.redirect(newUrl);
}

// إعدادات الوسيط:
// يضمن هذا `matcher` أن الوسيط يعمل على جميع المسارات باستثناء:
// - مسارات API (أي شيء يبدأ بـ /api/)
// - مسارات Next.js الداخلية (_next/static, _next/image)
// - ملف Favicon
// يساعد هذا في تجنب حلقات إعادة التوجيه أو تطبيق منطق التدويل على الأصول الثابتة.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)',
  ],
};


import { PageTitle } from '@/components/shared/PageTitle';
import { OptimizerForm } from '@/components/listing-optimizer/OptimizerForm';

interface ListingOptimizerPageProps {
  params: { lang: string };
}

export default async function ListingOptimizerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const effectiveLang = lang === 'en' ? 'en' : 'ar';
  const pageTitle = effectiveLang === 'ar' ? 'محسن القوائم' : 'Listing Optimizer';
  const description = effectiveLang === 'ar' 
    ? 'أدخل وصف منتجك أدناه للحصول على اقتراحات مدعومة بالذكاء الاصطناعي لتحسين قائمتك.' 
    : 'Enter your product description below to get AI-powered suggestions for enhancing your listing.';

  return (
    <div className="space-y-8">
      <PageTitle>{pageTitle}</PageTitle>
      <p className="text-muted-foreground">
        {description}
      </p>
      <OptimizerForm />
    </div>
  );
}

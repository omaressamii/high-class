'use client';

import { useState, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { optimizeListing, type OptimizeListingOutput } from '@/ai/flows/listing-optimizer';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Loader2, CheckCircle } from 'lucide-react';
import { useParams } from 'next/navigation';

const FormSchema = z.object({
  productDescription: z.string().min(20, {
    message: 'Product description must be at least 20 characters.',
  }).max(1000, {
    message: 'Product description must not exceed 1000 characters.'
  }),
});

type FormData = z.infer<typeof FormSchema>;

export function OptimizerForm() {
  const params = useParams();
  const lang = params.lang as string;

  const [suggestions, setSuggestions] = useState<OptimizeListingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create dynamic translations
  const t = {
    formSchema_minChars: lang === 'ar' ? 'يجب أن يكون وصف المنتج 20 حرفًا على الأقل.' : 'Product description must be at least 20 characters.',
    formSchema_maxChars: lang === 'ar' ? 'يجب ألا يتجاوز وصف المنتج 1000 حرف.' : 'Product description must not exceed 1000 characters.',
    enhanceListingTitle: lang === 'ar' ? 'عزز قائمتك' : 'Enhance Your Listing',
    provideDescription: lang === 'ar' ? 'قدم وصف المنتج الحالي ودع الذكاء الاصطناعي يقترح تحسينات.' : 'Provide your current product description and let our AI suggest improvements.',
    productDescriptionLabel: lang === 'ar' ? 'وصف المنتج' : 'Product Description',
    productDescriptionPlaceholder: lang === 'ar' ? 'مثال: فستان زفاف حريري جميل بذيل طويل وتفاصيل دانتيل...' : 'e.g., Beautiful silk wedding dress with long train and lace details...',
    optimizingButton: lang === 'ar' ? 'تحسين...' : 'Optimizing...',
    getSuggestionsButton: lang === 'ar' ? 'احصل على اقتراحات' : 'Get Suggestions',
    errorTitle: lang === 'ar' ? 'خطأ' : 'Error',
    suggestedPhrasesTitle: lang === 'ar' ? 'العبارات المقترحة' : 'Suggested Phrases',
    noSuggestionsTitle: lang === 'ar' ? 'لا توجد اقتراحات' : 'No Suggestions',
    noSuggestionsDescription: lang === 'ar' ? 'لم يتمكن الذكاء الاصطناعي من إنشاء عبارات محددة لهذا الوصف. حاول تقديم المزيد من التفاصيل أو زاوية مختلفة.' : "The AI couldn't generate specific phrases for this description. Try providing more details or a different angle."
  };

  // Create dynamic schema with localized messages
  const currentFormSchema = useMemo(() => z.object({
    productDescription: z.string().min(20, {
      message: t.formSchema_minChars,
    }).max(1000, {
      message: t.formSchema_maxChars,
    }),
  }), [t.formSchema_minChars, t.formSchema_maxChars]);

  const form = useForm<FormData>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      productDescription: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      // Product description for AI will remain in the language it's entered in
      const result = await optimizeListing({ productDescription: data.productDescription });
      setSuggestions(result);
    } catch (e) {
      setError(lang === 'ar' ? 'فشل في الحصول على الاقتراحات. يرجى المحاولة مرة أخرى.' : 'Failed to get suggestions. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <Card className="shadow-xl rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">{t.enhanceListingTitle}</CardTitle>
            <CardDescription>
              {t.provideDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="productDescription" className="text-base">{t.productDescriptionLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      id="productDescription"
                      placeholder={t.productDescriptionPlaceholder}
                      rows={6}
                      className="bg-card focus:ring-accent"
                      {...field}
                      aria-describedby="productDescription-message"
                    />
                  </FormControl>
                  <FormMessage id="productDescription-message" />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.optimizingButton}
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {t.getSuggestionsButton}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {error && (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle className="font-headline">{t.errorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {suggestions && suggestions.suggestedPhrases && suggestions.suggestedPhrases.length > 0 && (
        <div className="p-6 border-t">
          <h3 className="font-headline text-xl mb-4 flex items-center text-primary">
            <CheckCircle className="mr-2 h-5 w-5" />
            {t.suggestedPhrasesTitle}
          </h3>
          <ul className="list-disc list-inside space-y-2 pl-2">
            {suggestions.suggestedPhrases.map((phrase, index) => (
              <li key={index} className="text-foreground">{phrase}</li>
            ))}
          </ul>
        </div>
      )}
       {suggestions && suggestions.suggestedPhrases && suggestions.suggestedPhrases.length === 0 && !error && !isLoading && (
        <div className="p-6 border-t">
          <Alert>
            <AlertTitle className="font-headline">{t.noSuggestionsTitle}</AlertTitle>
            <AlertDescription>{t.noSuggestionsDescription}</AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}

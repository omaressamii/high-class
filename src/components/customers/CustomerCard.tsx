
import React from 'react'; // Import React
import type { Customer } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Info, UserCircle, Fingerprint, Store } from 'lucide-react';
import Link from 'next/link';

interface CustomerCardProps {
  customer: Customer;
  lang: string;
}

// Wrap component with React.memo
const CustomerCard = React.memo(function CustomerCard({ customer, lang: propLang }: CustomerCardProps) {
  const effectiveLang = propLang === 'en' ? 'en' : 'ar';
  const viewHistoryText = effectiveLang === 'ar' ? 'عرض السجل الكامل' : 'View Full History';
  const customerIdText = effectiveLang === 'ar' ? 'معرف العميل' : 'Customer ID';
  const idPassportText = effectiveLang === 'ar' ? 'رقم الهوية/جواز السفر' : 'ID/Passport';
  const branchText = effectiveLang === 'ar' ? 'الفرع' : 'Branch';

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
            <UserCircle className="h-6 w-6 mr-2 text-primary" />
            {customer.fullName}
        </CardTitle>
        <CardDescription>{customerIdText}: {customer.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2 text-primary" />
          <span>{customer.phoneNumber}</span>
        </div>
        {customer.address && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span>{customer.address}</span>
          </div>
        )}
        {customer.idCardNumber && (
            <div className="flex items-center">
                <Fingerprint className="h-4 w-4 mr-2 text-primary" />
                <span>{idPassportText}: {customer.idCardNumber}</span>
            </div>
        )}
        {customer.branchName && (
          <div className="flex items-center">
            <Store className="h-4 w-4 mr-2 text-primary" />
            <span>{branchText}: {customer.branchName}</span>
          </div>
        )}
        {customer.notes && (
          <div className="flex items-start">
            <Info className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">{customer.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground">
          <Link href={`/${effectiveLang}/customers/${customer.id}`}>
            {viewHistoryText}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});

export { CustomerCard };

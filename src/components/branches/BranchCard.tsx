
import React from 'react'; // Import React
import type { Branch } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, MapPin, Phone, Info, Settings } from 'lucide-react';
import Link from 'next/link';

interface BranchCardProps {
  branch: Branch;
  lang: string;
}

// Wrap component with React.memo
const BranchCard = React.memo(function BranchCard({ branch, lang: propLang }: BranchCardProps) {
  const lang = propLang === 'en' ? 'en' : 'ar';
  const editText = lang === 'ar' ? 'تعديل الفرع' : 'Edit Branch';
  const branchIdText = lang === 'ar' ? 'معرف الفرع' : 'Branch ID';

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
            <Store className="h-6 w-6 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
            {branch.name}
        </CardTitle>
        <CardDescription>{branchIdText}: {branch.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {branch.address && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
            <span>{branch.address}</span>
          </div>
        )}
        {branch.phoneNumber && (
            <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
                <span>{branch.phoneNumber}</span>
            </div>
        )}
        {branch.notes && (
          <div className="flex items-start">
            <Info className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">{branch.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        {/* Edit functionality can be added later if needed */}
        {/* <Button asChild variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground">
          <Link href={`/${lang}/branches/${branch.id}/edit`}>
            <Settings className="mr-2 h-4 w-4" />
            {editText}
          </Link>
        </Button> */}
        <p className="text-xs text-muted-foreground w-full text-center">
            {lang === 'ar' ? 'إدارة الفروع ستتوفر قريباً.' : 'Branch management features coming soon.'}
        </p>
      </CardFooter>
    </Card>
  );
});

export { BranchCard };

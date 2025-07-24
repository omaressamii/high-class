import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useParams } from 'next/navigation';

interface CustomerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function CustomerFilters({ searchTerm, setSearchTerm }: CustomerFiltersProps) {
  const params = useParams();
  const lang = params.lang as string;

  const title = lang === 'ar' ? 'بحث العملاء' : 'Search Customers';
  const placeholder = lang === 'ar' ? 'البحث بالاسم، الهاتف، أو الرقم التعريفي...' : 'Search by name, phone, or ID...';
  const srLabel = lang === 'ar' ? 'بحث العملاء' : 'Search Customers';


  return (
    <Card className="mb-8 shadow-md rounded-lg">
      <CardHeader className="pb-4">
         <CardTitle className="font-headline text-xl flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            {title}
          </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <Label htmlFor="customerSearch" className="sr-only">{srLabel}</Label>
          <Input
            id="customerSearch"
            type="search"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 lg:w-1/3 bg-card"
          />
        </div>
      </CardContent>
    </Card>
  );
}

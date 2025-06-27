
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle } from '@/components/shared/PageTitle';
import { Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';


export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const pageLang = params.lang as 'ar' | 'en';
  const effectiveLang = pageLang === 'en' ? 'en' : 'ar';
  const { login, isLoading: authIsLoading, currentUser } = useAuth();
  const { toast } = useToast();

  const t = {
    pageTitle: effectiveLang === 'ar' ? 'تسجيل الدخول' : 'Login',
    pageDescription: effectiveLang === 'ar' ? 'أدخل اسم المستخدم وكلمة المرور للوصول إلى حسابك.' : 'Enter your username and password to access your account.',
    usernameLabel: effectiveLang === 'ar' ? 'اسم المستخدم' : 'Username',
    usernamePlaceholder: effectiveLang === 'ar' ? 'اسم المستخدم الخاص بك' : 'Your username',
    passwordLabel: effectiveLang === 'ar' ? 'كلمة المرور' : 'Password',
    passwordPlaceholder: effectiveLang === 'ar' ? 'كلمة المرور الخاصة بك' : 'Your password',
    loginButton: effectiveLang === 'ar' ? 'تسجيل الدخول' : 'Login',
    loggingIn: effectiveLang === 'ar' ? 'جار التحقق...' : 'Logging in...',
    loginErrorTitle: effectiveLang === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Error',
    loginErrorMessage: effectiveLang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.' : 'Invalid username or password. Please try again.',
    alreadyLoggedIn: effectiveLang === 'ar' ? 'أنت مسجل الدخول بالفعل.' : 'You are already logged in.',
  };

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      router.push(`/${effectiveLang}`);
    }
  }, [currentUser, router, effectiveLang]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const success = await login(username, password);
    if (success) {
      router.push(`/${effectiveLang}`); // Redirect to dashboard
    } else {
      setError(t.loginErrorMessage);
    }
    setIsSubmitting(false);
  };
  
  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser && !authIsLoading) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] space-y-4">
        <PageTitle>{t.alreadyLoggedIn}</PageTitle>
        <Button onClick={() => router.push(`/${effectiveLang}`)}>
          {effectiveLang === 'ar' ? 'الذهاب إلى الصفحة الرئيسية' : 'Go to Dashboard'}
        </Button>
      </div>
    );
  }


  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-2xl rounded-xl">
        <CardHeader className="text-center">
          <PageTitle>{t.pageTitle}</PageTitle>
          <CardDescription>{t.pageDescription}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">{t.usernameLabel}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="text-base"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading}>
              {isSubmitting || authIsLoading ? (
                <Loader className="animate-spin mr-2" />
              ) : (
                <Loader className="mr-2" />
              )}
              {isSubmitting || authIsLoading ? t.loggingIn : t.loginButton}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

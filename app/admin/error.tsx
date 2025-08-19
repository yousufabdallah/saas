'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Admin page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">خطأ في لوحة الأدمن</CardTitle>
          <CardDescription>
            حدث خطأ في تحميل لوحة تحكم الأدمن. يرجى المحاولة مرة أخرى.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm text-gray-600 font-mono">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 ml-2" />
              المحاولة مرة أخرى
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للوحة التحكم
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              تسجيل الدخول مرة أخرى
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
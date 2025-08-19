'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">حدث خطأ</CardTitle>
          <CardDescription>
            عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
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
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
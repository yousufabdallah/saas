'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans">
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              خطأ في النظام
            </h1>
            <p className="text-gray-600 mb-6">
              حدث خطأ غير متوقع في النظام. يرجى إعادة تحميل الصفحة.
            </p>
            <div className="space-y-2">
              <button
                onClick={reset}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                المحاولة مرة أخرى
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
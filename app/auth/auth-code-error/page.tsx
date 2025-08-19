import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">خطأ في المصادقة</CardTitle>
          <CardDescription>
            حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/auth/signin">
            <Button className="w-full">
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
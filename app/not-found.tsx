import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="text-6xl font-bold text-gray-400">404</div>
          </div>
          <CardTitle className="text-2xl">الصفحة غير موجودة</CardTitle>
          <CardDescription>
            عذراً، لا يمكن العثور على الصفحة التي تبحث عنها.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Link href="/">
              <Button className="w-full">
                <Home className="h-4 w-4 ml-2" />
                العودة للصفحة الرئيسية
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                <Search className="h-4 w-4 ml-2" />
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
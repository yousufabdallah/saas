'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, User, Calendar, Mail, Shield } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  is_platform_admin?: boolean;
  stores_count?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/signin');
        return;
      }

      // التحقق من صلاحيات الأدمن
      const { data: isAdmin } = await supabase
        .rpc('check_platform_admin', { user_id: user.id });

      if (!isAdmin) {
        toast.error('ليس لديك صلاحيات للوصول إلى هذه الصفحة');
        router.push('/dashboard');
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات:', error);
      toast.error('حدث خطأ في التحقق من الصلاحيات');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // جلب المستخدمين من auth.users (يتطلب صلاحيات service role)
      // نستخدم store_members للحصول على المستخدمين النشطين
      const { data: membersData, error } = await supabase
        .from('store_members')
        .select(`
          user_id,
          created_at,
          stores (
            id,
            name
          )
        `);

      if (error) throw error;

      // تجميع المستخدمين الفريدين
      const uniqueUserIds = [...new Set(membersData?.map(m => m.user_id) || [])];
      
      // جلب أدمن المنصة
      const { data: adminData } = await supabase
        .from('platform_admins')
        .select('user_id');

      const adminIds = new Set(adminData?.map(a => a.user_id) || []);

      // إنشاء قائمة المستخدمين مع التفاصيل
      const usersWithDetails = uniqueUserIds.map(userId => {
        const userStores = membersData?.filter(m => m.user_id === userId) || [];
        const firstStore = userStores[0];
        
        return {
          id: userId,
          email: `user-${userId.slice(0, 8)}@example.com`, // placeholder
          created_at: firstStore?.created_at || new Date().toISOString(),
          is_platform_admin: adminIds.has(userId),
          stores_count: userStores.length,
        };
      });

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
      toast.error('حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        // إزالة صلاحيات الأدمن
        const { error } = await supabase
          .from('platform_admins')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
        toast.success('تم إزالة صلاحيات الأدمن بنجاح');
      } else {
        // إضافة صلاحيات الأدمن
        const { error } = await supabase
          .from('platform_admins')
          .insert({ user_id: userId });

        if (error) throw error;
        toast.success('تم إضافة صلاحيات الأدمن بنجاح');
      }

      await loadUsers();
    } catch (error) {
      console.error('خطأ في تغيير صلاحيات الأدمن:', error);
      toast.error('حدث خطأ في تغيير صلاحيات الأدمن');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button variant="ghost" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
                <p className="text-gray-600 mt-1">
                  عرض وإدارة حسابات المستخدمين في المنصة
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge variant="secondary">
                إجمالي المستخدمين: {users.length}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                أدمن المنصة: {users.filter(u => u.is_platform_admin).length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">
                      {user.email.split('@')[0]}
                    </CardTitle>
                  </div>
                  {user.is_platform_admin && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Shield className="h-3 w-3 ml-1" />
                      أدمن
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  ID: {user.id.slice(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>البريد الإلكتروني</span>
                    </div>
                    <span className="font-medium text-xs">
                      {user.email.length > 20 ? user.email.slice(0, 20) + '...' : user.email}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>تاريخ التسجيل</span>
                    </div>
                    <span className="font-medium">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>عدد المتاجر</span>
                    <Badge variant="outline">
                      {user.stores_count}
                    </Badge>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant={user.is_platform_admin ? "destructive" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => toggleAdminStatus(user.id, user.is_platform_admin || false)}
                    >
                      {user.is_platform_admin ? 'إزالة صلاحيات الأدمن' : 'إضافة صلاحيات الأدمن'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد مستخدمين
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'لم يتم العثور على مستخدمين يطابقون البحث' : 'لم يتم تسجيل أي مستخدمين بعد'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, User, Calendar, Mail, Shield, Plus, Store, Activity, Eye } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface RegisteredUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  is_platform_admin: boolean;
  has_store: boolean;
  store_name?: string;
  store_active?: boolean;
  last_activity?: string;
}

interface UserActivity {
  id: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    customerEmail: '',
    storeName: '',
    plan: 'basic',
    notes: '',
  });
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
      
      // استخدام الدالة الجديدة لجلب جميع المستخدمين المسجلين
      const { data: usersData, error } = await supabase
        .rpc('get_all_registered_users');

      if (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        // استخدام بيانات افتراضية في حالة الخطأ
        setUsers([
          {
            user_id: 'demo-user-1',
            email: 'user1@example.com',
            created_at: new Date().toISOString(),
            is_platform_admin: false,
            has_store: true,
            store_name: 'متجر تجريبي',
            store_active: true,
          },
          {
            user_id: 'demo-user-2',
            email: 'admin@example.com',
            created_at: new Date().toISOString(),
            is_platform_admin: true,
            has_store: false,
          }
        ]);
        toast.error('تم تحميل بيانات تجريبية - تحقق من إعدادات قاعدة البيانات');
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
      toast.error('حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async (userId: string) => {
    try {
      const { data: activityData, error } = await supabase
        .rpc('get_user_activity', { target_user_id: userId });

      if (error) {
        console.error('خطأ في تحميل نشاط المستخدم:', error);
        setUserActivity([]);
        return;
      }

      setUserActivity(activityData || []);
    } catch (error) {
      console.error('خطأ في تحميل نشاط المستخدم:', error);
      setUserActivity([]);
    }
  };

  const toggleAdminStatus = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const { data, error } = await supabase
        .rpc('toggle_admin_status', { 
          target_user_id: userId, 
          is_admin: !isCurrentlyAdmin 
        });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
      } else {
        toast.error(data?.message || 'حدث خطأ في تغيير صلاحيات الأدمن');
      }

      await loadUsers();
    } catch (error) {
      console.error('خطأ في تغيير صلاحيات الأدمن:', error);
      toast.error('حدث خطأ في تغيير صلاحيات الأدمن');
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .rpc('create_store_for_user', {
          customer_email: storeFormData.customerEmail,
          store_name: storeFormData.storeName,
          store_plan: storeFormData.plan,
          admin_notes: storeFormData.notes || null,
        });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
        setShowCreateStore(false);
        setStoreFormData({
          customerEmail: '',
          storeName: '',
          plan: 'basic',
          notes: '',
        });
        await loadUsers();
      } else {
        toast.error(data?.message || 'حدث خطأ في إنشاء المتجر');
      }
    } catch (error) {
      console.error('خطأ في إنشاء المتجر:', error);
      toast.error('حدث خطأ في إنشاء المتجر');
    }
  };

  const viewUserDetails = async (user: RegisteredUser) => {
    setSelectedUser(user);
    await loadUserActivity(user.user_id);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return '🔑';
      case 'logout':
        return '🚪';
      case 'register':
        return '📝';
      case 'store_created':
        return '🏪';
      case 'product_added':
        return '📦';
      case 'order_placed':
        return '🛒';
      default:
        return '📋';
    }
  };

  const getActivityLabel = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return 'تسجيل دخول';
      case 'logout':
        return 'تسجيل خروج';
      case 'register':
        return 'تسجيل حساب';
      case 'store_created':
        return 'إنشاء متجر';
      case 'product_added':
        return 'إضافة منتج';
      case 'order_placed':
        return 'طلب جديد';
      default:
        return 'نشاط';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.store_name && user.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                  تتبع جميع المستخدمين المسجلين وإدارة متاجرهم
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateStore(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء متجر لعميل
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Store Form */}
        {showCreateStore && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>إنشاء متجر جديد لعميل</CardTitle>
              <CardDescription>
                إنشاء متجر للعميل بدون الحاجة للدفع
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerEmail">بريد العميل</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={storeFormData.customerEmail}
                      onChange={(e) => setStoreFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="storeName">اسم المتجر</Label>
                    <Input
                      id="storeName"
                      value={storeFormData.storeName}
                      onChange={(e) => setStoreFormData(prev => ({ ...prev, storeName: e.target.value }))}
                      placeholder="متجر العميل"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="plan">خطة الاشتراك</Label>
                  <select
                    id="plan"
                    value={storeFormData.plan}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, plan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="basic">أساسية</option>
                    <option value="pro">احترافية</option>
                    <option value="enterprise">مؤسسية</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                  <Input
                    id="notes"
                    value={storeFormData.notes}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="ملاحظات حول إنشاء المتجر"
                  />
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button type="submit">
                    <Store className="h-4 w-4 ml-2" />
                    إنشاء المتجر
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateStore(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                لديهم متاجر: {users.filter(u => u.has_store).length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.user_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">
                      {user.email.split('@')[0]}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {user.is_platform_admin && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Shield className="h-3 w-3 ml-1" />
                        أدمن
                      </Badge>
                    )}
                    {user.has_store && (
                      <Badge className={user.store_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        <Store className="h-3 w-3 ml-1" />
                        {user.store_active ? 'متجر نشط' : 'متجر غير نشط'}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  ID: {user.user_id.slice(0, 8)}...
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

                  {user.last_sign_in_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span>آخر تسجيل دخول</span>
                      <span className="font-medium">
                        {new Date(user.last_sign_in_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  )}

                  {user.has_store && user.store_name && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-900">
                        المتجر: {user.store_name}
                      </p>
                      <p className="text-xs text-blue-700">
                        الحالة: {user.store_active ? 'نشط' : 'غير نشط'}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewUserDetails(user)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        عرض التفاصيل
                      </Button>
                      <Button
                        variant={user.is_platform_admin ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleAdminStatus(user.user_id, user.is_platform_admin)}
                        className="flex-1"
                      >
                        {user.is_platform_admin ? 'إزالة أدمن' : 'جعل أدمن'}
                      </Button>
                    </div>
                    
                    {!user.has_store && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setStoreFormData(prev => ({ ...prev, customerEmail: user.email }));
                          setShowCreateStore(true);
                        }}
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        إنشاء متجر
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>تفاصيل المستخدم</CardTitle>
                  <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                    ✕
                  </Button>
                </div>
                <CardDescription>
                  {selectedUser.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* User Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">معلومات المستخدم</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono ml-2">{selectedUser.user_id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">البريد:</span>
                        <span className="ml-2">{selectedUser.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">تاريخ التسجيل:</span>
                        <span className="ml-2">{new Date(selectedUser.created_at).toLocaleString('ar-SA')}</span>
                      </div>
                      {selectedUser.last_sign_in_at && (
                        <div>
                          <span className="text-gray-600">آخر دخول:</span>
                          <span className="ml-2">{new Date(selectedUser.last_sign_in_at).toLocaleString('ar-SA')}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">تأكيد البريد:</span>
                        <span className="ml-2">
                          {selectedUser.email_confirmed_at ? 'مؤكد' : 'غير مؤكد'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">نوع الحساب:</span>
                        <span className="ml-2">
                          {selectedUser.is_platform_admin ? 'أدمن منصة' : 'عميل'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Store Info */}
                  {selectedUser.has_store && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">معلومات المتجر</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="font-medium text-blue-900">
                          {selectedUser.store_name}
                        </p>
                        <p className="text-sm text-blue-700">
                          الحالة: {selectedUser.store_active ? 'نشط' : 'غير نشط'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Activity Log */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Activity className="h-5 w-5 ml-2" />
                      سجل النشاط
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {userActivity.length > 0 ? (
                        userActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
                            <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {getActivityLabel(activity.activity_type)}
                              </p>
                              {activity.description && (
                                <p className="text-xs text-gray-600">
                                  {activity.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleString('ar-SA')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">لا يوجد نشاط مسجل</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
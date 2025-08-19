'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, Users, Plus, Eye, Shield, Store, Calendar, Mail, Activity } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface User {
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [createStoreLoading, setCreateStoreLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [storeForm, setStoreForm] = useState({
    customerEmail: '',
    storeName: '',
    plan: 'basic',
    notes: '',
  });

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
      // تحميل بيانات افتراضية في حالة الخطأ
      await loadUsersWithFallback();
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // محاولة استخدام الدالة الآمنة أولاً
      const { data, error } = await supabase.rpc('get_all_registered_users');

      if (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        await loadUsersWithFallback();
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
      await loadUsersWithFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadUsersWithFallback = async () => {
    try {
      // استعلامات مباشرة كبديل
      const [storesResult, membersResult] = await Promise.all([
        supabase.from('stores').select('id, name, owner_user_id, active, created_at'),
        supabase.from('store_members').select('user_id, store_id, created_at'),
      ]);

      const stores = storesResult.data || [];
      const members = membersResult.data || [];

      // إنشاء قائمة المستخدمين من البيانات المتاحة
      const userMap = new Map();
      
      members.forEach(member => {
        if (!userMap.has(member.user_id)) {
          const userStore = stores.find(s => s.owner_user_id === member.user_id);
          userMap.set(member.user_id, {
            user_id: member.user_id,
            email: `user-${member.user_id.slice(0, 8)}@example.com`,
            created_at: member.created_at,
            last_sign_in_at: null,
            email_confirmed_at: member.created_at,
            is_platform_admin: false,
            has_store: !!userStore,
            store_name: userStore?.name,
            store_active: userStore?.active,
            last_activity: member.created_at,
          });
        }
      });

      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error('خطأ في تحميل البيانات الاحتياطية:', error);
      setUsers([]);
    }
  };

  const loadUserActivity = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_activity', { target_user_id: userId });

      if (error) {
        console.error('خطأ في تحميل نشاط المستخدم:', error);
        setUserActivity([]);
        return;
      }

      setUserActivity(data || []);
    } catch (error) {
      console.error('خطأ في تحميل نشاط المستخدم:', error);
      setUserActivity([]);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStoreLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_store_for_user', {
        customer_email: storeForm.customerEmail,
        store_name: storeForm.storeName,
        store_plan: storeForm.plan,
        admin_notes: storeForm.notes,
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        setShowCreateStore(false);
        setStoreForm({
          customerEmail: '',
          storeName: '',
          plan: 'basic',
          notes: '',
        });
        await loadUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('خطأ في إنشاء المتجر:', error);
      toast.error('حدث خطأ في إنشاء المتجر');
    } finally {
      setCreateStoreLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase.rpc('toggle_admin_status_safe', {
        target_user_id: userId,
        is_admin: !currentStatus,
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        await loadUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('خطأ في تغيير صلاحيات الأدمن:', error);
      toast.error('حدث خطأ في تغيير صلاحيات الأدمن');
    }
  };

  const viewUserDetails = async (user: User) => {
    setSelectedUser(user);
    await loadUserActivity(user.user_id);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.store_name && user.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActivityTypeLabel = (type: string) => {
    const types = {
      'login': 'تسجيل دخول',
      'logout': 'تسجيل خروج',
      'register': 'تسجيل حساب',
      'store_created': 'إنشاء متجر',
      'product_added': 'إضافة منتج',
      'order_placed': 'طلب جديد',
    };
    return types[type as keyof typeof types] || type;
  };

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
                  عرض جميع المستخدمين المسجلين وإنشاء متاجر لهم
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateStore(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء متجر للعميل
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
              <CardTitle>إنشاء متجر جديد للعميل</CardTitle>
              <CardDescription>
                إنشاء متجر مجاني لأي عميل مسجل في المنصة
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
                      value={storeForm.customerEmail}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="storeName">اسم المتجر</Label>
                    <Input
                      id="storeName"
                      value={storeForm.storeName}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, storeName: e.target.value }))}
                      placeholder="متجر العميل"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="plan">خطة الاشتراك</Label>
                  <select
                    id="plan"
                    value={storeForm.plan}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, plan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="basic">أساسية (29 ر.س/شهر)</option>
                    <option value="pro">احترافية (79 ر.س/شهر)</option>
                    <option value="enterprise">مؤسسية (159 ر.س/شهر)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                  <Input
                    id="notes"
                    value={storeForm.notes}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="سبب إنشاء المتجر أو ملاحظات خاصة"
                  />
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button type="submit" disabled={createStoreLoading}>
                    {createStoreLoading ? 'جار الإنشاء...' : 'إنشاء المتجر'}
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
                أدمن: {users.filter(u => u.is_platform_admin).length}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                لديهم متاجر: {users.filter(u => u.has_store).length}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                بدون متاجر: {users.filter(u => !u.has_store).length}
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
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg truncate">{user.email}</CardTitle>
                  </div>
                  {user.is_platform_admin && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Shield className="h-3 w-3 ml-1" />
                      أدمن
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  ID: {user.user_id.slice(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <span>آخر دخول</span>
                      </div>
                      <span className="font-medium">
                        {new Date(user.last_sign_in_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>تأكيد البريد</span>
                    </div>
                    <Badge className={user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {user.email_confirmed_at ? 'مؤكد' : 'غير مؤكد'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Store className="h-4 w-4 text-gray-500" />
                      <span>المتجر</span>
                    </div>
                    {user.has_store ? (
                      <div className="text-right">
                        <p className="font-medium text-sm">{user.store_name}</p>
                        <Badge className={user.store_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.store_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        لا يوجد متجر
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewUserDetails(user)}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      التفاصيل
                    </Button>
                    
                    {!user.has_store && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStoreForm(prev => ({ ...prev, customerEmail: user.email }));
                          setShowCreateStore(true);
                        }}
                      >
                        <Store className="h-4 w-4 ml-1" />
                        إنشاء متجر
                      </Button>
                    )}
                    
                    <Button
                      variant={user.is_platform_admin ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleAdminStatus(user.user_id, user.is_platform_admin)}
                    >
                      <Shield className="h-4 w-4 ml-1" />
                      {user.is_platform_admin ? 'إزالة أدمن' : 'جعل أدمن'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد مستخدمين
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'لم يتم العثور على مستخدمين يطابقون البحث' : 'لم يسجل أي مستخدم بعد'}
            </p>
          </div>
        )}

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
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>البريد الإلكتروني</Label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label>معرف المستخدم</Label>
                      <p className="font-mono text-sm">{selectedUser.user_id}</p>
                    </div>
                    <div>
                      <Label>تاريخ التسجيل</Label>
                      <p className="font-medium">
                        {new Date(selectedUser.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div>
                      <Label>آخر تسجيل دخول</Label>
                      <p className="font-medium">
                        {selectedUser.last_sign_in_at 
                          ? new Date(selectedUser.last_sign_in_at).toLocaleDateString('ar-SA')
                          : 'لم يسجل دخول بعد'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Store Info */}
                  {selectedUser.has_store && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">معلومات المتجر</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-blue-700">اسم المتجر: </span>
                          <span className="font-medium">{selectedUser.store_name}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">الحالة: </span>
                          <Badge className={selectedUser.store_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {selectedUser.store_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Activity */}
                  <div>
                    <h4 className="font-medium mb-4">سجل النشاط</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {userActivity.length > 0 ? (
                        userActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">
                                {getActivityTypeLabel(activity.activity_type)}
                              </p>
                              {activity.description && (
                                <p className="text-xs text-gray-600">{activity.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleDateString('ar-SA')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleTimeString('ar-SA')}
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
      </div>
    </div>
  );
}
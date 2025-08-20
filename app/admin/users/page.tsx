'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, Users, Calendar, Mail, Store, Plus, Shield, UserCheck } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

interface RealUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  is_platform_admin: boolean;
  has_store: boolean;
  store_name?: string;
  store_active?: boolean;
  store_plan?: string;
  last_activity?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateStoreForm, setShowCreateStoreForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RealUser | null>(null);
  const [storeFormData, setStoreFormData] = useState({
    storeName: '',
    storePlan: 'basic',
  });
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      console.log('🔍 [USERS PAGE] فحص المستخدم...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('❌ [USERS PAGE] المستخدم غير مسجل دخول');
        router.push('/auth/signin');
        return;
      }

      console.log('✅ [USERS PAGE] المستخدم مسجل دخول:', user.email);

      // التحقق من صلاحيات الأدمن
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('check_platform_admin', { user_id: user.id });

      if (adminError || !isAdmin) {
        console.log('❌ [USERS PAGE] المستخدم ليس أدمن منصة');
        toast.error('ليس لديك صلاحيات للوصول إلى هذه الصفحة');
        router.push('/dashboard');
        return;
      }

      console.log('✅ [USERS PAGE] المستخدم أدمن منصة مؤكد');
      await loadRealUsers();
    } catch (error) {
      console.error('❌ [USERS PAGE] خطأ في التحقق من الصلاحيات:', error);
      toast.error('حدث خطأ في التحقق من الصلاحيات');
    }
  };

  const loadRealUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 [USERS PAGE] تحميل المستخدمين الحقيقيين...');
      
      // استخدام الدالة الجديدة للمستخدمين الحقيقيين
      const { data: realUsers, error } = await supabase.rpc('get_all_real_users');

      if (error) {
        console.error('❌ [USERS PAGE] خطأ في تحميل المستخدمين:', error);
        toast.error('حدث خطأ في تحميل المستخدمين: ' + error.message);
        setUsers([]);
        return;
      }

      console.log('✅ [USERS PAGE] تم تحميل المستخدمين الحقيقيين:', realUsers?.length || 0);
      console.log('📋 [USERS PAGE] قائمة المستخدمين:', realUsers);

      setUsers(realUsers || []);

      if (!realUsers || realUsers.length === 0) {
        console.log('⚠️ [USERS PAGE] لا توجد تسجيلات حقيقية');
        toast.info('لا توجد تسجيلات حقيقية بعد. سجل حساب جديد لرؤيته هنا.');
      }
    } catch (error) {
      console.error('❌ [USERS PAGE] خطأ في تحميل المستخدمين:', error);
      toast.error('حدث خطأ في تحميل المستخدمين');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('يرجى اختيار مستخدم');
      return;
    }

    try {
      console.log('🏪 [USERS PAGE] إنشاء متجر للمستخدم:', selectedUser.email);
      
      const { data: result, error } = await supabase.rpc('create_free_store_for_user', {
        customer_email: selectedUser.email,
        store_name: storeFormData.storeName,
        store_plan: storeFormData.storePlan,
      });

      if (error) {
        console.error('❌ [USERS PAGE] خطأ في إنشاء المتجر:', error);
        toast.error('حدث خطأ في إنشاء المتجر: ' + error.message);
        return;
      }

      console.log('✅ [USERS PAGE] نتيجة إنشاء المتجر:', result);

      if (result?.success) {
        toast.success(result.message);
        setShowCreateStoreForm(false);
        setSelectedUser(null);
        setStoreFormData({ storeName: '', storePlan: 'basic' });
        await loadRealUsers();
      } else {
        toast.error(result?.message || 'فشل في إنشاء المتجر');
      }
    } catch (error) {
      console.error('❌ [USERS PAGE] خطأ في إنشاء المتجر:', error);
      toast.error('حدث خطأ في إنشاء المتجر');
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      console.log('🔧 [USERS PAGE] تغيير صلاحيات الأدمن للمستخدم:', userId);
      
      const { data: result, error } = await supabase.rpc('toggle_admin_status', {
        target_user_id: userId,
        is_admin: !currentStatus,
      });

      if (error) {
        console.error('❌ [USERS PAGE] خطأ في تغيير صلاحيات الأدمن:', error);
        toast.error('حدث خطأ في تغيير صلاحيات الأدمن');
        return;
      }

      console.log('✅ [USERS PAGE] نتيجة تغيير الصلاحيات:', result);

      if (result?.success) {
        toast.success(result.message);
        await loadRealUsers();
      } else {
        toast.error(result?.message || 'فشل في تغيير الصلاحيات');
      }
    } catch (error) {
      console.error('❌ [USERS PAGE] خطأ في تغيير صلاحيات الأدمن:', error);
      toast.error('حدث خطأ في تغيير صلاحيات الأدمن');
    }
  };

  const openCreateStoreForm = (user: RealUser) => {
    setSelectedUser(user);
    setStoreFormData({
      storeName: `متجر ${user.email.split('@')[0]}`,
      storePlan: 'basic',
    });
    setShowCreateStoreForm(true);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanName = (plan?: string) => {
    switch (plan) {
      case 'pro':
        return 'احترافية';
      case 'enterprise':
        return 'مؤسسية';
      default:
        return 'أساسية';
    }
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
                  جميع المستخدمين المسجلين في المنصة
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Store Form */}
        {showCreateStoreForm && selectedUser && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>إنشاء متجر مجاني للمستخدم</CardTitle>
              <CardDescription>
                إنشاء متجر مجاني للمستخدم: {selectedUser.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div>
                  <Label htmlFor="storeName">اسم المتجر</Label>
                  <Input
                    id="storeName"
                    value={storeFormData.storeName}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, storeName: e.target.value }))}
                    placeholder="اسم المتجر"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="storePlan">خطة المتجر</Label>
                  <select
                    id="storePlan"
                    value={storeFormData.storePlan}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, storePlan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="basic">أساسية</option>
                    <option value="pro">احترافية</option>
                    <option value="enterprise">مؤسسية</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button type="submit">
                    إنشاء المتجر المجاني
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateStoreForm(false);
                      setSelectedUser(null);
                    }}
                  >
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
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                لديهم متاجر: {users.filter(u => u.has_store).length}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                بدون متاجر: {users.filter(u => !u.has_store).length}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                أدمن: {users.filter(u => u.is_platform_admin).length}
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
                    <CardTitle className="text-lg">{user.email}</CardTitle>
                  </div>
                  {user.is_platform_admin && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Shield className="h-3 w-3 ml-1" />
                      أدمن
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  مستخدم #{user.user_id.slice(0, 8)}
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
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>تأكيد البريد</span>
                    </div>
                    <Badge className={user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {user.email_confirmed_at ? 'مؤكد' : 'غير مؤكد'}
                    </Badge>
                  </div>

                  {user.last_sign_in_at && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <UserCheck className="h-4 w-4 text-gray-500" />
                        <span>آخر دخول</span>
                      </div>
                      <span className="font-medium">
                        {new Date(user.last_sign_in_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  )}

                  {/* Store Status */}
                  <div className="border-t pt-3">
                    {user.has_store ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">المتجر:</span>
                          <Badge className="bg-green-100 text-green-800">
                            <Store className="h-3 w-3 ml-1" />
                            موجود
                          </Badge>
                        </div>
                        {user.store_name && (
                          <p className="text-sm text-gray-600">
                            <strong>الاسم:</strong> {user.store_name}
                          </p>
                        )}
                        {user.store_plan && (
                          <p className="text-sm text-gray-600">
                            <strong>الخطة:</strong> {getPlanName(user.store_plan)}
                          </p>
                        )}
                        <Badge className={user.store_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.store_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">المتجر:</span>
                          <Badge className="bg-red-100 text-red-800">
                            غير موجود
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => openCreateStoreForm(user)}
                        >
                          <Plus className="h-4 w-4 ml-2" />
                          إنشاء متجر مجاني
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  <div className="border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => toggleAdminStatus(user.user_id, user.is_platform_admin)}
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
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {users.length === 0 ? 'لا توجد تسجيلات حقيقية' : 'لا توجد نتائج للبحث'}
            </h3>
            <p className="text-gray-600 mb-4">
              {users.length === 0 
                ? 'لم يسجل أي مستخدم حقيقي بعد. سجل حساب جديد من صفحة التسجيل لرؤيته هنا.'
                : 'لم يتم العثور على مستخدمين يطابقون البحث'
              }
            </p>
            {users.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  💡 نصائح:
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• اذهب إلى /auth/signin وسجل حساب جديد</li>
                  <li>• تأكد من تفعيل المصادقة بالبريد في Supabase</li>
                  <li>• تأكد من إلغاء تفعيل تأكيد البريد الإلكتروني</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
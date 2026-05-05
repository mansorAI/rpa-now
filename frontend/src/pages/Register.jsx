import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Bot } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await registerUser(data.full_name, data.email, data.password);
      toast.success('تم إنشاء حسابك بنجاح!');
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ابدأ مجاناً</h1>
          <p className="text-slate-400 mt-1 text-sm">أنشئ حسابك وابدأ الأتمتة الآن</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">إنشاء حساب جديد</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">الاسم الكامل</label>
              <input {...register('full_name', { required: 'الاسم مطلوب' })} placeholder="محمد أحمد" className="input" />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">البريد الإلكتروني</label>
              <input {...register('email', { required: 'البريد مطلوب' })} type="email" placeholder="example@email.com" className="input" dir="ltr" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">كلمة المرور</label>
              <input {...register('password', { required: true, minLength: { value: 8, message: '8 أحرف على الأقل' } })} type="password" placeholder="••••••••" className="input" dir="ltr" />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">تأكيد كلمة المرور</label>
              <input
                {...register('confirm', { validate: v => v === watch('password') || 'كلمات المرور غير متطابقة' })}
                type="password" placeholder="••••••••" className="input" dir="ltr"
              />
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center mt-2">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'إنشاء الحساب'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            لديك حساب؟ <Link to="/login" className="text-primary-400 hover:underline">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

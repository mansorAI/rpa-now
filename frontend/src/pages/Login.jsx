import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success('مرحباً بك!');
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">الأتمتة الذكية</h1>
          <p className="text-slate-400 mt-1 text-sm">أتمت أعمالك بالذكاء الاصطناعي</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">البريد الإلكتروني</label>
              <input
                {...register('email', { required: 'البريد مطلوب' })}
                type="email"
                placeholder="example@email.com"
                className="input"
                dir="ltr"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'كلمة المرور مطلوبة' })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pl-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center mt-2">
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-primary-400 hover:underline">إنشاء حساب</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

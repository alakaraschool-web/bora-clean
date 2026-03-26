import { motion } from 'motion/react';
import { GraduationCap, ShieldAlert, BookOpen, Users, ArrowLeft, ShieldCheck, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export const LoginChoice = () => {
  const portals = [
    {
      title: 'Principal Portal',
      description: 'Institutional leadership, staff oversight, and school-wide performance tracking.',
      icon: ShieldCheck,
      path: '/principal-login',
      color: 'bg-kenya-black',
      hoverColor: 'hover:bg-gray-800',
    },
    {
      title: 'Teacher Portal',
      description: 'Manage classes, create exams, grade papers, and track student progress.',
      icon: BookOpen,
      path: '/teacher-login',
      color: 'bg-kenya-green',
      hoverColor: 'hover:bg-green-700',
    },
    {
      title: 'Student Portal',
      description: 'Access exams, view results, download resources, and track your learning.',
      icon: Users,
      path: '/student-login',
      color: 'bg-kenya-red',
      hoverColor: 'hover:bg-red-700',
    },
    {
      title: 'Super Admin',
      description: 'Central command for system-wide management, school approvals, and analytics.',
      icon: ShieldAlert,
      path: '/super-admin',
      color: 'bg-kenya-red',
      hoverColor: 'hover:bg-red-900',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '40px 40px' }} />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-6xl relative z-10 px-4">
        <Link to="/" className="flex items-center justify-center gap-2 mb-12 group">
          <div className="bg-kenya-green p-2 rounded-lg group-hover:scale-110 transition-transform">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-kenya-black tracking-tight">Bora School <span className="text-kenya-red">KE</span></span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-kenya-black mb-4">Select Your Portal</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Choose the appropriate access point or register your school to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map((portal, index) => (
            <motion.div
              key={portal.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                to={portal.path}
                className="flex flex-col h-full bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl ${portal.color} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                  <portal.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-kenya-black mb-3">{portal.title}</h3>
                <p className="text-sm text-gray-500 mb-8 flex-1">
                  {portal.description}
                </p>
                <div className={`w-full py-3 rounded-xl text-center font-bold text-white transition-colors ${portal.color} ${portal.hoverColor}`}>
                  Enter Portal
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-kenya-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

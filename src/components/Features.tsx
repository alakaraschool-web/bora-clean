import { motion } from 'motion/react';
import { 
  FileText, 
  BarChart3, 
  Users, 
  Cloud, 
  Download, 
  Lock, 
  CheckSquare, 
  Globe 
} from 'lucide-react';

const features = [
  {
    title: 'Online Exam Creation',
    description: 'Create complex exams with multiple question types, time limits, and rich media support.',
    icon: FileText,
    color: 'bg-kenya-green/10 text-kenya-green',
  },
  {
    title: 'Automated Grading',
    description: 'Save hundreds of hours with instant grading for objective questions and AI-assisted scoring.',
    icon: CheckSquare,
    color: 'bg-kenya-red/10 text-kenya-red',
  },
  {
    title: 'Real-time Analytics',
    description: 'Deep dive into student performance with visual charts and comprehensive reports.',
    icon: BarChart3,
    color: 'bg-kenya-black/10 text-kenya-black',
  },
  {
    title: 'Role-based Access',
    description: 'Secure portals for Admins, Teachers, and Students with granular permission control.',
    icon: Users,
    color: 'bg-kenya-green/10 text-kenya-green',
  },
  {
    title: 'Secure Cloud Storage',
    description: 'All data is encrypted and stored securely on Supabase, accessible from anywhere.',
    icon: Cloud,
    color: 'bg-kenya-red/10 text-kenya-red',
  },
  {
    title: 'Export Results',
    description: 'Generate professional PDF or CSV reports for individual students or entire classes.',
    icon: Download,
    color: 'bg-kenya-black/10 text-kenya-black',
  },
  {
    title: 'Anti-Cheat Security',
    description: 'Advanced proctoring tools including browser lockdown and random question shuffling.',
    icon: Lock,
    color: 'bg-kenya-green/10 text-kenya-green',
  },
  {
    title: 'Multi-school Support',
    description: 'Manage multiple branches or schools from a single unified administrative dashboard.',
    icon: Globe,
    color: 'bg-kenya-red/10 text-kenya-red',
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-gray-50 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '40px 40px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-kenya-red font-semibold tracking-wide uppercase text-sm mb-3">Features</h2>
          <p className="text-4xl font-bold text-kenya-black mb-4">Everything You Need to Manage Exams</p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful tools designed for modern educators to streamline the entire examination lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

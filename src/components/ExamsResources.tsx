import { motion } from 'motion/react';
import { FileText, Download, BookOpen, Search, Filter } from 'lucide-react';
import { Button } from './Button';
import { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

export const ExamsResources = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicMaterials = async () => {
      try {
        const data = await supabaseService.getExamMaterials();
        // Filter for public and approved materials
        const publicMaterials = data.filter((m: any) => m.visibility === 'Public' && m.status === 'Approved');
        setMaterials(publicMaterials);
      } catch (error) {
        console.error('Error fetching public materials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicMaterials();
  }, []);

  const resources = [
    {
      title: 'KJSEA Corner',
      category: 'KJSEA Corner',
      count: materials.filter(m => m.category === 'KJSEA Corner').length || '150+',
      icon: FileText,
      color: 'bg-kenya-green/10 text-kenya-green',
    },
    {
      title: 'KPSEA Corner',
      category: 'KPSEA Corner',
      count: materials.filter(m => m.category === 'KPSEA Corner').length || '200+',
      icon: BookOpen,
      color: 'bg-kenya-red/10 text-kenya-red',
    },
    {
      title: 'Schemes of Work',
      category: 'Schemes of Work',
      count: materials.filter(m => m.category === 'Schemes of Work').length || '100+',
      icon: Download,
      color: 'bg-kenya-black/10 text-kenya-black',
    },
    {
      title: 'KCSE Resources',
      category: 'KCSE Resources',
      count: materials.filter(m => m.category === 'KCSE Resources').length || '80+',
      icon: Search,
      color: 'bg-kenya-green/10 text-kenya-green',
    },
  ];
  return (
    <section id="exams-resources" className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '50px 50px' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-kenya-red font-semibold tracking-wide uppercase text-sm mb-3">Learning Hub</h2>
            <p className="text-4xl font-bold text-kenya-black mb-4">Exams & Resources</p>
            <p className="text-lg text-gray-600">
              Access a comprehensive library of Kenyan educational materials. From past papers to revision notes, we've got everything learners need to excel.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green transition-all"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${resource.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <resource.icon className="w-7 h-7" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{resource.category}</p>
              <h3 className="text-xl font-bold text-kenya-black mb-2">{resource.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{resource.count} available for download.</p>
              <button className="text-kenya-green font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                Browse Collection
                <Download className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-2xl font-bold text-kenya-black mb-6">Available Resources</h3>
          <div className="space-y-4">
            {materials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-bold text-kenya-black">{material.title}</p>
                  <p className="text-sm text-gray-500">{material.category}</p>
                </div>
                <a href={material.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-kenya-green font-bold text-sm">
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-kenya-black rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-kenya-red/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold mb-4">Are you a teacher with quality resources?</h3>
              <p className="text-gray-400">
                Join our contributor network and share your revision notes or past papers with thousands of students across Kenya.
              </p>
            </div>
            <Button variant="primary" size="lg" className="whitespace-nowrap">
              Become a Contributor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

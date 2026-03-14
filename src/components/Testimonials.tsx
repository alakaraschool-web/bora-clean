import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

const defaultTestimonials = [
  {
    id: '1',
    name: 'Dr. Sarah Jenkins',
    role: 'Principal, Oakwood Academy',
    content: 'Alakara KE has completely transformed how we handle end-of-term examinations. The automated grading alone has saved our teachers hundreds of hours.',
    image: 'https://picsum.photos/seed/sarah/100/100',
  },
  {
    id: '2',
    name: 'Mark Thompson',
    role: 'Exam Officer, City High School',
    content: 'The real-time analytics provide insights we never had before. We can now identify struggling students instantly and provide targeted support.',
    image: 'https://picsum.photos/seed/mark/100/100',
  },
  {
    id: '3',
    name: 'Linda Chen',
    role: 'IT Director, Global International',
    content: 'Integration was seamless. The Supabase-backed infrastructure gives us peace of mind regarding data security and system reliability.',
    image: 'https://picsum.photos/seed/linda/100/100',
  },
];

export const Testimonials = () => {
  const [testimonials, setTestimonials] = useState(defaultTestimonials);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const data = await supabaseService.getSuccessStories();
        if (data && data.length > 0) {
          setTestimonials(data.map((s: any) => ({
            id: s.id,
            name: s.author_name,
            role: s.title,
            content: s.content,
            image: s.image_url || `https://picsum.photos/seed/${s.author_name}/100/100`
          })));
        } else {
          // Fallback to local storage if no data in Supabase
          const saved = localStorage.getItem('alakara_success_stories');
          if (saved) {
            setTestimonials(JSON.parse(saved));
          }
        }
      } catch (error) {
        console.error('Error fetching success stories:', error);
      }
    };
    fetchStories();
  }, []);

  return (
    <section id="testimonials" className="py-24 bg-gray-50 relative">
      <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '80px 80px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-kenya-green font-semibold tracking-wide uppercase text-sm mb-3">Success Stories</h2>
          <p className="text-4xl font-bold text-kenya-black mb-4">Trusted by Leading Kenyan Educators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t: any) => (
            <div key={t.id || t.name} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-kenya-red text-kenya-red" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-8 leading-relaxed">"{t.content}"</p>
              <div className="flex items-center gap-4">
                <img
                  src={t.image || `https://picsum.photos/seed/${t.name}/100/100`}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

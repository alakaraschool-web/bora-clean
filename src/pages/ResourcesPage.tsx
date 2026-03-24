import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Download, ArrowLeft } from 'lucide-react';

export const ResourcesPage = () => {
  const { category } = useParams<{ category: string }>();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await supabaseService.getExamMaterials();
        const filteredMaterials = data.filter((m: any) => m.category === category && m.visibility === 'Public' && m.status === 'Approved');
        setMaterials(filteredMaterials);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-kenya-green font-bold mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-kenya-black mb-8">{category}</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <div key={material.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-kenya-black mb-2">{material.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{material.file_type}</p>
                <a href={material.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-kenya-green font-bold text-sm">
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

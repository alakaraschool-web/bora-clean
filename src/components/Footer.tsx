import { GraduationCap, Facebook, Twitter, Linkedin, Instagram, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="bg-kenya-green p-2 rounded-lg group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Bora School <span className="text-kenya-red">KE</span></span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The leading cloud-based exam management system for modern Kenyan schools. Automate grading, track performance, and publish results with ease.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-kenya-red transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-kenya-green transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-kenya-red transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="hover:text-kenya-green transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#exams-resources" className="hover:text-white transition-colors">Exams & Resources</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Admin</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/principal-login" className="hover:text-white transition-colors flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Principal Portal
                </Link>
              </li>
              <li>
                <Link to="/teacher-login" className="hover:text-white transition-colors">Teacher Portal</Link>
              </li>
              <li>
                <Link to="/student-login" className="hover:text-white transition-colors">Student Portal</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Bora School KE Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { ExamsResources } from './components/ExamsResources';
import { Testimonials } from './components/Testimonials';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { SuperAdminLogin } from './pages/SuperAdminLogin';
import { LoginChoice } from './pages/LoginChoice';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { PrincipalLogin } from './pages/PrincipalLogin';
import { PrincipalDashboard } from './pages/PrincipalDashboard';
import { SchoolRegistration } from './pages/SchoolRegistration';

const LandingPage = () => (
  <>
    <Navbar />
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <ExamsResources />
      <Testimonials />
      <CTA />
    </main>
    <Footer />
  </>
);

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginChoice />} />
          <Route path="/super-admin" element={<SuperAdminLogin />} />
          <Route path="/principal-login" element={<PrincipalLogin />} />
          <Route path="/register-school" element={<SchoolRegistration />} />
          <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

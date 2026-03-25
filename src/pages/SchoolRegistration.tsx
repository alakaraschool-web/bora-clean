import { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Building2, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  ArrowRight, 
  CheckCircle2,
  ShieldCheck,
  Phone,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

export const SchoolRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    location: '',
    county: '',
    subCounty: '',
    schoolType: 'Secondary',
    principalName: '',
    principalPhone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.schoolName || !formData.location) {
        setError('Please fill in all school details');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    const sanitizedPhone = formData.principalPhone.replace(/\s+/g, '');
    const isValidPhone = /^(254\d{9}|07\d{8}|01\d{8})$/.test(sanitizedPhone);

    if (!isValidPhone) {
      setError('Phone number must start with 254, 07, or 01 and be of valid length');
      setIsLoading(false);
      return;
    }

    try {
      const sanitizedPhone = formData.principalPhone.replace(/\s+/g, '');
      const email = formData.principalEmail;

      // 1. Sign up user in Supabase Auth using email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: formData.password,
        options: {
          data: {
            name: formData.principalName,
            role: 'principal'
          }
        }
      });

      if (authError) {
        console.error('Full Auth Error:', authError);
        throw authError;
      }
      if (!authData.user) throw new Error('Registration failed');

      // 2. Create School in Supabase
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: formData.schoolName,
          location: formData.location,
          county: formData.county,
          sub_county: formData.subCounty,
          type: formData.schoolType,
          principal_name: formData.principalName
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 3. Create Profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_id: authData.user.id,
          name: formData.principalName,
          email: formData.principalEmail,
          phone: sanitizedPhone,
          role: 'principal',
          school_id: schoolData.id,
          password: formData.password
        });

      if (profileError) {
        console.error('Profile Creation Error:', profileError);
        throw profileError;
      }

      // Fallback for prototype/legacy
      const savedSchools = localStorage.getItem('alakara_schools');
      const schools = savedSchools ? JSON.parse(savedSchools) : [];
      const newSchool = {
        id: schoolData.id,
        name: formData.schoolName,
        location: formData.location,
        type: formData.schoolType,
        principalName: formData.principalName,
        principalEmail: sanitizedPhone,
        principalPhone: formData.principalPhone,
        principalPass: formData.password,
        status: 'Active',
        date: 'Just now',
        students: '0',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      localStorage.setItem('alakara_schools', JSON.stringify([...schools, newSchool]));
      localStorage.setItem('alakara_current_school', JSON.stringify(newSchool));
      
      setStep(3); // Success step
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kenya-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '60px 60px' }} />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex flex-col items-center gap-4 mb-8 group">
          <div className="bg-kenya-green p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-xl shadow-kenya-green/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-white tracking-tight">Bora School <span className="text-kenya-red">Registration</span></span>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-10 px-6 shadow-2xl rounded-[2.5rem] sm:px-12 border border-white/10"
        >
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-kenya-black uppercase tracking-tight">School Details</h2>
                <p className="text-sm text-gray-500">Step 1 of 2: Basic Information</p>
              </div>

              {error && (
                <div className="bg-red-50 text-kenya-red p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
                  <ShieldCheck className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">School Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="schoolName"
                      type="text"
                      required
                      value={formData.schoolName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                      placeholder="e.g. Oakwood Academy"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Location / Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="location"
                      type="text"
                      required
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                      placeholder="e.g. Nairobi, KE"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">County</label>
                    <input
                      name="county"
                      type="text"
                      required
                      value={formData.county}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                      placeholder="e.g. Nairobi"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sub-County</label>
                    <input
                      name="subCounty"
                      type="text"
                      required
                      value={formData.subCounty}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                      placeholder="e.g. Westlands"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">School Type</label>
                  <select
                    name="schoolType"
                    value={formData.schoolType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                  >
                    <option value="Primary">Primary School</option>
                    <option value="Junior">Junior School</option>
                    <option value="Secondary">Secondary School</option>
                    <option value="International">International School</option>
                    <option value="Technical">Technical Institute</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full py-4 rounded-xl gap-2 text-lg">
                Continue to Principal Info
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-kenya-black uppercase tracking-tight">Principal Account</h2>
                <p className="text-sm text-gray-500">Step 2 of 2: Admin Credentials</p>
              </div>

              {error && (
                <div className="bg-red-50 text-kenya-red p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
                  <ShieldCheck className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="principalName"
                      type="text"
                      required
                      value={formData.principalName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                      placeholder="Principal Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="principalEmail"
                      type="email"
                      required
                      value={formData.principalEmail || ''}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                      placeholder="e.g. principal@school.ke"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number (For Login)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="principalPhone"
                      type="tel"
                      required
                      value={formData.principalPhone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                      placeholder="e.g. 0712345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                        placeholder="••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                        placeholder="••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  className="px-6"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 py-4 rounded-xl gap-2 text-lg" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Complete Registration'}
                  {!isLoading && <ShieldCheck className="w-5 h-5" />}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-kenya-green/10 text-kenya-green rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-kenya-black mb-4 uppercase tracking-tight">Registration Successful!</h2>
              <p className="text-gray-600 mb-8">
                Welcome to Bora School, <span className="font-bold text-kenya-black">{formData.principalName}</span>. Your school <span className="font-bold text-kenya-black">{formData.schoolName}</span> has been registered successfully.
              </p>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-kenya-green" />
                  <span className="text-sm font-bold text-kenya-black">30-Day Free Trial Activated</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-kenya-red" />
                  <span className="text-sm font-bold text-kenya-black">Support: 0713209373</span>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/principal/dashboard')} 
                className="w-full py-4 rounded-xl text-lg font-bold"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </motion.div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          Already have an account? <Link to="/principal-login" className="text-kenya-green font-bold hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
};

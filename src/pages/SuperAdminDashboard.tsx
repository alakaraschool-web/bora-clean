import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  School as SchoolIcon, 
  Bell, 
  Search,
  TrendingUp,
  ShieldCheck,
  MoreVertical,
  Plus,
  X,
  Menu,
  Check,
  Copy,
  Mail,
  Loader2,
  Trash2,
  Key,
  Filter,
  ShieldAlert,
  Eye,
  EyeOff,
  MessageSquare,
  Quote,
  Phone
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { NotificationBell, addNotification } from '../components/NotificationBell';
import { UserManagement } from '../components/UserManagement';
import { ImageAI } from '../components/ImageAI';

interface School {
  id: string;
  name: string;
  location: string;
  county: string;
  subCounty: string;
  type: string;
  students: string;
  status: 'Active' | 'Pending' | 'Suspended';
  date: string;
  principalPhone: string;
  principalPass: string;
  teacherEmail: string;
  teacherPass: string;
  subscriptionExpiresAt?: string;
}

interface ExamMaterial {
  id: string;
  title: string;
  subject: string;
  category: string;
  description?: string;
  schoolName: string;
  teacherName: string;
  uploadDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  fileType: string;
  visibility: 'Public' | 'Hidden';
  fileUrl?: string;
}

import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schools' | 'analytics' | 'exams' | 'stories' | 'users' | 'image-ai'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeExamsCount, setActiveExamsCount] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ... (rest of the component)

  const resetSystemData = async () => {
    if (window.confirm('WARNING: This will delete ALL students, exams, and marks across ALL schools. This action cannot be undone. Are you sure?')) {
      setIsLoading(true);
      try {
        // Delete in order to respect foreign keys
        await supabase.from('marks').delete().neq('id', '0');
        await supabase.from('exams').delete().neq('id', '0');
        await supabase.from('students').delete().neq('id', '0');
        
        addNotification({
          title: 'System Reset',
          message: 'All student and exam data has been cleared.',
          type: 'success',
          role: 'super-admin'
        });
        
        fetchAllData();
      } catch (error: any) {
        console.error('Reset error:', error);
        alert('Failed to reset system data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div className="p-6">
            <h1 className="text-xl font-bold text-kenya-green">Super Admin</h1>
          </div>
          <nav className="mt-6">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-4 ${activeTab === 'dashboard' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Dashboard</button>
            <button onClick={() => setActiveTab('schools')} className={`w-full text-left p-4 ${activeTab === 'schools' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Schools</button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left p-4 ${activeTab === 'users' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Users</button>
            <button onClick={() => setActiveTab('image-ai')} className={`w-full text-left p-4 ${activeTab === 'image-ai' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Image AI</button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && <div>Dashboard Content</div>}
          {activeTab === 'schools' && <div>Schools Content</div>}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'image-ai' && <ImageAI />}
        </main>
      </div>
    </div>
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('checkSession session:', session, 'error:', error);
      
      if (!session) {
        console.warn('Auth session missing! Navigating to /super-admin');
        navigate('/super-admin');
        return;
      }

      // Fetch admin data based on session
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${session.user.id},user_id.eq.${session.user.id}`)
        .maybeSingle();

      if (profile && profile.role === 'super-admin') {
        setAdminProfile(profile);
        localStorage.setItem('alakara_super_admin', JSON.stringify(profile));
        fetchAllData();
      } else {
        navigate('/super-admin');
      }
      setIsLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/super-admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: '',
    category: 'Exam',
    description: '',
    file: null as File | null
  });
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ principal: string; teacher: string; pass: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Suspended'>('All');

  const [examMaterials, setExamMaterials] = useState<ExamMaterial[]>(() => {
    const saved = localStorage.getItem('alakara_exam_materials');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'm1',
        title: 'KCSE Mathematics Mock 2026',
        subject: 'Mathematics',
        schoolName: 'Oakwood Academy',
        teacherName: 'Mr. Kamau',
        uploadDate: '2 hours ago',
        status: 'Pending',
        fileType: 'PDF',
        visibility: 'Public'
      },
      {
        id: 'm2',
        title: 'English Literature Analysis - Blossoms',
        subject: 'English',
        schoolName: 'City High School',
        teacherName: 'Mrs. Anyango',
        uploadDate: '5 hours ago',
        status: 'Pending',
        fileType: 'PDF',
        visibility: 'Public'
      },
      {
        id: 'm3',
        title: 'Biology Practical Guide - Form 4',
        subject: 'Biology',
        schoolName: 'Global International',
        teacherName: 'Dr. Omondi',
        uploadDate: '1 day ago',
        status: 'Approved',
        fileType: 'ZIP',
        visibility: 'Public'
      }
    ];
  });

  const [successStories, setSuccessStories] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_success_stories');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        name: 'Dr. Sarah Jenkins',
        role: 'Principal, Oakwood Academy',
        content: 'Bora School KE has completely transformed how we handle end-of-term examinations. The automated grading alone has saved our teachers hundreds of hours.',
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
  });

  useEffect(() => {
    localStorage.setItem('alakara_success_stories', JSON.stringify(successStories));
  }, [successStories]);

  useEffect(() => {
    localStorage.setItem('alakara_exam_materials', JSON.stringify(examMaterials));
  }, [examMaterials]);
  
  const [schools, setSchools] = useState<School[]>([]);

  const [newSchool, setNewSchool] = useState({
    name: '',
    location: '',
    county: '',
    subCounty: '',
    type: 'Secondary',
    students: '',
    principalPhone: '',
  });

  const [newStory, setNewStory] = useState({
    name: '',
    role: '',
    content: '',
  });

  const generateCredentials = (schoolName: string, phone: string) => {
    const pass = Math.random().toString(36).slice(-8).toUpperCase();
    const sanitizedPhone = phone.replace(/\s+/g, '');
    return {
      principal: sanitizedPhone,
      teacher: `staff_${sanitizedPhone}`,
      pass
    };
  };

  const handleAddSchool = (e: FormEvent) => {
    e.preventDefault();
    
    const sanitizedPhone = newSchool.principalPhone.replace(/\s+/g, '');
    const isValidPhone = /^(254\d{9}|07\d{8}|01\d{8})$/.test(sanitizedPhone);

    if (!isValidPhone) {
      alert('Phone number must start with 254, 07, or 01 and be of valid length');
      return;
    }

    const creds = generateCredentials(newSchool.name, newSchool.principalPhone);
    
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    const expiryStr = defaultExpiry.toISOString().split('T')[0];

    const school: School = {
      id: Math.random().toString(36).substr(2, 9),
      ...newSchool,
      status: 'Active',
      date: 'Just now',
      principalPhone: creds.principal,
      principalPass: creds.pass,
      teacherEmail: creds.teacher, // Keep this as a placeholder or remove if not needed
      teacherPass: creds.pass,
      subscriptionExpiresAt: expiryStr
    };

    // Save to Supabase
    supabase.from('schools').insert({
      name: newSchool.name,
      location: newSchool.location,
      county: newSchool.county,
      sub_county: newSchool.subCounty,
      type: newSchool.type,
      principal_name: 'Principal'
    }).select().single().then(async ({ data: schoolData, error: schoolError }) => {
      if (schoolError) {
        console.error('Error creating school:', schoolError);
        alert('Failed to register school in database');
        return;
      }

      if (schoolData) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          
          const secondaryClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          });

          const sanitizedPhone = newSchool.principalPhone.replace(/\s+/g, '');
          const dummyEmail = `${sanitizedPhone}@boraschool.ke`;

          // 1. Create Principal Auth Account (using Email directly)
          const { data: pAuthData, error: pAuthError } = await secondaryClient.auth.signUp({
            email: dummyEmail,
            password: creds.pass
          });

          if (pAuthError && pAuthError.message !== 'User already registered') {
            console.error('Principal Auth Error:', pAuthError);
          }

          let principalId = pAuthData.user?.id;
          let principalAuthId = pAuthData.user?.id;
          if (!principalId) {
            const { data: existingP } = await supabase.from('profiles').select('id, user_id').eq('phone', sanitizedPhone).eq('role', 'principal').maybeSingle();
            principalId = existingP?.id || crypto.randomUUID();
            principalAuthId = existingP?.user_id || null;
          }
          
          // Create principal profile
          const { error: pError } = await supabase.from('profiles').upsert({
            id: principalId,
            user_id: principalAuthId,
            school_id: schoolData.id,
            name: `${newSchool.name} Principal`,
            email: `${sanitizedPhone}@boraschool.ke`, // Dummy email to satisfy DB constraint
            phone: sanitizedPhone,
            password: creds.pass,
            must_change_password: true,
            role: 'principal'
          });

          if (pError) console.error('Principal Profile Error:', pError);

          // 2. Create Teacher Auth Account (using a derived phone or username if needed, but for now let's just create the profile)
          // Since we can't have duplicate phones in Auth, and we don't use email, 
          // we might need a different strategy for the default teacher account if it needs Auth.
          // For now, we'll just create the profile without an auth link if it's just a placeholder.
          
          const teacherId = crypto.randomUUID();
          
          // Create default teacher profile
          const { error: tError } = await supabase.from('profiles').upsert({
            id: teacherId,
            school_id: schoolData.id,
            name: `${newSchool.name} Staff`,
            phone: null, // Avoid conflict with principal's phone
            password: creds.pass,
            must_change_password: true,
            role: 'teacher'
          });

          if (tError) console.error('Teacher Profile Error:', tError);

          if (pError || tError) {
            console.error('Error creating profiles:', pError || tError);
          }
          
          setSchools([school, ...schools]);
          setGeneratedCreds({ principal: newSchool.principalPhone, teacher: creds.teacher, pass: creds.pass });
          setNewSchool({ name: '', location: '', county: '', subCounty: '', type: 'Secondary', students: '', principalPhone: '' });

          addNotification({
            title: 'New School Registered',
            message: `${school.name} has been successfully registered on the platform.`,
            type: 'success',
            role: 'super-admin'
          });
        } catch (err) {
          console.error('Error in school setup:', err);
          alert('School created but profile setup failed. Check console.');
        }
      }
    });
  };

  const handleAddStory = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const storyData = {
        author_name: newStory.name,
        title: newStory.role, // Using title for role/designation
        content: newStory.content,
        image_url: `https://picsum.photos/seed/${newStory.name}/100/100`
      };
      const data = await supabaseService.createSuccessStory(storyData);
      if (data) {
        setSuccessStories([{
          id: data.id,
          name: data.author_name || '',
          role: data.title || '',
          content: data.content,
          image: data.image_url || ''
        }, ...successStories]);
        setNewStory({ name: '', role: '', content: '' });
        setShowStoryModal(false);
      }
    } catch (error) {
      console.error('Error adding success story:', error);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (window.confirm('Delete this success story?')) {
      try {
        await supabaseService.deleteSuccessStory(id);
        setSuccessStories(successStories.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting success story:', error);
      }
    }
  };

  const stats = [
    { label: 'Total Schools', value: schools.length.toString(), change: '+12%', icon: SchoolIcon, color: 'text-kenya-green', bg: 'bg-kenya-green/10' },
    { label: 'Active Exams', value: activeExamsCount.toLocaleString(), change: '+18%', icon: BookOpen, color: 'text-kenya-red', bg: 'bg-kenya-red/10' },
    { label: 'Total Students', value: totalStudents.toLocaleString(), change: '+7%', icon: Users, color: 'text-kenya-black', bg: 'bg-kenya-black/10' },
    { label: 'System Health', value: '99.9%', change: 'Stable', icon: ShieldCheck, color: 'text-kenya-green', bg: 'bg-kenya-green/10' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/super-admin');
  };

  const toggleSchoolStatus = async (id: string) => {
    const school = schools.find(s => s.id === id);
    if (!school) return;

    const nextStatus = school.status === 'Active' ? 'Suspended' : 'Active';
    
    try {
      await supabaseService.updateSchoolStatus(id, nextStatus);
      
      setSchools(schools.map(s => {
        if (s.id === id) {
          addNotification({
            title: `School ${nextStatus}`,
            message: `${s.name} status has been changed to ${nextStatus}.`,
            type: nextStatus === 'Active' ? 'success' : 'warning',
            role: 'super-admin'
          });

          // Also notify the principal
          addNotification({
            title: `Account ${nextStatus}`,
            message: `Your school account has been ${nextStatus.toLowerCase()} by the system administrator.`,
            type: nextStatus === 'Active' ? 'success' : 'error',
            role: 'principal',
            userId: s.id
          });

          return { ...s, status: nextStatus as any };
        }
        return s;
      }));

      // Update local storage for demo consistency
      const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
      const updatedSchools = allSchools.map((s: any) => s.id === id ? { ...s, status: nextStatus } : s);
      localStorage.setItem('alakara_schools', JSON.stringify(updatedSchools));

    } catch (error) {
      console.error('Error updating school status:', error);
      alert('Failed to update school status in database.');
    }
  };

  const handleMaterialAction = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      await supabaseService.updateMaterialStatus(id, action);
      setExamMaterials(examMaterials.map(m => {
        if (m.id === id) {
          addNotification({
            title: `Material ${action}`,
            message: `The material "${m.title}" has been ${action.toLowerCase()}.`,
            type: action === 'Approved' ? 'success' : 'error',
            role: 'super-admin'
          });
          return { ...m, status: action };
        }
        return m;
      }));
    } catch (error) {
      console.error('Error updating material status:', error);
    }
  };

  const handleUploadMaterial = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert('Please select a file to upload.');
      return;
    }
    if (!adminProfile) {
      alert('You must be logged in to upload materials.');
      return;
    }

    setIsUploading(true);
    try {
      const fileUrl = await supabaseService.uploadExamMaterial(uploadForm.file);
      const fileType = uploadForm.file.name.split('.').pop()?.toUpperCase() as any;

      await supabaseService.createExamMaterial({
        title: uploadForm.title,
        subject: uploadForm.subject,
        category: uploadForm.category,
        description: uploadForm.description,
        file_url: fileUrl,
        file_type: fileType,
        status: 'Approved',
        visibility: 'Public',
        teacher_id: adminProfile.id
      });

      addNotification({
        title: 'Upload Successful',
        message: 'Your educational resource has been uploaded and published.',
        type: 'success',
        role: 'super-admin'
      });
      
      setShowUploadModal(false);
      setUploadForm({ title: '', subject: '', category: 'Exam', description: '', file: null });
      fetchAllData();
    } catch (error) {
      console.error('Upload error:', error);
      addNotification({
        title: 'Upload Failed',
        message: 'Could not upload the educational resource.',
        type: 'error',
        role: 'super-admin'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleMaterialVisibility = async (id: string) => {
    try {
      const material = examMaterials.find(m => m.id === id);
      if (!material) return;
      const nextVisibility = material.visibility === 'Public' ? 'Hidden' : 'Public';
      await supabaseService.updateMaterialVisibility(id, nextVisibility);
      setExamMaterials(examMaterials.map(m => {
        if (m.id === id) {
          return { ...m, visibility: nextVisibility as any };
        }
        return m;
      }));
    } catch (error) {
      console.error('Error updating material visibility:', error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await supabaseService.deleteMaterial(id);
        setExamMaterials(examMaterials.filter(m => m.id !== id));
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const updateSchoolExpiry = async (id: string, date: string) => {
    try {
      await supabaseService.updateSchoolSubscription(id, date);
      
      setSchools(schools.map(school => {
        if (school.id === id) {
          return { ...school, subscriptionExpiresAt: date };
        }
        return school;
      }));

      // Update local storage for demo consistency
      const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
      const updatedSchools = allSchools.map((s: any) => s.id === id ? { ...s, subscriptionExpiresAt: date } : s);
      localStorage.setItem('alakara_schools', JSON.stringify(updatedSchools));

    } catch (error) {
      console.error('Error updating school subscription:', error);
      alert('Failed to update subscription in database.');
    }
  };

  const filteredSchools = schools.filter(school => {
    const matchesStatus = statusFilter === 'All' || school.status === statusFilter;
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          school.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const registrationData = [
    { month: 'Jan', schools: 400, users: 2400 },
    { month: 'Feb', schools: 520, users: 3100 },
    { month: 'Mar', schools: 680, users: 4200 },
    { month: 'Apr', schools: 850, users: 5800 },
    { month: 'May', schools: 1100, users: 7500 },
    { month: 'Jun', schools: 1284, users: 9200 },
  ];

  const performanceData = [
    { subject: 'Mathematics', score: 78 },
    { subject: 'English', score: 82 },
    { subject: 'Kiswahili', score: 75 },
    { subject: 'Science', score: 88 },
    { subject: 'Social Studies', score: 72 },
  ];

  const statusData = [
    { name: 'Active', value: 85, color: '#008751' },
    { name: 'Pending', value: 10, color: '#FFD700' },
    { name: 'Suspended', value: 5, color: '#BB1924' },
  ];

  const fetchAllData = async () => {
    try {
      // 1. Fetch Schools and Student Counts
      const schoolsData = await supabaseService.getAllSchools();
      const studentCounts = await supabaseService.getStudentCountsBySchool();
      const totalStudentsCount = await supabaseService.getTotalStudentsCount();
      const activeExams = await supabaseService.getActiveExamsCount();

      setTotalStudents(totalStudentsCount);
      setActiveExamsCount(activeExams);
      
      if (schoolsData) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('school_id, phone, email')
          .eq('role', 'principal');

        const mappedSchools: School[] = schoolsData.map((s: any) => {
          const principalProfile = profiles?.find(p => p.school_id === s.id);
          return {
            id: s.id,
            name: s.name,
            location: s.location || '',
            county: s.county || '',
            subCounty: s.sub_county || '',
            type: s.type || 'Secondary',
            students: (studentCounts[s.id] || 0).toString(),
            status: s.status || 'Active',
            date: new Date(s.created_at).toLocaleDateString(),
            principalPhone: principalProfile?.phone || 'N/A',
            principalPass: '********',
            teacherEmail: principalProfile?.phone || 'N/A',
            teacherPass: '********',
            subscriptionExpiresAt: s.subscription_expires_at
          };
        });
        setSchools(mappedSchools);
      }

      // 2. Fetch Exam Materials
      const materialsData = await supabaseService.getExamMaterials();
      if (materialsData) {
        setExamMaterials(materialsData.map((m: any) => ({
          id: m.id,
          title: m.title,
          subject: m.subject,
          description: m.description,
          schoolName: m.schools?.name || 'System',
          teacherName: m.profiles?.name || 'Super Admin',
          uploadDate: new Date(m.created_at).toLocaleDateString(),
          status: m.status as any,
          fileType: m.file_type as any || 'PDF',
          visibility: m.visibility as any,
          fileUrl: m.file_url
        })));
      }

      // 3. Fetch Success Stories
      const storiesData = await supabaseService.getSuccessStories();
      if (storiesData) {
        setSuccessStories(storiesData.map((s: any) => ({
          id: s.id,
          name: s.author_name,
          role: s.title,
          content: s.content,
          image: s.image_url || `https://picsum.photos/seed/${s.author_name}/100/100`
        })));
      }

      // 4. Fetch All Users (Visibility for Super Admin)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*, schools(name)');
      
      const { data: allStudents } = await supabase
        .from('students')
        .select('*, schools(name)');
      
      const combinedUsers = [
        ...(allProfiles || []).map(p => ({ 
          id: p.id, 
          name: p.name, 
          phone: p.phone, 
          role: p.role, 
          type: 'Staff', 
          schoolName: p.schools?.name || 'N/A',
          createdAt: p.created_at 
        })),
        ...(allStudents || []).map(s => ({ 
          id: s.id, 
          name: s.name, 
          phone: 'N/A', 
          role: 'Student', 
          type: 'Student', 
          schoolName: s.schools?.name || 'N/A',
          createdAt: s.created_at 
        }))
      ];
      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error loading super admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-kenya-green animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium italic">Verifying super admin session...</p>
        </div>
      </div>
    );
  }

  if (!adminProfile) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'var(--background-kenya-pattern)', backgroundSize: '40px 40px' }} />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-kenya-green p-1.5 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-kenya-black tracking-tight">Bora School <span className="text-kenya-red">KE</span></span>
          </div>
          <button 
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-kenya-green/10 text-kenya-green' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('schools')}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'schools' ? 'bg-kenya-green/10 text-kenya-green' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <SchoolIcon className="w-5 h-5" />
            Schools
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'users' ? 'bg-kenya-green/10 text-kenya-green' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button 
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'exams' ? 'bg-kenya-green/10 text-kenya-green' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BookOpen className="w-5 h-5" />
            Exams
          </button>
          <button 
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'stories' ? 'bg-kenya-green/10 text-kenya-green' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MessageSquare className="w-5 h-5" />
            Success Stories
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'analytics' ? 'bg-kenya-green/10 text-kenya-green' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Analytics
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">Quick Actions</p>
          <button 
            onClick={() => {
              setActiveTab('exams');
              setShowUploadModal(true);
            }}
            className="flex items-center gap-3 px-4 py-3 w-full bg-kenya-green text-white rounded-xl font-bold shadow-lg shadow-kenya-green/20 hover:bg-green-700 transition-all active:scale-95 mb-4"
          >
            <Plus className="w-5 h-5" />
            Upload Resource
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:text-kenya-red hover:bg-kenya-red/5 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="relative w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search schools, exams, or users..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell role="super-admin" />
            <div className="h-8 w-px bg-gray-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-kenya-black">{adminProfile?.name || 'Solomon Isiya'}</p>
                <p className="text-xs text-gray-500">System Controller</p>
              </div>
              <img 
                src="https://picsum.photos/seed/admin-avatar/100/100" 
                alt="Admin" 
                className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' ? (
            <>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-kenya-black">System Overview</h1>
                  <p className="text-gray-500">Welcome back, here's what's happening across the Kenyan network.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab('analytics')}>
                    <TrendingUp className="w-4 h-4" />
                    Full Report
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-kenya-green/10 text-kenya-green' : 'bg-gray-50 text-gray-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-kenya-black">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-kenya-black mb-6">Registration Growth</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={registrationData}>
                        <defs>
                          <linearGradient id="colorSchools" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#008751" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#008751" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="schools" stroke="#008751" strokeWidth={2} fillOpacity={1} fill="url(#colorSchools)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-kenya-black rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-kenya-green p-2 rounded-xl">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold">System Status</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Network Status</span>
                        <span className="font-bold text-kenya-green flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-kenya-green animate-pulse"></span>
                          Online
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Active Sessions</span>
                        <span className="font-bold">1,248</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Storage Used</span>
                        <span className="font-bold">12.4 TB / 50 TB</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Last Backup</span>
                        <span className="font-bold">Today, 02:15 AM</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all">
                    Download System Logs
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-kenya-black mb-6">Performance by Subject</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                        <Tooltip 
                          cursor={{fill: '#f9fafb'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#008751' : '#BB1924'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Schools */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-kenya-black">Recently Joined Kenyan Schools</h3>
                      <Button variant="ghost" size="sm" className="text-kenya-green" onClick={() => setActiveTab('schools')}>View All</Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-4">School Name</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Students</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {schools.slice(0, 4).map((school) => (
                            <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-kenya-black">{school.name}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{school.location}</td>
                              <td className="px-6 py-4 text-sm text-kenya-black font-medium">{school.students}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  school.status === 'Active' ? 'bg-kenya-green/10 text-kenya-green' : 'bg-kenya-red/10 text-kenya-red'
                                }`}>
                                  {school.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{school.date}</td>
                              <td className="px-6 py-4 text-right">
                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-kenya-black mb-6">System Health</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">Database Load</span>
                          <span className="font-bold text-kenya-black">24%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-kenya-green rounded-full" style={{ width: '24%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">Storage Usage</span>
                          <span className="font-bold text-kenya-black">68%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-kenya-red rounded-full" style={{ width: '68%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">API Latency</span>
                          <span className="font-bold text-kenya-black">42ms</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-kenya-green rounded-full" style={{ width: '15%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        onClick={resetSystemData}
                        className="w-full justify-center gap-2 text-kenya-red hover:bg-kenya-red/5"
                      >
                        <Trash2 className="w-4 h-4" />
                        Reset System Data
                      </Button>
                      <p className="mt-2 text-[10px] text-center text-gray-400">
                        Clears all students, exams, and marks for a fresh start.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'schools' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-kenya-black">School Management</h1>
                  <p className="text-gray-500">Register and manage educational institutions across Kenya.</p>
                </div>
                <Button 
                  onClick={() => {
                    setShowAddModal(true);
                    setGeneratedCreds(null);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Register New School
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search schools..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green transition-all"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">School Details</th>
                        <th className="px-6 py-4">Principal Login</th>
                        <th className="px-6 py-4">Staff Login</th>
                        <th className="px-6 py-4">Students</th>
                        <th className="px-6 py-4">Active Until</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSchools.map((school) => (
                        <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-kenya-black">{school.name}</p>
                            <p className="text-xs text-gray-500">{school.location}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{school.county}</span>
                              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{school.subCounty}</span>
                              <span className="text-[10px] bg-kenya-green/10 px-1.5 py-0.5 rounded text-kenya-green font-bold">{school.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
                                {school.principalPhone}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                <Key className="w-3 h-3" />
                                {school.principalPass}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
                                {school.principalPhone}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                <Key className="w-3 h-3" />
                                {school.teacherPass}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-kenya-black font-medium">{school.students}</td>
                          <td className="px-6 py-4">
                            <input 
                              type="date" 
                              value={school.subscriptionExpiresAt || ''}
                              onChange={(e) => updateSchoolExpiry(school.id, e.target.value)}
                              className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-kenya-green transition-all"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              school.status === 'Active' ? 'bg-kenya-green/10 text-kenya-green' : 
                              school.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-kenya-red/10 text-kenya-red'
                            }`}>
                              {school.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {school.status === 'Suspended' ? (
                                <button 
                                  onClick={() => toggleSchoolStatus(school.id)}
                                  className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                                  title="Activate School"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => toggleSchoolStatus(school.id)}
                                  className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                  title="Suspend School"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              )}
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'exams' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-kenya-black">Exam Materials Review</h1>
                  <p className="text-gray-500">Approve or reject educational materials uploaded by teachers.</p>
                </div>
                <Button onClick={() => setShowUploadModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Upload Resource
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Material Title</th>
                        <th className="px-6 py-4">Source</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Visibility</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {examMaterials.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-kenya-black">{material.title}</p>
                                <p className="text-xs text-gray-500">{material.category} • {material.subject} • {material.fileType}</p>
                                {material.description && (
                                  <p className="text-[10px] text-gray-400 mt-1 max-w-xs truncate" title={material.description}>
                                    {material.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-kenya-black">{material.teacherName}</p>
                            <p className="text-xs text-gray-500">{material.schoolName}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{material.uploadDate}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              material.status === 'Approved' ? 'bg-kenya-green/10 text-kenya-green' : 
                              material.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-kenya-red/10 text-kenya-red'
                            }`}>
                              {material.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              material.visibility === 'Public' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {material.visibility}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {material.fileUrl && (
                                <a 
                                  href={material.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Download / View"
                                >
                                  <BookOpen className="w-4 h-4" />
                                </a>
                              )}
                              {material.status === 'Pending' && (
                                <>
                                  <button 
                                    onClick={() => handleMaterialAction(material.id, 'Approved')}
                                    className="p-2 text-kenya-green hover:bg-kenya-green/10 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleMaterialAction(material.id, 'Rejected')}
                                    className="p-2 text-kenya-red hover:bg-kenya-red/10 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => toggleMaterialVisibility(material.id)}
                                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                title={material.visibility === 'Public' ? 'Hide from Public' : 'Show to Public'}
                              >
                                {material.visibility === 'Public' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleDeleteMaterial(material.id)}
                                className="p-2 text-gray-400 hover:text-kenya-red rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {examMaterials.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <BookOpen className="w-8 h-8" />
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">No materials found</p>
                                <p className="text-sm text-gray-400">Start by uploading educational resources for schools.</p>
                              </div>
                              <Button onClick={() => setShowUploadModal(true)} variant="outline" size="sm" className="mt-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Upload First Resource
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'stories' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-kenya-black">Success Stories Management</h1>
                  <p className="text-gray-500">Manage testimonials and success stories displayed on the landing page.</p>
                </div>
                <Button onClick={() => setShowStoryModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Success Story
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {successStories.map((story) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group"
                  >
                    <button 
                      onClick={() => handleDeleteStory(story.id)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-kenya-red opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={story.image} 
                        alt={story.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-50"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-kenya-black">{story.name}</h4>
                        <p className="text-xs text-gray-500">{story.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic leading-relaxed">
                      "{story.content}"
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-kenya-black">User Management</h1>
                  <p className="text-gray-500">Overview of all registered staff and students across all schools.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role/Type</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Institution</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users
                        .filter(u => 
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.schoolName?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-kenya-green/10 flex items-center justify-center text-kenya-green font-bold text-xs">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-kenya-black">{user.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              user.type === 'Staff' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{user.schoolName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{user.phone || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            No users found in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-kenya-black">Advanced Analytics</h1>
                <p className="text-gray-500">Deep dive into school performance and system usage trends.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-kenya-black mb-6">User Acquisition Trend</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={registrationData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#BB1924" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#BB1924" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="users" stroke="#BB1924" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-kenya-black mb-6">Regional Performance Distribution</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                          <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} width={100} />
                          <Tooltip 
                            cursor={{fill: '#f9fafb'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="score" fill="#008751" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-kenya-black mb-6">School Status</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 mt-4">
                      {statusData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-gray-600">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold text-kenya-black">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-kenya-black mb-4">Key Insights</h3>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-kenya-green mt-2 shrink-0" />
                        <p className="text-sm text-gray-600">Nairobi region shows 15% higher engagement in Science subjects.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-kenya-red mt-2 shrink-0" />
                        <p className="text-sm text-gray-600">Active user growth peaked in March due to end-of-term exams.</p>
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                        <p className="text-sm text-gray-600">System latency remains below 50ms despite 20% traffic increase.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add School Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold text-kenya-black">Register New Institution</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                {!generatedCreds ? (
                  <form onSubmit={handleAddSchool} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">School Name</label>
                      <input 
                        type="text" 
                        required
                        value={newSchool.name}
                        onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                        placeholder="e.g. Alliance High School"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Principal Phone Number (For Login)</label>
                      <input 
                        type="tel" 
                        required
                        value={newSchool.principalPhone}
                        onChange={(e) => setNewSchool({ ...newSchool, principalPhone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                        placeholder="e.g. 0712345678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Location / Address</label>
                      <input 
                        type="text" 
                        required
                        value={newSchool.location}
                        onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                        placeholder="e.g. Kiambu, KE"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">County</label>
                        <input 
                          type="text" 
                          required
                          value={newSchool.county}
                          onChange={(e) => setNewSchool({ ...newSchool, county: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                          placeholder="e.g. Nairobi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Sub-County</label>
                        <input 
                          type="text" 
                          required
                          value={newSchool.subCounty}
                          onChange={(e) => setNewSchool({ ...newSchool, subCounty: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                          placeholder="e.g. Westlands"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">School Type</label>
                        <select
                          value={newSchool.type}
                          onChange={(e) => setNewSchool({ ...newSchool, type: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                        >
                          <option value="Primary">Primary</option>
                          <option value="Junior">Junior</option>
                          <option value="Secondary">Secondary</option>
                          <option value="International">International</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Est. Students</label>
                        <input 
                          type="text" 
                          required
                          value={newSchool.students}
                          onChange={(e) => setNewSchool({ ...newSchool, students: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                          placeholder="e.g. 1,500"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full py-4">Generate Access Details</Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-kenya-green/10 p-6 rounded-2xl border border-kenya-green/20 text-center">
                      <div className="w-12 h-12 bg-kenya-green rounded-full flex items-center justify-center text-white mx-auto mb-4">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold text-kenya-green mb-1">Registration Successful!</h4>
                      <p className="text-sm text-gray-600">Login details have been generated using the provided phone number.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Principal Login (Phone)</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-mono text-kenya-black">{generatedCreds.principal}</p>
                          <button className="text-gray-400 hover:text-kenya-green"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Staff Account</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-mono text-kenya-black">{generatedCreds.teacher}</p>
                          <button className="text-gray-400 hover:text-kenya-green"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Default Password</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-mono font-bold text-kenya-red">{generatedCreds.pass}</p>
                          <button className="text-gray-400 hover:text-kenya-red"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => setShowAddModal(false)} className="w-full">Done</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Story Modal */}
        {showStoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold text-kenya-black">Add Success Story</h3>
                <button onClick={() => setShowStoryModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleAddStory} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Person Name</label>
                    <input 
                      type="text" 
                      required
                      value={newStory.name}
                      onChange={(e) => setNewStory({ ...newStory, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                      placeholder="e.g. Dr. Sarah Jenkins"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role / Title</label>
                    <input 
                      type="text" 
                      required
                      value={newStory.role}
                      onChange={(e) => setNewStory({ ...newStory, role: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                      placeholder="e.g. Principal, Oakwood Academy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Success Story / Content</label>
                    <textarea 
                      required
                      rows={4}
                      value={newStory.content}
                      onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green resize-none"
                      placeholder="Share the success story..."
                    />
                  </div>
                  <Button type="submit" className="w-full py-4">Publish Story</Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold text-kenya-black">Upload Educational Resource</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleUploadMaterial} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Resource Title</label>
                    <input 
                      type="text" 
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                      placeholder="e.g. KCSE 2023 Mathematics Revision"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                      <input 
                        type="text" 
                        required
                        value={uploadForm.subject}
                        onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                        placeholder="e.g. Mathematics"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                      <select 
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green"
                      >
                        <option value="Exam">Exam</option>
                        <option value="Revision Note">Revision Note</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Syllabus">Syllabus</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">File Attachment</label>
                    <input 
                      type="file" 
                      required
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-kenya-green/10 file:text-kenya-green hover:file:bg-kenya-green/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Short Description</label>
                    <textarea 
                      required
                      rows={3}
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 focus:border-kenya-green resize-none"
                      placeholder="Briefly describe what this resource contains..."
                    />
                  </div>
                  <Button type="submit" className="w-full py-4" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Publish Resource'
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

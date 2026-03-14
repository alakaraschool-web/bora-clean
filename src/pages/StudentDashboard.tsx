import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  LogOut, 
  LayoutDashboard, 
  Search,
  Download,
  FileText,
  Star,
  Clock,
  ShieldCheck,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'learning' | 'exams' | 'results' | 'materials'>('learning');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentStudent, setCurrentStudent] = useState<any>(() => {
    const saved = localStorage.getItem('alakara_current_student');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let profileId = session?.user.id;
      let profileEmail = session?.user.email;

      // Fallback: Check localStorage if no session
      if (!profileId && currentStudent) {
        profileId = currentStudent.id;
        profileEmail = currentStudent.email;
      }

      if (profileId || profileEmail) {
        const query = supabase.from('profiles').select('*');
        if (profileId && !profileId.startsWith('demo-')) {
          query.eq('id', profileId);
        } else if (profileEmail) {
          query.eq('email', profileEmail).eq('role', 'student');
        } else {
          return;
        }

        const { data: profile } = await query.single();
        
        if (profile) {
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('id', profile.student_id)
            .single();
          
          if (studentData) {
            setCurrentStudent(studentData);
            localStorage.setItem('alakara_current_student', JSON.stringify(studentData));
          }
        }
      } else if (!currentStudent) {
        navigate('/student-login');
      }
    };
    fetchStudentData();
  }, [navigate]);

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-[#FF6321] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white font-black uppercase tracking-widest">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadData = async () => {
      if (!currentStudent?.school_id) return;

      try {
        // Fetch Materials
        const { data: materialsData } = await supabase
          .from('exam_materials')
          .select('*')
          .eq('school_id', currentStudent.school_id)
          .eq('status', 'Approved')
          .eq('visibility', 'Public');
        if (materialsData) setMaterials(materialsData);

        // Fetch Exams
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('school_id', currentStudent.school_id)
          .eq('published', true);
        if (examsData) {
          setExams(examsData.filter((e: any) => (e.classes || []).includes(currentStudent.class)));
        }

        // Fetch Marks
        const { data: marksData } = await supabase
          .from('marks')
          .select('*')
          .eq('student_id', currentStudent.id);
        if (marksData) {
          setMarks(marksData.map(m => ({
            ...m,
            examId: m.exam_id,
            studentId: m.student_id
          })));
        }

        // Fetch Staff
        const { data: staffData } = await supabase
          .from('profiles')
          .select('*')
          .eq('school_id', currentStudent.school_id);
        if (staffData) setStaff(staffData);

      } catch (error) {
        console.error('Error loading student data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentStudent?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('alakara_current_student');
    navigate('/student-login');
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FF6321] flex font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-black text-white flex flex-col shrink-0 border-r-8 border-black transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-white p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <GraduationCap className="w-8 h-8 text-black" />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase italic">Bora School <span className="text-[#FF6321]">Students</span></span>
            </div>
            <button 
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <nav className="space-y-4">
            <button 
              onClick={() => { setActiveTab('learning'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 font-black uppercase tracking-widest transition-all ${activeTab === 'learning' ? 'bg-white text-black shadow-[8px_8px_0px_0px_rgba(0,255,0,1)]' : 'text-white hover:bg-white/10'}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              My Learning
            </button>
            <button 
              onClick={() => { setActiveTab('materials'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 font-black uppercase tracking-widest transition-all ${activeTab === 'materials' ? 'bg-white text-black shadow-[8px_8px_0px_0px_rgba(0,255,0,1)]' : 'text-white hover:bg-white/10'}`}
            >
              <FileText className="w-6 h-6" />
              Approved Materials
            </button>
            <button 
              onClick={() => { setActiveTab('exams'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 font-black uppercase tracking-widest transition-all ${activeTab === 'exams' ? 'bg-white text-black shadow-[8px_8px_0px_0px_rgba(0,255,0,1)]' : 'text-white hover:bg-white/10'}`}
            >
              <BookOpen className="w-6 h-6" />
              Exams
            </button>
            <button 
              onClick={() => { setActiveTab('results'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 font-black uppercase tracking-widest transition-all ${activeTab === 'results' ? 'bg-white text-black shadow-[8px_8px_0px_0px_rgba(0,255,0,1)]' : 'text-white hover:bg-white/10'}`}
            >
              <Star className="w-6 h-6" />
              Results
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 text-white hover:text-kenya-red font-black uppercase tracking-widest transition-all border-4 border-white hover:border-kenya-red"
          >
            <LogOut className="w-6 h-6" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white border-l-8 border-black">
        {/* Header */}
        <header className="h-24 bg-white border-b-8 border-black flex items-center justify-between px-4 lg:px-10 shrink-0">
          <div className="flex items-center gap-4 lg:gap-6 flex-1">
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-8 h-8 text-black" />
            </button>
            <div className="relative w-full max-w-xl hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
              <input 
                type="text" 
                placeholder="SEARCH MATERIALS..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-100 border-4 border-black font-black uppercase tracking-widest focus:outline-none focus:bg-yellow-50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 ml-10">
            <NotificationBell role="student" userId={currentStudent.id} />
            <div className="text-right">
              <p className="text-sm font-black text-black uppercase tracking-widest">Student Portal</p>
              <p className="text-xs font-bold text-gray-500 uppercase">ADM-2024-001</p>
            </div>
            <div className="w-14 h-14 bg-[#FF6321] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#f0f0f0]">
          {activeTab === 'learning' ? (
            <div className="space-y-12">
              <div className="mb-12">
                <h1 className="text-5xl font-black text-black uppercase tracking-tighter italic mb-4">My Learning Journey</h1>
                <div className="h-4 w-48 bg-[#FF6321] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Current Class</p>
                  <p className="text-4xl font-black text-black uppercase italic">{currentStudent.class}</p>
                </div>
                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Exams</p>
                  <p className="text-4xl font-black text-black uppercase italic">{exams.length}</p>
                </div>
                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Learning Areas</p>
                  <p className="text-4xl font-black text-black uppercase italic">8</p>
                </div>
              </div>

              <div className="bg-white border-4 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-3xl font-black text-black uppercase tracking-tight mb-8 italic">Subject Performance Summary</h3>
                <div className="space-y-6">
                  {['Mathematics', 'English', 'Kiswahili', 'Science'].map(subject => {
                    const subjectMarks = marks.filter(m => m.subject === subject);
                    const avg = subjectMarks.length > 0 
                      ? subjectMarks.reduce((sum, m) => sum + parseFloat(m.score), 0) / subjectMarks.length 
                      : 0;
                    return (
                      <div key={subject} className="space-y-2">
                        <div className="flex justify-between font-black uppercase tracking-widest text-sm">
                          <span>{subject}</span>
                          <span>{avg.toFixed(1)}%</span>
                        </div>
                        <div className="h-6 bg-gray-100 border-2 border-black">
                          <div 
                            className="h-full bg-[#FF6321] border-r-2 border-black transition-all duration-1000" 
                            style={{ width: `${avg}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'exams' ? (
            <div className="space-y-12">
              <div className="mb-12">
                <h1 className="text-5xl font-black text-black uppercase tracking-tighter italic mb-4">Examination Schedule</h1>
                <div className="h-4 w-48 bg-[#FF6321] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {exams.map((exam, index) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div>
                      <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-1">{exam.title}</h3>
                      <p className="text-sm font-bold text-gray-500 uppercase">{exam.term} - {exam.year}</p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <span className={`px-4 py-1 border-2 border-black font-black uppercase text-xs ${
                          exam.status === 'Active' ? 'bg-green-400 text-black' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {exam.status}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                        <p className="font-black text-black uppercase text-sm">{exam.startDate || 'TBA'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {exams.length === 0 && (
                  <div className="py-20 text-center border-8 border-dashed border-black/10">
                    <p className="text-3xl font-black text-black/20 uppercase italic">No exams scheduled yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'results' ? (
            <div className="space-y-12">
              <div className="mb-12">
                <h1 className="text-5xl font-black text-black uppercase tracking-tighter italic mb-4">My Academic Results</h1>
                <div className="h-4 w-48 bg-[#FF6321] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
              </div>

              <div className="bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="px-8 py-6 font-black uppercase tracking-widest text-sm">Subject</th>
                      <th className="px-8 py-6 font-black uppercase tracking-widest text-sm">Teacher</th>
                      <th className="px-8 py-6 font-black uppercase tracking-widest text-sm">Exam</th>
                      <th className="px-8 py-6 font-black uppercase tracking-widest text-sm text-center">Score</th>
                      <th className="px-8 py-6 font-black uppercase tracking-widest text-sm text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-4 divide-black">
                    {marks.map((mark, index) => {
                      const exam = exams.find(e => e.id === mark.examId);
                      const subjectTeacher = staff.find(t => 
                        t.assignedSubjects?.includes(mark.subject) && 
                        t.assignedClasses?.includes(currentStudent.class)
                      );
                      const score = parseFloat(mark.score);
                      let grade = 'E';
                      if (score >= 80) grade = 'A';
                      else if (score >= 70) grade = 'B';
                      else if (score >= 60) grade = 'C';
                      else if (score >= 50) grade = 'D';
                      
                      return (
                        <tr key={mark.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6 font-black uppercase text-black">{mark.subject}</td>
                          <td className="px-8 py-6 font-bold uppercase text-gray-500 text-xs italic">{subjectTeacher?.name || 'Not Assigned'}</td>
                          <td className="px-8 py-6 font-bold uppercase text-gray-500 text-sm">{exam?.title || 'Unknown Exam'}</td>
                          <td className="px-8 py-6 font-black text-2xl text-center text-black">{score}%</td>
                          <td className="px-8 py-6 text-center">
                            <span className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-black text-xl italic">
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {marks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-black uppercase italic">
                          No results posted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'materials' ? (
            <>
              <div className="mb-12">
                <h1 className="text-5xl font-black text-black uppercase tracking-tighter italic mb-4">Approved Learning Materials</h1>
                <div className="h-4 w-48 bg-[#FF6321] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMaterials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-black flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <span className="bg-kenya-green text-white px-4 py-1 font-black uppercase text-xs border-2 border-black">
                        {material.fileType}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-2 leading-none">
                      {material.title}
                    </h3>
                    <p className="text-sm font-bold text-[#FF6321] uppercase mb-6">
                      {material.subject}
                    </p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                        <Clock className="w-4 h-4" />
                        Uploaded {material.uploadDate}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                        <GraduationCap className="w-4 h-4" />
                        By {material.teacherName} ({material.schoolName})
                      </div>
                    </div>

                    <Button className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-none font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(255,99,33,1)]">
                      <Download className="w-5 h-5" />
                      Download Now
                    </Button>
                  </motion.div>
                ))}

                {filteredMaterials.length === 0 && (
                  <div className="col-span-full py-20 text-center border-8 border-dashed border-black/10">
                    <p className="text-3xl font-black text-black/20 uppercase italic">No materials available yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-32 h-32 bg-black flex items-center justify-center mb-8 rotate-3">
                <ShieldCheck className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-4xl font-black text-black uppercase tracking-tighter mb-4 italic">Section Under Maintenance</h2>
              <p className="text-xl font-bold text-gray-500 uppercase max-w-md">
                We're currently updating your {activeTab} portal to bring you a better learning experience!
              </p>
              <div className="mt-12 h-4 w-64 bg-[#FF6321] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

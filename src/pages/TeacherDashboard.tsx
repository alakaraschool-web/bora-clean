import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  LogOut, 
  LayoutDashboard, 
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  ChevronRight,
  ArrowLeft,
  Upload,
  Download,
  BarChart3,
  FileSpreadsheet,
  ClipboardList,
  Filter,
  ArrowUpDown,
  FileSpreadsheet as ExcelIcon,
  Users,
  Plus,
  UserPlus,
  Trash2,
  X,
  Menu,
  Edit3,
  Printer,
  Library,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { NotificationBell, addNotification } from '../components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx/xlsx.mjs';

import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_exams');
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: 'e1', 
        title: 'End of Term 2 Exams', 
        term: 'Term 2', 
        year: '2026', 
        classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'], 
        subjects: ['Mathematics', 'English', 'Science'],
        status: 'Active',
        published: false
      },
      { 
        id: 'e2', 
        title: 'Mid-Term 2 Assessment', 
        term: 'Term 2', 
        year: '2026', 
        classes: ['Form 1', 'Grade 7'], 
        subjects: ['Mathematics', 'Science'],
        status: 'Active',
        published: false
      }
    ];
  });
  const [activeExam, setActiveExam] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [marks, setMarks] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_marks');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMarks, setCurrentMarks] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'exams' | 'analysis' | 'class-management' | 'materials' | 'profile'>('exams');
  const [materialsSubTab, setMaterialsSubTab] = useState<'public' | 'my-materials'>('my-materials');
  const [entryConfig, setEntryConfig] = useState({
    classId: '',
    streamId: '',
    subject: '',
    examId: '',
    term: 'Term 2'
  });
  const [currentTeacher, setCurrentTeacher] = useState<any>(() => {
    const saved = localStorage.getItem('alakara_current_teacher');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTeacherData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        let profileId = session?.user.id;
        let profilePhone = session?.user.phone;

        // Fallback: Check localStorage if no session
        if (!profileId) {
          const savedTeacher = localStorage.getItem('alakara_current_teacher');
          if (savedTeacher) {
            const teacherObj = JSON.parse(savedTeacher);
            profileId = teacherObj.id;
            profilePhone = teacherObj.phone;
          }
        }

        if (profileId || profilePhone) {
          const query = supabase.from('profiles').select('*');
          if (profileId && !profileId.startsWith('demo-')) {
            query.eq('id', profileId);
          } else if (profilePhone) {
            query.eq('phone', profilePhone).eq('role', 'teacher');
          } else {
            // If it's a demo teacher and no phone, just keep currentTeacher if we have it
            if (currentTeacher && isMounted) {
              setIsLoading(false);
            }
            return;
          }

          const { data: profile } = await query.single();
          
          if (profile && isMounted) {
            setCurrentTeacher(profile);
            localStorage.setItem('alakara_current_teacher', JSON.stringify(profile));
          } else if (!profile && isMounted) {
            // If no profile found but we have one in localStorage, use it as fallback
            const savedTeacher = localStorage.getItem('alakara_current_teacher');
            if (savedTeacher) {
              setCurrentTeacher(JSON.parse(savedTeacher));
            } else {
              navigate('/teacher-login');
            }
          }
        } else if (isMounted) {
          navigate('/teacher-login');
        }
      } catch (error) {
        console.error('Teacher auth error:', error);
        // Fallback to localStorage on error
        const savedTeacher = localStorage.getItem('alakara_current_teacher');
        if (savedTeacher && isMounted) {
          setCurrentTeacher(JSON.parse(savedTeacher));
        } else if (isMounted) {
          navigate('/teacher-login');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('alakara_current_teacher');
        navigate('/teacher-login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) fetchTeacherData();
      }
    });

    fetchTeacherData();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!currentTeacher?.school_id) return;
      
      const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
      const school = allSchools.find((s: any) => s.id === currentTeacher.school_id);
      
      if (school) {
        const expiryDate = school.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt) : null;
        const now = new Date();
        const isExpired = expiryDate ? expiryDate < now : false;
        setIsSuspended(school.status === 'Suspended' || isExpired);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [currentTeacher?.school_id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-kenya-green animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium italic">Verifying teacher session...</p>
        </div>
      </div>
    );
  }

  if (!currentTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-kenya-green animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium italic">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchAllData = async () => {
      if (!currentTeacher?.school_id) return;
      
      try {
        // Fetch Students
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('school_id', currentTeacher.school_id);
        if (studentsData) setAllStudents(studentsData);

        // Fetch Classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', currentTeacher.school_id);
        if (classesData) setClasses(classesData);

        // Fetch Exams
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('school_id', currentTeacher.school_id);
        if (examsData) {
          setExams(examsData.map(e => ({
            ...e,
            schoolId: e.school_id,
            createdAt: e.created_at,
            classes: e.class_id ? [e.class_id] : [],
            subjects: e.subject_id ? [e.subject_id] : [],
            status: e.locked ? 'Completed' : 'Active',
            published: e.locked // Assuming locked means published for now
          })));
        }

        // Fetch Marks for all exams in this school
        const { data: examsForMarks } = await supabase
          .from('exams')
          .select('id')
          .eq('school_id', currentTeacher.school_id);
        
        let marksData = null;
        if (examsForMarks && examsForMarks.length > 0) {
          const examIds = examsForMarks.map(e => e.id);
          const { data } = await supabase
            .from('marks')
            .select('*')
            .in('exam_id', examIds);
          marksData = data;
        }
        if (marksData) {
          setMarks(marksData.map(m => ({
            id: m.id,
            examId: m.exam_id,
            studentId: m.student_id,
            subject: m.subject_id,
            score: String(m.score),
            grade: m.grade || '',
            updatedAt: m.created_at
          })));
        }

      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      }
    };

    fetchAllData();
  }, [currentTeacher?.school_id]);

  const [classes, setClasses] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_classes');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Form 1', teacherId: '1', capacity: 40 },
      { id: '2', name: 'Form 2', teacherId: '2', capacity: 40 },
      { id: '3', name: 'Form 3', teacherId: '3', capacity: 40 },
      { id: '4', name: 'Form 4', teacherId: '', capacity: 40 },
      { id: '5', name: 'Grade 7', teacherId: '', capacity: 40 },
      { id: '6', name: 'Grade 8', teacherId: '', capacity: 40 },
    ];
  });

  const [streams, setStreams] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_streams');
    if (saved) return JSON.parse(saved);
    return [
      { id: 's1', name: 'North', classId: '1' },
      { id: 's2', name: 'South', classId: '1' },
      { id: 's3', name: 'East', classId: '2' },
      { id: 's4', name: 'West', classId: '2' },
    ];
  });

  const [examMaterials, setExamMaterials] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_exam_materials');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    subject: 'Mathematics',
    fileType: 'PDF' as 'PDF' | 'DOCX' | 'ZIP',
    file: null as File | null
  });

  useEffect(() => {
    localStorage.setItem('alakara_exam_materials', JSON.stringify(examMaterials));
  }, [examMaterials]);

  const handleAddMaterial = (e: FormEvent) => {
    e.preventDefault();
    if (!newMaterial.file) {
      alert('Please select a file to upload.');
      return;
    }
    const material = {
      id: Math.random().toString(36).substr(2, 9),
      title: newMaterial.title,
      subject: newMaterial.subject,
      fileType: newMaterial.fileType,
      fileName: newMaterial.file.name,
      fileSize: (newMaterial.file.size / 1024).toFixed(1) + ' KB',
      schoolName: 'Bora School Academy',
      teacherName: currentTeacher.name,
      uploadDate: new Date().toLocaleDateString(),
      status: 'Pending',
      visibility: 'Public'
    };
    setExamMaterials([material, ...examMaterials]);
    setShowAddMaterialModal(false);
    setNewMaterial({ title: '', subject: 'Mathematics', fileType: 'PDF', file: null });
    alert('Material uploaded and sent for approval!');
  };

  const deleteMaterial = (id: string) => {
    if (window.confirm('Delete this material?')) {
      setExamMaterials(examMaterials.filter(m => m.id !== id));
    }
  };

  const [teacherRole] = useState<string>(currentTeacher?.role || 'Teacher');
  const [selectedAnalysisExamId, setSelectedAnalysisExamId] = useState('');
  const [selectedAnalysisClass, setSelectedAnalysisClass] = useState('All');
  const [analysisOptions, setAnalysisOptions] = useState({
    showGrades: true,
    showRank: true
  });

  const [assessmentCategories] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_assessment_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'final', name: 'Score', maxScore: 100 },
    ];
  });

  const assignments = currentTeacher?.assignments || [];
  const assignedClasses = Array.from(new Set(assignments.map((a: any) => {
    const cls = classes.find(c => c.id === a.classId);
    return cls ? cls.name : '';
  }).filter(Boolean))) as string[];
  
  const managedClass = classes.find(c => c.teacherId === currentTeacher?.id);

  const [learningAreas] = useState<string[]>(() => {
    const saved = localStorage.getItem('alakara_learning_areas');
    return saved ? JSON.parse(saved) : ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE'];
  });

  const [gradingSystem] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_grading');
    return saved ? JSON.parse(saved) : [
      { grade: 'A', min: 80, max: 100, points: 12 },
      { grade: 'A-', min: 75, max: 79, points: 11 },
      { grade: 'B+', min: 70, max: 74, points: 10 },
      { grade: 'B', min: 65, max: 69, points: 9 },
      { grade: 'B-', min: 60, max: 64, points: 8 },
      { grade: 'C+', min: 55, max: 59, points: 7 },
      { grade: 'C', min: 50, max: 54, points: 6 },
      { grade: 'C-', min: 45, max: 49, points: 5 },
      { grade: 'D+', min: 40, max: 44, points: 4 },
      { grade: 'D', min: 35, max: 39, points: 3 },
      { grade: 'D-', min: 30, max: 34, points: 2 },
      { grade: 'E', min: 0, max: 29, points: 1 },
    ];
  });

  // Load students from localStorage if available
  const [allStudents, setAllStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_students');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'S1', name: 'Alice Wanjiku', adm: 'ADM-2024-001', class: 'Form 1', streamId: 's1' },
      { id: 'S2', name: 'Bob Otieno', adm: 'ADM-2024-002', class: 'Form 2', streamId: 's3' },
      { id: 'S3', name: 'Charlie Mutua', adm: 'ADM-2024-003', class: 'Form 1', streamId: 's2' },
      { id: 'S4', name: 'Diana Anyango', adm: 'ADM-2024-004', class: 'Form 2', streamId: 's4' },
      { id: 'S5', name: 'Evans Kiprop', adm: 'ADM-2024-005', class: 'Form 1', streamId: 's1' },
    ];
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const schoolId = currentTeacher?.school_id || 'default-school';

      try {
        // Fetch from Supabase
        const [examsData, studentsData, classesData] = await Promise.all([
          supabaseService.getExams(schoolId),
          supabaseService.getStudents(schoolId),
          supabase.from('classes').select('*').eq('school_id', schoolId)
        ]);

        let marksData: { data: any[] | null } = { data: [] };
        if (examsData && examsData.length > 0) {
          const examIds = examsData.map(e => e.id);
          const { data } = await supabase.from('marks').select('*').in('exam_id', examIds);
          marksData = { data };
        }

        if (examsData) setExams(examsData);
        if (studentsData) setAllStudents(studentsData);
        if (classesData.data) setClasses(classesData.data);
        if (marksData.data) setMarks(marksData.data);

        // Still sync with localStorage for offline/legacy support if needed
        // But Supabase is now the primary source
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        
        // Fallback to localStorage on error
        const savedExams = localStorage.getItem('alakara_exams');
        if (savedExams) setExams(JSON.parse(savedExams));

        const savedStudents = localStorage.getItem('alakara_students');
        if (savedStudents) setAllStudents(JSON.parse(savedStudents));

        const savedClasses = localStorage.getItem('alakara_classes');
        if (savedClasses) setClasses(JSON.parse(savedClasses));
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Increased interval for Supabase
    return () => clearInterval(interval);
  }, [currentTeacher]);

  useEffect(() => {
    localStorage.setItem('alakara_marks', JSON.stringify(marks));
  }, [marks]);

  useEffect(() => {
    localStorage.setItem('alakara_students', JSON.stringify(allStudents));
  }, [allStudents]);

  const filteredStudents = activeExam ? allStudents.filter(s => {
    const selectedClass = classes.find(c => c.id === entryConfig.classId);
    const matchesClass = !entryConfig.classId || s.class?.trim() === selectedClass?.name?.trim();
    const matchesStream = !entryConfig.streamId || s.streamId === entryConfig.streamId;
    const classInExam = activeExam.classes.some((c: string) => c.trim() === s.class?.trim());
    const classInAssignments = assignedClasses.some((c: string) => c.trim() === s.class?.trim());
    return matchesClass && matchesStream && classInExam && classInAssignments;
  }) : [];

  const [newStudent, setNewStudent] = useState({ name: '', adm: '' });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(currentTeacher.avatar_url || null);
  const [publicResources, setPublicResources] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoadingResources(true);
      try {
        const resources = await supabaseService.getPublicResources();
        setPublicResources(resources || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setIsLoadingResources(false);
      }
    };
    if (activeTab === 'materials') {
      fetchResources();
    }
  }, [activeTab]);

  const handleAddStudent = (e: FormEvent) => {
    e.preventDefault();
    const student = {
      id: Math.random().toString(36).substr(2, 9),
      ...newStudent,
      class: managedClass,
      status: 'Active'
    };
    setAllStudents([...allStudents, student]);
    setNewStudent({ name: '', adm: '' });
    setShowAddStudentModal(false);
    alert('Student admitted successfully!');
  };

  const deleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      setAllStudents(allStudents.filter(s => s.id !== id));
    }
  };

  const addLog = (action: string, details: string) => {
    const saved = localStorage.getItem('alakara_audit_trail');
    const logs = saved ? JSON.parse(saved) : [];
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: currentTeacher.name,
      action,
      details
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem('alakara_audit_trail', JSON.stringify(updatedLogs));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('alakara_current_teacher');
    navigate('/teacher-login');
  };

  const startMarkEntry = async (exam: any) => {
    if (!entryConfig.classId || !entryConfig.subject) {
      alert('Please select BOTH a Class and a Subject in the configuration card above before entering marks.');
      return;
    }
    
    const selectedClass = classes.find(c => c.id === entryConfig.classId);
    if (selectedClass && !exam.classes.includes(selectedClass.name)) {
      alert(`The selected class (${selectedClass.name}) is not part of this examination (${exam.title}). Please select a valid class.`);
      return;
    }

    if (selectedClass && !assignedClasses.includes(selectedClass.name)) {
      alert(`You are not assigned to teach ${selectedClass.name}. Please select one of your assigned classes.`);
      return;
    }
    
    setIsFetchingStudents(true);
    // Simulate fetching student names from the database
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setActiveExam(exam);
    // Load existing marks for this exam and subject if any
    const examMarks = marks.filter(m => m.examId === exam.id && m.subject === entryConfig.subject);
    const marksMap: any = {};
    examMarks.forEach(m => {
      marksMap[m.studentId] = m.assessments || {};
    });
    setCurrentMarks(marksMap);
    setIsFetchingStudents(false);
  };

  const handleMarkChange = (studentId: string, categoryId: string, score: string) => {
    if (activeExam.status !== 'Active' || activeExam.locked) return;
    
    const category = assessmentCategories.find(c => c.id === categoryId);
    const numScore = parseFloat(score);
    
    if (score !== '' && (isNaN(numScore) || numScore < 0 || (category && numScore > category.maxScore))) {
      return; // Invalid input
    }

    const updatedStudentMarks = { 
      ...(currentMarks[studentId] || {}), 
      [categoryId]: score 
    };
    
    setCurrentMarks({ ...currentMarks, [studentId]: updatedStudentMarks });
    
    // Auto-save logic could go here, but for now we'll rely on the manual save or a debounced effect
  };

  const saveMarks = async (isFinal: boolean = false) => {
    if (activeExam.locked) {
      alert('This exam is locked and cannot be edited.');
      return;
    }

    if (isFinal && !window.confirm('Are you sure you want to submit these marks as final? You will not be able to edit them again unless the Principal unlocks them.')) {
      return;
    }

    const subject = entryConfig.subject || 'Mathematics';
    const newMarks = [...marks.filter(m => !(m.examId === activeExam.id && m.subject === subject))];
    
    Object.entries(currentMarks).forEach(([studentId, assessments]: [string, any]) => {
      let total = 0;
      Object.values(assessments).forEach(val => {
        if (val) total += parseFloat(val as string);
      });

      const percentage = total; 

      // Find grade
      const gradeObj = gradingSystem.find(g => percentage >= g.min && percentage <= g.max);
      const grade = gradeObj ? gradeObj.grade : 'E';

      newMarks.push({
        id: `${activeExam.id}-${studentId}-${subject}`,
        examId: activeExam.id,
        studentId,
        subject,
        assessments,
        total,
        percentage,
        grade,
        submitted: isFinal,
        updatedAt: new Date().toISOString()
      });
    });

    setMarks(newMarks);
    
    // Save to Supabase
    try {
      const supabaseMarks = newMarks
        .filter(m => m.examId === activeExam.id && m.subject === subject)
        .map(m => ({
          id: m.id || `${activeExam.id}-${m.studentId}-${subject}`,
          exam_id: m.examId,
          student_id: m.studentId,
          subject_id: m.subject,
          score: parseFloat(String(m.score || m.percentage)),
          grade: m.grade
        }));

      const { error } = await supabase.from('marks').upsert(supabaseMarks);
      if (error) throw error;

      addLog(isFinal ? 'Submit Marks' : 'Save Draft', `Updated marks for ${activeExam.title} (${subject})`);
      alert(isFinal ? 'Marks submitted as final!' : 'Marks saved successfully to Supabase!');
    } catch (error) {
      console.error('Error saving marks to Supabase:', error);
      alert('Failed to save marks to Supabase. Please check your connection.');
    }
    
    if (isFinal) {
      setActiveExam(null);
    }

    addNotification({
      title: isFinal ? 'Marks Submitted' : 'Draft Saved',
      message: `You have successfully ${isFinal ? 'submitted' : 'saved a draft of'} marks for "${activeExam.title}" - ${subject}.`,
      type: 'success',
      role: 'teacher',
      userId: currentTeacher.id
    });
  };

  const handleCSVImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length < 2) {
        alert('Invalid CSV file. No data found.');
        return;
      }

      const header = data[0];
      const admIdx = header.findIndex((h: any) => String(h).toLowerCase().includes('adm'));
      const scoreIdx = header.findIndex((h: any) => String(h).toLowerCase().includes('score') || String(h).toLowerCase().includes('mark'));

      if (admIdx === -1 || scoreIdx === -1) {
        alert('CSV must have "Admission Number" and "Score" columns.');
        return;
      }

      const preview: any[] = [];
      const errors: string[] = [];

      data.slice(1).forEach((row, idx) => {
        const adm = String(row[admIdx]).trim();
        const score = row[scoreIdx];
        const student = allStudents.find(s => s.adm === adm);

        if (!student) {
          errors.push(`Row ${idx + 2}: Student with ADM ${adm} not found.`);
        } else {
          preview.push({
            studentId: student.id,
            name: student.name,
            adm: student.adm,
            score: score,
            isValid: score !== undefined && !isNaN(parseFloat(score)) && parseFloat(score) >= 0 && parseFloat(score) <= 100
          });
        }
      });

      setImportPreviewData(preview);
      setImportErrors(errors);
      setShowImportPreview(true);
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    const newMarksMap = { ...currentMarks };
    importPreviewData.forEach(row => {
      if (row.isValid) {
        // Assuming primary subject for now
        newMarksMap[row.studentId] = { ...newMarksMap[row.studentId], final: String(row.score) };
      }
    });
    setCurrentMarks(newMarksMap);
    setShowImportPreview(false);
    alert('Marks imported to preview. Don\'t forget to click "Save All Marks" to persist changes.');
  };

  const handleProfilePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const publicUrl = await supabaseService.uploadAvatar(currentTeacher.id, file);
        setProfilePhoto(publicUrl);
        
        // Update profile in Supabase
        await supabaseService.updateProfile(currentTeacher.id, { avatar_url: publicUrl });
        
        // Update local state
        const updatedTeacher = { ...currentTeacher, avatar_url: publicUrl };
        setCurrentTeacher(updatedTeacher);
        localStorage.setItem('alakara_current_teacher', JSON.stringify(updatedTeacher));
        
        alert('Profile photo updated successfully!');
      } catch (error: any) {
        alert('Error uploading photo: ' + error.message);
      }
    }
  };

  const exportAnalysis = (format: 'excel' | 'pdf' = 'excel') => {
    if (!selectedAnalysisExamId || analysisData.length === 0) return;
    
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    
    if (format === 'excel') {
      const exportData = analysisData.map(row => ({
        'Rank': row.rank,
        'Adm No': row.adm,
        'Student Name': row.name,
        'Class': row.class,
        'Total Score': row.totalScore,
        'Average': row.average.toFixed(1),
        'Grade': row.grade
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Analysis");
      XLSX.writeFile(wb, `${exam?.title}_Analysis.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Performance Analysis', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`${exam?.title} (${exam?.term} ${exam?.year})`, 105, 25, { align: 'center' });
      
      autoTable(doc, {
        startY: 35,
        head: [['Rank', 'Adm', 'Name', 'Class', 'Total', 'Avg', 'Grade']],
        body: analysisData.map(row => [
          row.rank,
          row.adm,
          row.name,
          row.class,
          row.totalScore,
          row.average.toFixed(1),
          row.grade
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 51] }
      });
      
      doc.save(`${exam?.title}_Analysis.pdf`);
    }
  };

  const downloadMarksTemplate = () => {
    const data = [
      ['Admission Number', 'Score (0-100)'],
      ['ADM-2024-001', '85'],
      ['ADM-2024-002', '72']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, `${activeExam.title}_Marks_Template.xlsx`);
  };

  const [selectedRankingSubject, setSelectedRankingSubject] = useState('');

  const getAnalysisData = () => {
    if (!selectedAnalysisExamId) return [];
    
    const examMarks = marks.filter(m => m.examId === selectedAnalysisExamId);
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam || !exam.published) return [];

    // Group marks by student - Filtered by assigned classes
    const studentAnalysis = allStudents
      .filter(s => exam.classes.includes(s.class) && assignedClasses.includes(s.class) && (selectedAnalysisClass === 'All' || s.class === selectedAnalysisClass))
      .map(student => {
        const studentMarks = examMarks.filter(m => m.studentId === student.id);
        const subjectScores: any = {};
        let totalScore = 0;
        let subjectsCount = 0;

        learningAreas.forEach(la => {
          const mark = studentMarks.find(m => m.subject === la);
          const score = mark ? parseFloat(mark.score) : null;
          subjectScores[la] = score;
          if (score !== null) {
            totalScore += score;
            subjectsCount++;
          }
        });

        const average = subjectsCount > 0 ? totalScore / subjectsCount : 0;
        
        // Find grade
        const gradeObj = gradingSystem.find(g => average >= g.min && average <= g.max);
        const grade = gradeObj ? gradeObj.grade : 'E';

        return {
          id: student.id,
          name: student.name,
          adm: student.adm,
          class: student.class,
          subjectScores,
          totalScore,
          average,
          grade
        };
      });

    // Rank students
    const ranked = studentAnalysis.sort((a, b) => b.totalScore - a.totalScore);
    return ranked.map((s, index) => ({ ...s, rank: index + 1 }));
  };

  const analysisData = getAnalysisData();

  const getSubjectRanking = () => {
    if (!selectedAnalysisExamId || !selectedRankingSubject) return [];
    
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam || !exam.published) return [];

    const examMarks = marks.filter(m => m.examId === selectedAnalysisExamId && m.subject === selectedRankingSubject);
    
    const ranked = examMarks
      .map(m => {
        const student = allStudents.find(s => s.id === m.studentId);
        return {
          id: m.studentId,
          name: student?.name || 'Unknown',
          adm: student?.adm || 'N/A',
          score: parseFloat(m.score)
        };
      })
      .sort((a, b) => b.score - a.score);

    return ranked.map((s, index) => ({ ...s, rank: index + 1 }));
  };

  const subjectRanking = getSubjectRanking();

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-kenya-black text-white flex flex-col shrink-0 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-kenya-green p-2 rounded-lg group-hover:rotate-12 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Bora School <span className="text-kenya-red">Staff</span></span>
            </div>
            <button 
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => { setActiveTab('exams'); setActiveExam(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'exams' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              disabled={isSuspended}
            >
              <BookOpen className="w-5 h-5" />
              Examinations
            </button>
            <button 
              onClick={() => { setActiveTab('analysis'); setActiveExam(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'analysis' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              disabled={isSuspended}
            >
              <BarChart3 className="w-5 h-5" />
              Exam Analysis
            </button>
            <button 
              onClick={() => { setActiveTab('materials'); setActiveExam(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'materials' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              disabled={isSuspended}
            >
              <FileText className="w-5 h-5" />
              Materials
            </button>
            {teacherRole === 'Class Teacher' && (
              <button 
                onClick={() => { setActiveTab('class-management'); setActiveExam(null); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'class-management' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                disabled={isSuspended}
              >
                <Users className="w-5 h-5" />
                Class Management
              </button>
            )}
            <button 
              onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              My Profile
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-kenya-red transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {isSuspended && (
          <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-md flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white border-4 border-kenya-red p-10 shadow-[16px_16px_0px_0px_rgba(231,0,0,1)] text-center">
              <div className="w-20 h-20 bg-kenya-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-10 h-10 text-kenya-red" />
              </div>
              <h2 className="text-3xl font-black text-kenya-black uppercase tracking-tighter mb-4 italic">School Suspended</h2>
              <p className="text-gray-600 font-bold uppercase text-sm leading-relaxed mb-8">
                Access to this school's portal has been suspended by the super admin or the subscription has expired. Please contact support for more information.
              </p>
              <div className="h-2 w-full bg-kenya-red/20 rounded-full overflow-hidden">
                <div className="h-full bg-kenya-red animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-kenya-black" />
            </button>
            <h2 className="font-bold text-kenya-black text-lg truncate max-w-[150px] sm:max-w-none">
              {activeExam ? `Mark Entry: ${activeExam.title}` : 'Teacher Portal'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell role="teacher" userId={currentTeacher.id} />
            <div className="text-right">
              <p className="text-sm font-bold text-kenya-black">{currentTeacher?.name || 'Teacher'}</p>
              <p className="text-xs text-gray-500">{currentTeacher?.role || 'Staff'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-kenya-green/10 flex items-center justify-center overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-5 h-5 text-kenya-green" />
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {activeTab === 'exams' ? (
            !activeExam ? (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-kenya-black">Mark Entry Configuration</h2>
                    {entryConfig.classId && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-kenya-green/10 text-kenya-green rounded-full">
                        <Users className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {allStudents.filter(s => {
                            const className = classes.find(c => c.id === entryConfig.classId)?.name;
                            const matchesClass = s.class?.trim() === className?.trim();
                            const matchesStream = !entryConfig.streamId || s.streamId === entryConfig.streamId;
                            return matchesClass && matchesStream;
                          }).length} Students Found
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class</label>
                      <select 
                        value={entryConfig.classId}
                        onChange={(e) => setEntryConfig({...entryConfig, classId: e.target.value, streamId: ''})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                      >
                        <option value="">Select Class...</option>
                        {classes.filter(c => assignedClasses.includes(c.name)).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stream</label>
                      <select 
                        value={entryConfig.streamId}
                        onChange={(e) => setEntryConfig({...entryConfig, streamId: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                      >
                        <option value="">All Streams</option>
                        {streams.filter(s => s.classId === entryConfig.classId).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</label>
                      <select 
                        value={entryConfig.subject}
                        onChange={(e) => setEntryConfig({...entryConfig, subject: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                      >
                        <option value="">Select Subject...</option>
                        {Array.from(new Set((currentTeacher?.assignments || []).map((a: any) => a.subject))).map((s: any) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Term</label>
                      <select 
                        value={entryConfig.term}
                        onChange={(e) => setEntryConfig({...entryConfig, term: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                      >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                  </div>
                  
                  {entryConfig.classId && entryConfig.subject && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={async () => {
                          setIsFetchingStudents(true);
                          await new Promise(resolve => setTimeout(resolve, 800));
                          
                          // Actually reload from localStorage
                          const savedStudents = localStorage.getItem('alakara_students');
                          if (savedStudents) {
                            setAllStudents(JSON.parse(savedStudents));
                          }
                          
                          const savedClasses = localStorage.getItem('alakara_classes');
                          if (savedClasses) {
                            setClasses(JSON.parse(savedClasses));
                          }

                          const savedStreams = localStorage.getItem('alakara_streams');
                          if (savedStreams) {
                            setStreams(JSON.parse(savedStreams));
                          }

                          setIsFetchingStudents(false);
                          alert('Student list synchronized for ' + entryConfig.subject);
                        }}
                        disabled={isFetchingStudents}
                        className="gap-2 rounded-xl"
                      >
                        {isFetchingStudents ? (
                          <div className="w-4 h-4 border-2 border-kenya-green/30 border-t-kenya-green rounded-full animate-spin" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                        Fetch Student Names
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Active Examinations</h1>
                    <p className="text-gray-500">Select an exam to start entering or viewing marks.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams
                    .filter(exam => exam.classes.some((c: string) => assignedClasses.includes(c)))
                    .map((exam) => (
                      <motion.div
                        key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-kenya-green/10 p-3 rounded-2xl group-hover:rotate-6 transition-transform">
                          <BookOpen className="w-6 h-6 text-kenya-green" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exam.status === 'Active' ? 'bg-kenya-green/10 text-kenya-green' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {exam.status === 'Active' ? 'Open for Marks' : 'Processed (View Only)'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-kenya-black mb-1">{exam.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{exam.term} - {exam.year}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {exam.classes.map((c: string) => (
                          <span key={c} className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600 uppercase">
                            {c}
                          </span>
                        ))}
                      </div>

                      <Button 
                        onClick={() => startMarkEntry(exam)}
                        className="w-full gap-2 rounded-2xl"
                        variant={exam.status === 'Active' ? 'default' : 'secondary'}
                        disabled={isFetchingStudents || (exam.status !== 'Active' && !exam.published)}
                      >
                        {isFetchingStudents ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Fetching Students...
                          </div>
                        ) : (
                          <>
                            {exam.status === 'Active' ? 'Enter Marks' : (exam.published ? 'View Performance' : 'Results Pending')}
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}

                  {exams.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-bold text-gray-400 uppercase tracking-tight">No active exams assigned yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveExam(null)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-kenya-black transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Exams
                  </button>
                  <div className="flex items-center gap-4">
                    {activeExam.status === 'Active' && (
                      <>
                        <input 
                          type="file" 
                          id="bulk-upload" 
                          className="hidden" 
                          accept=".csv"
                          onChange={handleCSVImport}
                        />
                        <Button 
                          variant="secondary" 
                          onClick={() => document.getElementById('bulk-upload')?.click()}
                          className="gap-2 rounded-2xl"
                        >
                          <Upload className="w-4 h-4" />
                          Bulk Upload (Excel)
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={downloadMarksTemplate}
                          className="gap-2 rounded-2xl"
                        >
                          <Download className="w-4 h-4" />
                          Template
                        </Button>
                        <Button onClick={() => saveMarks(false)} variant="secondary" className="gap-2 rounded-2xl">
                          <Save className="w-4 h-4" />
                          Save Draft
                        </Button>
                        <Button onClick={() => saveMarks(true)} className="gap-2 rounded-2xl shadow-lg shadow-kenya-green/20">
                          <CheckCircle2 className="w-4 h-4" />
                          Submit Final
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-kenya-black">Student Mark Entry</h2>
                        <p className="text-gray-500">Subject: {entryConfig.subject} | Class: {classes.find(c => c.id === entryConfig.classId)?.name} {streams.find(s => s.id === entryConfig.streamId)?.name || ''}</p>
                      </div>
                      {activeExam.status !== 'Active' && (
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Marks Processed - Read Only
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="px-8 py-4">Admission No</th>
                          <th className="px-8 py-4">Student Name</th>
                          {assessmentCategories.map(cat => (
                            <th key={cat.id} className="px-4 py-4 text-center w-32">
                              {cat.name}
                              <span className="block text-[8px] opacity-60">Max: {cat.maxScore}</span>
                            </th>
                          ))}
                          <th className="px-8 py-4 text-center">Total</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student) => {
                            const studentAssessments = currentMarks[student.id] || {};
                            let rowTotal = 0;
                            Object.values(studentAssessments).forEach(val => {
                              if (val) rowTotal += parseFloat(val as string);
                            });

                            return (
                              <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6 font-mono text-sm text-gray-500">{student.adm}</td>
                                <td className="px-8 py-6 font-bold text-kenya-black">{student.name}</td>
                                {assessmentCategories.map(cat => (
                                  <td key={cat.id} className="px-4 py-6">
                                    <input 
                                      type="number"
                                      min="0"
                                      max={cat.maxScore}
                                      value={studentAssessments[cat.id] || ''}
                                      onChange={(e) => handleMarkChange(student.id, cat.id, e.target.value)}
                                      disabled={activeExam.status !== 'Active' || activeExam.locked}
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-center disabled:opacity-50"
                                      placeholder="--"
                                    />
                                  </td>
                                ))}
                                <td className="px-8 py-6 text-center">
                                  <span className="text-lg font-black text-kenya-black">{rowTotal}</span>
                                </td>
                                <td className="px-8 py-6">
                                  {Object.keys(studentAssessments).length === assessmentCategories.length ? (
                                    <span className="text-kenya-green flex items-center gap-1 text-xs font-bold uppercase">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Complete
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 flex items-center gap-1 text-xs font-bold uppercase">
                                      <Clock className="w-4 h-4" />
                                      Partial
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        {filteredStudents.length === 0 && (
                          <tr>
                            <td colSpan={assessmentCategories.length + 4} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center gap-2 text-gray-400">
                                <Users className="w-12 h-12 opacity-20" />
                                <p className="font-bold uppercase tracking-tight">No students found for this selection</p>
                                <p className="text-xs">Check your class/stream selection or ensure students are assigned to this exam.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )
          ) : activeTab === 'analysis' ? (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-kenya-black uppercase tracking-tight">Performance Analysis</h3>
                    <p className="text-sm text-gray-500">View detailed results and subject rankings.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {selectedAnalysisExamId && (
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => exportAnalysis('excel')} className="gap-2 rounded-xl">
                          <ExcelIcon className="w-4 h-4" />
                          Excel
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => exportAnalysis('pdf')} className="gap-2 rounded-xl">
                          <Download className="w-4 h-4" />
                          PDF
                        </Button>
                      </div>
                    )}
                    <select 
                      value={selectedAnalysisClass}
                      onChange={(e) => setSelectedAnalysisClass(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                    >
                      <option value="All">All My Classes</option>
                      {assignedClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedAnalysisExamId}
                      onChange={(e) => setSelectedAnalysisExamId(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                    >
                      <option value="">Select Examination...</option>
                      {exams
                        .filter(e => e.published && e.classes.some((c: string) => assignedClasses.includes(c)))
                        .map(e => (
                          <option key={e.id} value={e.id}>{e.title} ({e.term} {e.year})</option>
                        ))}
                    </select>
                  </div>
                </div>

                {!selectedAnalysisExamId ? (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium italic">Please select an examination to begin analysis.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          {analysisOptions.showRank && <th className="px-4 py-4 sticky left-0 bg-gray-50 z-10">Rank</th>}
                          <th className="px-4 py-4 sticky left-0 bg-gray-50 z-10">Adm No</th>
                          <th className="px-4 py-4 sticky left-0 bg-gray-50 z-10 min-w-[150px]">Student Name</th>
                          {learningAreas.map(la => (
                            <th key={la} className="px-4 py-4 text-center min-w-[80px]">{la}</th>
                          ))}
                          <th className="px-4 py-4 text-center font-black text-kenya-black">Total</th>
                          <th className="px-4 py-4 text-center font-black text-kenya-black">Avg</th>
                          {analysisOptions.showGrades && <th className="px-4 py-4 text-center font-black text-kenya-black">Grade</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analysisData.map((row: any) => (
                          <tr key={row.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                            {analysisOptions.showRank && (
                              <td className="px-4 py-4 sticky left-0 bg-white z-10">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                                  row.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                                  row.rank === 2 ? 'bg-gray-100 text-gray-600' :
                                  row.rank === 3 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                                }`}>
                                  {row.rank}
                                </span>
                              </td>
                            )}
                            <td className="px-4 py-4 font-mono text-xs text-gray-500 sticky left-0 bg-white z-10">{row.adm}</td>
                            <td className="px-4 py-4 font-bold text-kenya-black sticky left-0 bg-white z-10">{row.name}</td>
                            {learningAreas.map(la => {
                              const score = row.subjectScores[la];
                              const gradeObj = gradingSystem.find(g => score !== null && score >= g.min && score <= g.max);
                              return (
                                <td key={la} className="px-4 py-4 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className={`font-bold ${score === null ? 'text-gray-300' : 'text-kenya-black'}`}>
                                      {score !== null ? score : '--'}
                                    </span>
                                    {analysisOptions.showGrades && score !== null && (
                                      <span className="text-[10px] font-black text-kenya-green">{gradeObj?.grade}</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-4 text-center font-black text-kenya-black">{row.totalScore.toFixed(0)}</td>
                            <td className="px-4 py-4 text-center font-bold text-kenya-green">{row.average.toFixed(1)}%</td>
                            {analysisOptions.showGrades && (
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-kenya-green/10 text-kenya-green">
                                  {row.grade}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedAnalysisExamId && (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-kenya-black">Subject Ranking</h3>
                      <p className="text-sm text-gray-500">Rank students based on individual learning areas.</p>
                    </div>
                    <select 
                      value={selectedRankingSubject}
                      onChange={(e) => setSelectedRankingSubject(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                    >
                      <option value="">Select Subject...</option>
                      {learningAreas.map(la => (
                        <option key={la} value={la}>{la}</option>
                      ))}
                    </select>
                  </div>

                  {!selectedRankingSubject ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <Filter className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">Select a subject to view rankings.</p>
                    </div>
                  ) : subjectRanking.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">No marks recorded for this subject yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subjectRanking.slice(0, 10).map((row) => (
                        <div key={row.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                            row.rank === 1 ? 'bg-yellow-400 text-white' : 
                            row.rank === 2 ? 'bg-gray-300 text-white' :
                            row.rank === 3 ? 'bg-orange-400 text-white' : 'bg-white text-gray-400 border border-gray-200'
                          }`}>
                            {row.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-kenya-black truncate">{row.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono uppercase">{row.adm}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-kenya-green">{row.score}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'materials' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Learning Materials</h1>
                  <p className="text-gray-500">Access and manage educational resources for your classes.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button 
                      onClick={() => setMaterialsSubTab('my-materials')}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${materialsSubTab === 'my-materials' ? 'bg-white text-kenya-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      My Assignments
                    </button>
                    <button 
                      onClick={() => setMaterialsSubTab('public')}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${materialsSubTab === 'public' ? 'bg-white text-kenya-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Public Resources
                    </button>
                  </div>
                </div>
              </div>

              {materialsSubTab === 'my-materials' ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search materials..." 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <select className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-sm">
                      <option value="">All Subjects</option>
                      {Array.from(new Set((currentTeacher?.assignments || []).map((a: any) => a.subject))).map((s: any) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-bold text-sm">
                      <option value="">All Classes</option>
                      {Array.from(new Set((currentTeacher?.assignments || []).map((a: any) => a.classId))).map((c: any) => {
                        const className = classes.find(cl => cl.id === c)?.name || `Class ${c}`;
                        return <option key={c} value={c}>{className}</option>;
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {examMaterials
                      .filter(m => (currentTeacher?.assignments || []).some((a: any) => a.subject === m.subject))
                      .map((material) => (
                      <div key={material.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-kenya-green/10 p-3 rounded-2xl group-hover:rotate-6 transition-transform">
                            <BookOpen className="w-6 h-6 text-kenya-green" />
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{material.fileType}</span>
                        </div>
                        <h3 className="text-lg font-bold text-kenya-black mb-1 truncate">{material.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">{material.subject}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">Grade 7</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase mb-6">
                          <span>{material.uploadedAt || '2024-03-15'}</span>
                          <span>By Admin</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" className="flex-1 gap-2 rounded-2xl py-2 text-xs">
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                          <Button variant="ghost" className="flex-1 gap-2 rounded-2xl py-2 text-xs border border-gray-100">
                            <Search className="w-3 h-3" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(examMaterials.filter(m => (currentTeacher?.assignments || []).some((a: any) => a.subject === m.subject)).length === 0) && (
                      <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-200">
                        <Library className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl font-bold text-gray-400 uppercase tracking-tight">No materials assigned to your subjects</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingResources ? (
                    <div className="col-span-full py-20 text-center">
                      <div className="animate-spin w-10 h-10 border-4 border-kenya-green border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-500 font-bold">Loading resources...</p>
                    </div>
                  ) : publicResources.length > 0 ? (
                    publicResources.map((resource) => (
                      <div key={resource.name} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="bg-blue-50 p-3 rounded-2xl w-fit mb-4 group-hover:rotate-6 transition-transform">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-kenya-black mb-1 truncate">{resource.name}</h3>
                        <p className="text-xs text-gray-500 mb-6 uppercase font-bold tracking-wider">Public Resource</p>
                        
                        <Button 
                          variant="secondary" 
                          className="w-full gap-2 rounded-2xl"
                          onClick={async () => {
                            const url = await supabaseService.getResourceUrl(resource.name);
                            window.open(url, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-bold text-gray-400 uppercase tracking-tight">No public resources available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'class-management' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Class Management</h1>
                  <p className="text-gray-500">Managing {managedClass?.name || 'Assigned Class'}</p>
                </div>
                <Button onClick={() => setShowAddStudentModal(true)} className="gap-2 rounded-2xl">
                  <UserPlus className="w-4 h-4" />
                  Admit Student
                </Button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-kenya-black">Student List</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-kenya-green/10 text-kenya-green rounded-full text-[10px] font-black uppercase tracking-widest">
                      {allStudents.filter(s => s.class === managedClass?.name).length} Students
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <th className="px-8 py-4">Admission No</th>
                        <th className="px-8 py-4">Full Name</th>
                        <th className="px-8 py-4">Stream</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allStudents
                        .filter(s => s.class?.trim() === managedClass?.name?.trim())
                        .map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6 font-mono text-sm text-gray-500">{student.adm}</td>
                            <td className="px-8 py-6 font-bold text-kenya-black">{student.name}</td>
                            <td className="px-8 py-6 text-sm text-gray-500">
                              {streams.find(st => st.id === student.streamId)?.name || 'N/A'}
                            </td>
                            <td className="px-8 py-6">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-kenya-green/10 text-kenya-green">
                                {student.status || 'Active'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => deleteStudent(student.id)}
                                  className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                  title="Remove Student"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {allStudents.filter(s => s.class === managedClass?.name).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                            No students admitted to this class yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="h-48 bg-kenya-black relative">
                  <div className="absolute -bottom-16 left-12">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl">
                        <div className="w-full h-full rounded-[1.5rem] bg-gray-100 overflow-hidden flex items-center justify-center">
                          {profilePhoto ? (
                            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-12 h-12 text-gray-300" />
                          )}
                        </div>
                      </div>
                      <label className="absolute bottom-2 right-2 p-2 bg-kenya-green text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpload} />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-20 p-12">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight mb-2">{currentTeacher.name}</h1>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-kenya-green/10 text-kenya-green rounded-full text-[10px] font-black uppercase tracking-widest">
                          {currentTeacher.role}
                        </span>
                        <span className="text-gray-400">•</span>
                        <p className="text-gray-500 font-medium">Mathematics Department</p>
                      </div>
                    </div>
                    <Button variant="secondary" className="rounded-2xl">Edit Profile</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-kenya-black uppercase tracking-widest border-b border-gray-100 pb-2">Assigned Classes</h3>
                      <div className="flex flex-wrap gap-3">
                        {assignedClasses.map(c => (
                          <div key={c} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-kenya-green font-bold shadow-sm">
                              {c.charAt(0)}
                            </div>
                            <span className="font-bold text-kenya-black">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-kenya-black uppercase tracking-widest border-b border-gray-100 pb-2">Account Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-500">Phone</span>
                          <span className="text-sm font-bold text-kenya-black">{currentTeacher.phone || '+254 700 000 000'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-500">Employee ID</span>
                          <span className="text-sm font-bold text-kenya-black">EMP-2024-089</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-500">Status</span>
                          <span className="text-sm font-bold text-kenya-green">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-kenya-black mb-4">My Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-kenya-green/10 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-kenya-green" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-kenya-black">{currentTeacher.name}</p>
                    <p className="text-gray-500">{currentTeacher.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Phone Number / Username</p>
                    <p className="font-bold text-kenya-black">{currentTeacher.username || currentTeacher.phone || '+254 700 000 000'}</p>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Staff ID</p>
                    <p className="font-bold text-kenya-black">STF-2024-088</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Add Material Modal */}
        {showAddMaterialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">Upload Material</h3>
                <button onClick={() => setShowAddMaterialModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Material Title</label>
                  <input 
                    type="text" 
                    required
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. Mathematics Revision Guide"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Subject</label>
                  <select 
                    value={newMaterial.subject}
                    onChange={(e) => setNewMaterial({...newMaterial, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    {learningAreas.map(la => (
                      <option key={la} value={la}>{la}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">File Type</label>
                  <select 
                    value={newMaterial.fileType}
                    onChange={(e) => setNewMaterial({...newMaterial, fileType: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word Document</option>
                    <option value="ZIP">Compressed Archive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Select File</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewMaterial({...newMaterial, file});
                      }}
                      className="hidden"
                      id="material-file-upload"
                    />
                    <label 
                      htmlFor="material-file-upload"
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-500 truncate">
                        {newMaterial.file ? newMaterial.file.name : 'Choose a file...'}
                      </span>
                      <Upload className="w-4 h-4 text-kenya-green" />
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">Upload & Send for Approval</Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">Admit New Learner</h3>
                <button onClick={() => setShowAddStudentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Admission Number</label>
                  <input 
                    type="text" 
                    required
                    value={newStudent.adm}
                    onChange={(e) => setNewStudent({...newStudent, adm: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. ADM-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Class</label>
                  <input 
                    type="text" 
                    value={managedClass}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold"
                  />
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">Admit Learner</Button>
              </form>
            </motion.div>
          </div>
        )}
        {/* Import Preview Modal */}
        {showImportPreview && (
          <div className="fixed inset-0 bg-kenya-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-black text-kenya-black uppercase tracking-tight">CSV Import Preview</h2>
                  <p className="text-sm text-gray-500">Review the data before confirming the import.</p>
                </div>
                <button onClick={() => setShowImportPreview(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {importErrors.length > 0 && (
                  <div className="mb-8 p-4 bg-kenya-red/10 border border-kenya-red/20 rounded-2xl">
                    <div className="flex items-center gap-2 text-kenya-red font-bold mb-2">
                      <AlertCircle className="w-5 h-5" />
                      Import Errors Found
                    </div>
                    <ul className="text-sm text-kenya-red/80 list-disc list-inside">
                      {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Adm No</th>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4 text-center">Score</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importPreviewData.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-gray-500">{row.adm}</td>
                          <td className="px-6 py-4 font-bold text-kenya-black">{row.name}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-black text-lg ${row.isValid ? 'text-kenya-black' : 'text-kenya-red'}`}>
                              {row.score}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {row.isValid ? (
                              <span className="text-kenya-green flex items-center gap-1 text-[10px] font-black uppercase">
                                <CheckCircle2 className="w-3 h-3" />
                                Valid
                              </span>
                            ) : (
                              <span className="text-kenya-red flex items-center gap-1 text-[10px] font-black uppercase">
                                <AlertCircle className="w-3 h-3" />
                                Invalid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setShowImportPreview(false)} className="rounded-2xl">Cancel</Button>
                <Button 
                  onClick={confirmImport} 
                  disabled={importPreviewData.length === 0 || importPreviewData.every(r => !r.isValid)}
                  className="rounded-2xl gap-2 shadow-lg shadow-kenya-green/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Import ({importPreviewData.filter(r => r.isValid).length} Records)
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Bell, 
  Search,
  ShieldAlert,
  Phone,
  Edit,
  AlertTriangle,
  Plus,
  Trash2,
  UserPlus,
  User,
  Camera,
  Mail,
  ShieldCheck,
  Check,
  X,
  Menu,
  MoreVertical,
  PlusCircle,
  Library,
  BarChart3,
  FileSpreadsheet,
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  UserCheck,
  Upload,
  Download,
  ArrowUpDown,
  Filter,
  Globe,
  Building2,
  Image as ImageIcon,
  Quote,
  Trophy,
  Edit3,
  Printer,
  Save,
  Loader2
} from 'lucide-react';
import { NotificationBell, addNotification } from '../components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Letterhead } from '../components/Letterhead';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx/xlsx.mjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';

import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(() => {
    const saved = localStorage.getItem('alakara_current_school');
    return saved ? JSON.parse(saved) : null;
  });
  const [principalProfile, setPrincipalProfile] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSchoolData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        let profileId = session?.user.id;
        let profileEmail = session?.user.email;

        // Fallback: Check localStorage if no session
        if (!profileId) {
          const savedSchool = localStorage.getItem('alakara_current_school');
          if (savedSchool) {
            const schoolObj = JSON.parse(savedSchool);
            profileEmail = schoolObj.principalEmail;
          }
        }

        if (profileId || profileEmail) {
          const query = supabase.from('profiles').select('*');
          if (profileId) {
            query.eq('id', profileId);
          } else {
            query.eq('email', profileEmail).eq('role', 'principal');
          }

          const { data: profile } = await query.single();
          
          if (profile && isMounted) {
            setPrincipalProfile(profile);
            const { data: schoolData } = await supabase
              .from('schools')
              .select('*')
              .eq('id', profile.school_id)
              .single();
            
            if (schoolData && isMounted) {
              setSchool(schoolData);
              localStorage.setItem('alakara_current_school', JSON.stringify(schoolData));
            }
          } else if (!profile && isMounted) {
            // Fallback to localStorage if profile fetch fails
            const savedSchool = localStorage.getItem('alakara_current_school');
            if (savedSchool) {
              setSchool(JSON.parse(savedSchool));
            } else {
              navigate('/principal-login');
            }
          }
        } else if (isMounted) {
          // Check if we have a school in localStorage even without a session
          const savedSchool = localStorage.getItem('alakara_current_school');
          if (savedSchool) {
            setSchool(JSON.parse(savedSchool));
          } else {
            navigate('/principal-login');
          }
        }
      } catch (error) {
        console.error('Principal auth error:', error);
        const savedSchool = localStorage.getItem('alakara_current_school');
        if (savedSchool && isMounted) {
          setSchool(JSON.parse(savedSchool));
        } else if (isMounted) {
          navigate('/principal-login');
        }
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('alakara_current_school');
        navigate('/principal-login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) fetchSchoolData();
      }
    });

    fetchSchoolData();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-kenya-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-kenya-green animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-medium italic">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-kenya-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-kenya-green animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-medium italic">Verifying credentials...</p>
        </div>
      </div>
    );
  }
  useEffect(() => {
    if (!school?.id) return;

    const loadAllData = async () => {
      try {
        // Fetch Students
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('school_id', school.id);
        if (studentsData) {
          setStudents(studentsData.map(s => ({
            id: s.id,
            name: s.name,
            adm: s.admission_number || s.adm,
            class: s.class,
            status: 'Active',
            gender: s.gender || 'Male',
            profile_image: s.profile_image || null,
            password: s.password
          })));
        }

        // Fetch Staff (Profiles)
        const { data: staffData } = await supabase
          .from('profiles')
          .select('*')
          .eq('school_id', school.id);
        if (staffData) {
          setStaff(staffData.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role.charAt(0).toUpperCase() + p.role.slice(1),
            status: 'Active',
            assignments: p.assignments || [],
            password: p.password
          })));
        }

        // Fetch Classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', school.id);
        if (classesData) {
          setClasses(classesData.map(c => ({
            id: c.id,
            name: c.name,
            teacherId: c.teacher_id,
            capacity: c.capacity
          })));
        }

        // Fetch Exams
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('school_id', school.id);
        if (examsData) {
          setExams(examsData.map(e => ({
            id: e.id,
            title: e.title,
            term: e.term,
            year: e.year,
            classes: e.classes || [],
            subjects: e.subjects || [],
            status: e.status,
            published: e.published,
            weighting: e.weighting
          })));
        }

        // Fetch Marks
        if (examsData && examsData.length > 0) {
          const examIds = examsData.map(e => e.id);
          const { data: marksData } = await supabase
            .from('marks')
            .select('*')
            .in('exam_id', examIds);
          if (marksData) {
            setMarks(marksData.map(m => ({
              id: m.id,
              examId: m.exam_id,
              studentId: m.student_id,
              subject: m.subject,
              score: String(m.score),
              total: m.score,
              grade: m.grade
            })));
          }
        }

        // Fetch School Settings
        const { data: settingsData } = await supabase
          .from('school_settings')
          .select('*')
          .eq('school_id', school.id)
          .single();
        if (settingsData) {
          setSchoolSettings({
            name: settingsData.name || school.name,
            address: settingsData.address || '',
            website: settingsData.website || '',
            phone: settingsData.phone || '',
            email: settingsData.email || '',
            logo: settingsData.logo_url || null
          });
          if (settingsData.grading_system) {
            setGradingSystem(settingsData.grading_system);
          }
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
      }
    };

    loadAllData();
  }, [school?.id]);

  const [isSuspended, setIsSuspended] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [daysToExpiry, setDaysToExpiry] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'students' | 'academic' | 'settings' | 'classes' | 'users'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [managingClass, setManagingClass] = useState<any>(null);
  const [academicSubTab, setAcademicSubTab] = useState<'overview' | 'create-exam' | 'learning-area' | 'grading' | 'analysis' | 'reports' | 'results-processing' | 'academic-settings' | 'merit-list' | 'marks-entry'>('overview');
  const [topXCount, setTopXCount] = useState(10);
  const [topXSubjectChampionsCount, setTopXSubjectChampionsCount] = useState(1);
  const [selectedProcessingClass, setSelectedProcessingClass] = useState('All');
  const [selectedAnalysisClass, setSelectedAnalysisClass] = useState('All');
  const [selectedProcessingExamId, setSelectedProcessingExamId] = useState('');
  
  const [pendingMarks, setPendingMarks] = useState<{ [key: string]: string }>({});
  const [stagedMarks, setStagedMarks] = useState<any[] | null>(null);

  const handleBulkMarksUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Assuming format: [Admission No, Subject1, Subject2, ...]
      // Header row: Admission Number, Math, English, Science, ...
      const header = data[0];
      const subjectIndices: { [key: string]: number } = {};
      
      header.forEach((cell, idx) => {
        const la = String(cell).trim();
        if (learningAreas.includes(la)) {
          subjectIndices[la] = idx;
        }
      });

      const newMarks = [...marks];
      const examId = selectedProcessingExamId;
      
      if (!examId) {
        alert('Please select an examination first.');
        return;
      }

      data.slice(1).forEach((row) => {
        const admNo = String(row[0]).trim();
        const student = students.find(s => s.adm === admNo);
        
        if (student) {
          Object.entries(subjectIndices).forEach(([subject, idx]) => {
            let score = parseFloat(String(row[idx]));
            if (isNaN(score)) return;
            
            // Validation: No subject should have more than 100 percent
            if (score > 100) score = 100;
            if (score < 0) score = 0;

            const scoreStr = String(score);
            
            // Remove existing mark for this student/exam/subject
            const markIdx = newMarks.findIndex(m => m.studentId === student.id && m.examId === examId && m.subject === subject);
            const markData = {
              id: Math.random().toString(36).substr(2, 9),
              examId,
              studentId: student.id,
              score: scoreStr,
              subject,
              updatedAt: new Date().toISOString()
            };
            
            if (markIdx > -1) {
              newMarks[markIdx] = markData;
            } else {
              newMarks.push(markData);
            }
          });
        }
      });

      setStagedMarks(newMarks);
      alert('Bulk marks processed. Please click "Save Changes" to finalize.');
    };
    reader.readAsBinaryString(file);
  };

  const saveStagedMarks = async () => {
    if (stagedMarks) {
      try {
        const examId = selectedProcessingExamId;
        const supabaseMarks = stagedMarks
          .filter(m => m.examId === examId)
          .map(m => ({
            id: m.id || `${examId}-${m.studentId}-${m.subject}`,
            exam_id: examId,
            student_id: m.studentId,
            subject_id: m.subject,
            score: parseFloat(String(m.score)),
            created_at: new Date().toISOString()
          }));

        const { error } = await supabase.from('marks').upsert(supabaseMarks);
        if (error) throw error;

        setMarks(stagedMarks);
        setStagedMarks(null);
        alert('Bulk marks saved and synced successfully to Supabase!');
      } catch (error) {
        console.error('Error syncing bulk marks:', error);
        alert('Failed to sync marks to Supabase. Local state updated.');
        setMarks(stagedMarks);
        setStagedMarks(null);
      }
    }
  };

  const savePendingMarks = () => {
    const newMarks = [...marks];
    (Object.entries(pendingMarks) as [string, string][]).forEach(([key, score]) => {
      const [examId, studentId, subject] = key.split('|');
      const markIdx = newMarks.findIndex(m => m.studentId === studentId && m.examId === examId && m.subject === subject);
      
      const markData = {
        id: `${examId}-${studentId}-${subject}`,
        examId,
        studentId,
        subject,
        score: score,
        total: parseFloat(score || '0'),
        grade: 'C', // Simplified
        points: 6, // Simplified
        remarks: 'Good'
      };

      if (markIdx >= 0) {
        newMarks[markIdx] = markData;
      } else {
        newMarks.push(markData);
      }
    });
    setMarks(newMarks);
    setPendingMarks({});
    alert('Marks saved successfully!');
  };

  const printRawMarks = () => {
    if (!selectedProcessingExamId) {
      alert('Please select an examination first.');
      return;
    }
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text(schoolSettings.name.toUpperCase(), 148.5, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`RAW MARKS LIST: ${exam?.title} (${exam?.term} ${exam?.year})`, 148.5, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Class: ${selectedProcessingClass}`, 148.5, 38, { align: 'center' });

    const header = ['ADM', 'NAME', ...learningAreas.map(la => la.substring(0, 3).toUpperCase())];
    const body = students
      .filter(s => selectedProcessingClass === 'All' || s.class === selectedProcessingClass)
      .map(s => {
        const studentMarks = marks.filter(m => m.studentId === s.id && m.examId === selectedProcessingExamId);
        return [
          s.adm,
          s.name.toUpperCase(),
          ...learningAreas.map(la => {
            const m = studentMarks.find(mark => mark.subject === la);
            return m ? (m.score || m.total || '-') : '-';
          })
        ];
      });

    autoTable(doc, {
      head: [header],
      body: body,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] }
    });

    doc.save(`Raw_Marks_${selectedProcessingClass}_${exam?.title}.pdf`);
  };

  const publishAnalysedResults = () => {
    if (!selectedProcessingExamId) {
      alert('Please select an examination first.');
      return;
    }
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    
    // Update exam status
    const updatedExams = exams.map(e => e.id === selectedProcessingExamId ? { ...e, published: true } : e);
    setExams(updatedExams);

    addNotification({
      title: 'Results Published',
      message: `Analysed results for ${exam?.title} have been published to parents and students portals.`,
      type: 'success',
      role: 'principal',
      userId: 'admin'
    });
    
    alert(`Results for ${exam?.title} have been published successfully!`);
  };

  const unpublishAnalysedResults = () => {
    if (!selectedProcessingExamId) {
      alert('Please select an examination first.');
      return;
    }
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    
    // Update exam status
    const updatedExams = exams.map(e => e.id === selectedProcessingExamId ? { ...e, published: false } : e);
    setExams(updatedExams);

    addNotification({
      title: 'Results Recalled',
      message: `Analysed results for ${exam?.title} have been recalled/unpublished.`,
      type: 'warning',
      role: 'principal',
      userId: 'admin'
    });
    
    alert(`Results for ${exam?.title} have been recalled/unpublished successfully!`);
  };

  const downloadSubjectChampionsPDF = (subject: string) => {
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(schoolSettings.name.toUpperCase(), 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`SUBJECT CHAMPIONS: ${subject.toUpperCase()}`, 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Examination: ${exam?.title} (${exam?.term} ${exam?.year})`, 105, 38, { align: 'center' });

    const subjectMarks = marks.filter(m => 
      m.examId === selectedProcessingExamId && 
      m.subject === subject &&
      (selectedProcessingClass === 'All' || students.find(s => s.id === m.studentId)?.class === selectedProcessingClass)
    );
    
    const sorted = subjectMarks.sort((a, b) => parseFloat(b.total || b.score) - parseFloat(a.total || a.score));
    const body = sorted.map((m, idx) => {
      const student = students.find(s => s.id === m.studentId);
      return [
        idx + 1,
        student?.adm || '-',
        student?.name.toUpperCase() || '-',
        student?.class || '-',
        `${m.total || m.score}%`
      ];
    });

    autoTable(doc, {
      head: [['RANK', 'ADM', 'STUDENT NAME', 'CLASS', 'SCORE']],
      body: body,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [0, 128, 0] }
    });

    doc.save(`${subject}_Champions_${exam?.title}.pdf`);
  };

  const downloadBulkMarksTemplate = () => {
    const header = ['Admission Number', 'Student Name', ...learningAreas];
    const classStudents = selectedProcessingClass === 'All' 
      ? students 
      : students.filter(s => s.class === selectedProcessingClass);
    
    const data = [
      header,
      ...classStudents.map(s => [s.adm, s.name, ...learningAreas.map(() => '')])
    ];
    
    // If no students, add a sample row
    if (classStudents.length === 0) {
      data.push(['ADM-001', 'Sample Student', ...learningAreas.map(() => '')]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, `Bulk_Marks_${selectedProcessingClass}_Template.xlsx`);
  };
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [selectedEditClass, setSelectedEditClass] = useState('');
  const [selectedEditSubject, setSelectedEditSubject] = useState('');
  const [selectedEditExamId, setSelectedEditExamId] = useState('');
  const [editExamConfig, setEditExamConfig] = useState({ weighting: 100, maxMarks: 100 });
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);

  const handleSaveExamEdit = async () => {
    try {
      const exam = exams.find(e => e.id === selectedEditExamId);
      if (!exam) return;

      // Update Supabase
      await supabaseService.updateExam(selectedEditExamId, {
        weighting: editExamConfig.weighting
      });

      // Update Local State
      const updatedExams = exams.map(e => 
        e.id === selectedEditExamId ? { ...e, weighting: editExamConfig.weighting } : e
      );
      setExams(updatedExams);
      
      addLog('Edit Exam', `Updated configuration for ${exam.title}`);
      setShowEditConfirmation(false);
      alert('Exam configuration updated successfully!');
    } catch (error: any) {
      alert('Error saving exam edit: ' + error.message);
    }
  };
  const downloadReportPDF = (studentId?: string, returnDoc: boolean = false) => {
    const targetId = studentId || reportConfig.selectedStudentId;
    const student = students.find(s => s.id === targetId);
    if (!student) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    
    // Helper for centered text
    const centerText = (text: string, y: number, size: number, style: 'normal' | 'bold' = 'normal') => {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.text(text, pageWidth / 2, y, { align: 'center' });
    };

    // 1. Header Border
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin, margin, pageWidth - (margin * 2), 40);

    // 2. Logo (Placeholder)
    doc.setFontSize(8);
    doc.text('LOGO', margin + 10, margin + 20);

    // 3. School Header Info
    centerText(schoolSettings.name || school.name, margin + 10, 16, 'bold');
    centerText(`P.O BOX ${schoolSettings.address || '923-50403'}`, margin + 18, 10);
    centerText(`Website: ${schoolSettings.website || 'www.school.ac.ke'}`, margin + 24, 10);
    
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 30, margin + 28, pageWidth / 2 + 30, margin + 28);
    centerText('REPORT FORM', margin + 34, 12, 'bold');
    doc.line(pageWidth / 2 - 30, margin + 36, pageWidth / 2 + 30, margin + 36);

    // 4. Student Details Section
    const detailsY = margin + 45;
    doc.rect(margin, detailsY, pageWidth - (margin * 2), 25);
    
    const classStudents = students.filter(s => s.class === student.class);
    const examId = reportConfig.selectedExamIds[0];
    const examMarks = marks.filter(m => m.examId === examId);
    
    const rankings = classStudents.map(s => {
      const sMarks = examMarks.filter(m => m.studentId === s.id);
      const total = sMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
      return { id: s.id, total };
    }).sort((a, b) => b.total - a.total);
    const classPos = rankings.findIndex(r => r.id === student.id) + 1;

    const overallRankings = students.map(s => {
      const sMarks = examMarks.filter(m => m.studentId === s.id);
      const total = sMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
      return { id: s.id, total };
    }).sort((a, b) => b.total - a.total);
    const overallPos = overallRankings.findIndex(r => r.id === student.id) + 1;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Adm No : ${student.adm}`, margin + 5, detailsY + 7);
    doc.text(`Full Name : ${student.name.toUpperCase()}`, margin + 60, detailsY + 7);
    doc.text(`Kpsea : `, margin + 140, detailsY + 7);

    doc.text(`UPI No : A23WERTYST`, margin + 5, detailsY + 14);
    doc.text(`Grade : ${student.class} A 2026`, margin + 60, detailsY + 14);
    doc.text(`Term : 2`, margin + 140, detailsY + 14);

    doc.text(`House : `, margin + 5, detailsY + 21);
    doc.text(`Rank : ${classPos} (out of ${classStudents.length})`, margin + 60, detailsY + 21);
    doc.text(`Rank (Overall) : ${overallPos} (out of ${students.length})`, margin + 120, detailsY + 21);

    // 5. Performance Table
    const tableHead = [['LEARNING AREA', 'Exam 1 opener\nScore | Grade', 'Score', 'Grade', '%', 'Grd', 'Learning\nArea Rank', 'Remarks', 'Teacher']];
    const tableBody = learningAreas.map(subject => {
      const mark = marks.find(m => m.studentId === student.id && m.examId === examId && m.subject === subject);
      const score = mark ? parseFloat(mark.score) : null;
      const grade = score !== null ? gradingSystem.find(g => score >= g.min && score <= g.max)?.grade || '--' : '--';
      
      const subjectRankings = classStudents.map(s => {
        const sMark = marks.find(m => m.studentId === s.id && m.examId === examId && m.subject === subject);
        return { id: s.id, score: sMark ? parseFloat(sMark.score) : 0 };
      }).sort((a, b) => b.score - a.score);
      const subRank = subjectRankings.findIndex(r => r.id === student.id) + 1;

      const teacher = staff.find(t => t.assignedSubjects?.includes(subject) && t.assignedClasses?.includes(student.class))?.name.split(' ')[0] || 'N/A';

      return [
        subject.toUpperCase(),
        score !== null ? `${score} | ${grade}` : '',
        '',
        '',
        score !== null ? `${score}%` : '',
        grade,
        score !== null ? `${subRank}/${classStudents.length}` : '',
        score !== null ? (score >= 50 ? 'Meeting Expectations' : 'Approaching Expectations') : '',
        teacher
      ];
    });

    autoTable(doc, {
      startY: detailsY + 30,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7, halign: 'center' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20 },
        7: { cellWidth: 35 }
      }
    });

    // 6. Summary Row
    const finalY = (doc as any).lastAutoTable.finalY;
    const studentMarks = marks.filter(m => m.studentId === student.id && m.examId === examId);
    const total = studentMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
    const avg = studentMarks.length > 0 ? total / studentMarks.length : 0;
    const overallGrade = gradingSystem.find(g => avg >= g.min && avg <= g.max)?.grade || '--';

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(margin, finalY, pageWidth - (margin * 2), 10);
    doc.text(`Total Marks : ${total.toFixed(0)} (out of ${learningAreas.length * 100})`, margin + 5, finalY + 7);
    doc.text(`Average Marks : ${avg.toFixed(0)} ${overallGrade}`, margin + 80, finalY + 7);
    doc.text(`Value Added : --`, margin + 140, finalY + 7);

    // 7. Progressive Summary
    const summaryY = finalY + 15;
    doc.setFontSize(10);
    doc.text('PROGRESSIVE SUMMARY', pageWidth / 2 + 20, summaryY + 5, { align: 'center' });
    
    autoTable(doc, {
      startY: summaryY + 8,
      margin: { left: pageWidth / 2 - 10 },
      head: [
        ['', 'GRADE 7', '', '', 'GRADE 8', '', '', 'GRADE 9', '', ''],
        ['', 'T1', 'T2', 'T3', 'T1', 'T2', 'T3', 'T1', 'T2', 'T3']
      ],
      body: [
        ['Marks', '', '', '', '', '', '', total.toFixed(0), '', ''],
        ['Mean score', '', '', '', '', '', '', avg.toFixed(0), '', ''],
        ['Performance Level', '', '', '', '', '', '', overallGrade, '', ''],
        ['Points', '', '', '', '', '', '', total.toFixed(0), '', ''],
        ['Position', '', '', '', '', '', '', classPos.toString(), '', '']
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 6, halign: 'center' },
      styles: { fontSize: 6, cellPadding: 1, halign: 'center' }
    });

    // 8. Remarks & Footer
    const remarksY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('GRADE TEACHER: ____________________________________________________________________', margin, remarksY);
    doc.text('PRINCIPAL: _________________________________________________________________________', margin, remarksY + 15);
    
    doc.text(`Parent's Signature: _________________________________________________________________`, margin, remarksY + 30);
    doc.text(`Next Term Begins On: Monday, 04 May 2026`, margin, remarksY + 40);
    doc.text(`Print Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, remarksY + 40);
    
    centerText(schoolSettings.motto || 'STRIVE FOR EXCELLENCE', remarksY + 50, 10, 'bold');

    if (returnDoc) return doc;
    doc.save(`${student.name}_Report_Card.pdf`);
  };

  const generateAllClassReports = async () => {
    const className = reportConfig.selectedClass;
    const examId = reportConfig.selectedExamIds[0];
    if (className === 'All' || !examId) {
      alert('Please select a specific class and an examination.');
      return;
    }

    const classStudents = students.filter(s => s.class === className);
    if (classStudents.length === 0) {
      alert('No students found in this class.');
      return;
    }

    const zip = new JSZip();
    const exam = exams.find(e => e.id === examId);
    
    addNotification({
      title: 'Batch Generation',
      message: `Starting batch report generation for ${className}...`,
      type: 'info',
      role: 'principal',
      userId: 'admin'
    });

    for (const student of classStudents) {
      const doc = downloadReportPDF(student.id, true) as jsPDF;
      if (doc) {
        const pdfBlob = doc.output('blob');
        zip.file(`${student.adm}_${student.name.replace(/\s+/g, '_')}.pdf`, pdfBlob);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${className}_${exam?.title}_Reports.zip`;
    link.click();
    
    addNotification({
      title: 'Batch Complete',
      message: `Batch report generation for ${className} complete!`,
      type: 'success',
      role: 'principal',
      userId: 'admin'
    });
  };

  const [students, setStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_students');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Alice Wanjiku', adm: 'ADM-2024-001', class: 'Form 1', status: 'Active', gender: 'Female', profile_image: null },
      { id: '2', name: 'Bob Otieno', adm: 'ADM-2024-002', class: 'Form 2', status: 'Active', gender: 'Male', profile_image: null },
      { id: '3', name: 'Charlie Musyoka', adm: 'ADM-2024-003', class: 'Form 1', status: 'Active', gender: 'Male', profile_image: null },
      { id: '4', name: 'Diana Kwamboka', adm: 'ADM-2024-004', class: 'Grade 7', status: 'Active', gender: 'Female', profile_image: null },
      { id: '5', name: 'Evans Kiprop', adm: 'ADM-2024-005', class: 'Grade 7', status: 'Active', gender: 'Male', profile_image: null },
    ];
  });

  const [newStudent, setNewStudent] = useState({ name: '', adm: '', class: 'Form 1', streamId: '', gender: 'Male', profile_image: null as string | null });
  const [editingStudent, setEditingStudent] = useState<any>(null);

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
  const [newClass, setNewClass] = useState({ name: '', teacherId: '', capacity: 40, streams: [] as string[] });
  const [editingClass, setEditingClass] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('alakara_classes', JSON.stringify(classes));
  }, [classes]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSortBy, setStudentSortBy] = useState<'name' | 'adm'>('name');
  const [studentSortOrder, setStudentSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewingSubjectChampions, setViewingSubjectChampions] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [marks, setMarks] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_marks');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'm1', examId: 'exam-1', studentId: '1', subject: 'Mathematics', score: '85', total: 85, grade: 'A', points: 12 },
      { id: 'm2', examId: 'exam-1', studentId: '1', subject: 'English', score: '78', total: 78, grade: 'A-', points: 11 },
      { id: 'm3', examId: 'exam-1', studentId: '3', subject: 'Mathematics', score: '92', total: 92, grade: 'A', points: 12 },
      { id: 'm4', examId: 'exam-1', studentId: '3', subject: 'English', score: '65', total: 65, grade: 'B', points: 9 },
      { id: 'm5', examId: 'exam-1', studentId: '4', subject: 'Mathematics', score: '70', total: 70, grade: 'B+', points: 10 },
    ];
  });
  const [showEditMarksModal, setShowEditMarksModal] = useState(false);
  const [selectedMarksStudent, setSelectedMarksStudent] = useState<any>(null);
  const [editingMarks, setEditingMarks] = useState<any>({}); // {examId: score}

  useEffect(() => {
    localStorage.setItem('alakara_marks', JSON.stringify(marks));
  }, [marks]);

  useEffect(() => {
    localStorage.setItem('alakara_students', JSON.stringify(students));
  }, [students]);
  const [exams, setExams] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_exams');
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: 'exam-1', 
        title: 'End of Term 2 Assessment', 
        term: 'Term 2', 
        year: '2026', 
        classes: ['Form 1', 'Form 2', 'Grade 7'], 
        subjects: ['Mathematics', 'English', 'Kiswahili', 'Science'],
        status: 'Active',
        published: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [newExam, setNewExam] = useState({
    title: '',
    term: 'Term 2',
    year: '2026',
    classes: [] as string[],
    subjects: [] as string[],
    startDate: '',
    endDate: ''
  });

  const [learningAreas, setLearningAreas] = useState<string[]>(() => {
    const saved = localStorage.getItem('alakara_learning_areas');
    if (saved) return JSON.parse(saved);
    return ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE'];
  });

  const [gradingSystem, setGradingSystem] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_grading');
    if (saved) return JSON.parse(saved);
    return [
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

  const [reportConfig, setReportConfig] = useState({
    selectedStudentId: '',
    selectedClass: 'All',
    selectedExamIds: [] as string[],
    includeAverages: true,
    includeGrades: true,
    graphType: 'bar' as 'bar' | 'line',
    templateType: 'classic' as 'classic' | 'modern' | 'graph' | 'primary' | 'compact',
    includeLetterhead: true,
    includePerformanceTrend: true
  });

  const [selectedAnalysisExamId, setSelectedAnalysisExamId] = useState('');
  const [analysisOptions, setAnalysisOptions] = useState({
    showGrades: true,
    showRank: true
  });

  const [assessmentCategories, setAssessmentCategories] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_assessment_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'cat1', name: 'CAT 1', maxScore: 20 },
      { id: 'cat2', name: 'CAT 2', maxScore: 20 },
      { id: 'final', name: 'Final Exam', maxScore: 60 },
    ];
  });

  const [rankingLogic, setRankingLogic] = useState<any>(() => {
    const saved = localStorage.getItem('alakara_ranking_logic');
    return saved ? JSON.parse(saved) : {
      primaryCriteria: 'aggregate_total',
      tieBreaker1: 'distinctions_count',
      tieBreaker2: 'core_subjects_total',
      coreSubjects: ['Mathematics', 'English', 'Kiswahili']
    };
  });

  useEffect(() => {
    localStorage.setItem('alakara_assessment_categories', JSON.stringify(assessmentCategories));
  }, [assessmentCategories]);

  useEffect(() => {
    localStorage.setItem('alakara_ranking_logic', JSON.stringify(rankingLogic));
  }, [rankingLogic]);

  const [schoolSettings, setSchoolSettings] = useState({
    name: '',
    motto: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    letterheadTemplate: 'standard'
  });

  useEffect(() => {
    localStorage.setItem('alakara_learning_areas', JSON.stringify(learningAreas));
  }, [learningAreas]);

  useEffect(() => {
    localStorage.setItem('alakara_grading', JSON.stringify(gradingSystem));
  }, [gradingSystem]);

  useEffect(() => {
    localStorage.setItem('alakara_exams', JSON.stringify(exams));
  }, [exams]);
  const [streams, setStreams] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_streams');
    if (saved) return JSON.parse(saved);
    return [
      { id: 's1', classId: '1', name: 'A' },
      { id: 's2', classId: '1', name: 'B' },
      { id: 's3', classId: '2', name: 'East' },
      { id: 's4', classId: '2', name: 'West' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('alakara_streams', JSON.stringify(streams));
  }, [streams]);

  const [staff, setStaff] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_staff');
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: '1', 
        name: 'John Kamau', 
        email: '0712345678', 
        role: 'Head of Science', 
        status: 'Active', 
        username: '0712345678', 
        password: 'password123', 
        mustChangePassword: true, 
        assignments: [
          { classId: '1', streamId: 's1', subject: 'Science' },
          { classId: '5', streamId: '', subject: 'Science' }
        ]
      },
      { 
        id: '2', 
        name: 'Sarah Anyango', 
        email: '0723456789', 
        role: 'Mathematics Teacher', 
        status: 'Active', 
        username: '0723456789', 
        password: 'password123', 
        mustChangePassword: true, 
        assignments: [
          { classId: '1', streamId: 's1', subject: 'Mathematics' },
          { classId: '1', streamId: 's2', subject: 'Mathematics' }
        ]
      },
    ];
  });

  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    role: 'Teacher', 
    assignments: [] as { classId: string, streamId: string, subject: string }[] 
  });
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [generatedStaffCreds, setGeneratedStaffCreds] = useState<{name: string, username: string, password: string} | null>(null);

  useEffect(() => {
    localStorage.setItem('alakara_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    const checkStatus = () => {
      const currentSchool = JSON.parse(localStorage.getItem('alakara_current_school') || '{}');
      const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
      
      const updatedSchool = allSchools.find((s: any) => s.id === currentSchool.id);
      
      if (updatedSchool && JSON.stringify(updatedSchool) !== JSON.stringify(school)) {
        setSchool(updatedSchool);
        
        // Check subscription expiry
        const expiryDate = updatedSchool.subscriptionExpiresAt ? new Date(updatedSchool.subscriptionExpiresAt) : null;
        const now = new Date();
        const isExpired = expiryDate ? expiryDate < now : false;
        
        setIsSuspended(updatedSchool.status === 'Suspended' || isExpired);

        if (expiryDate) {
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysToExpiry(diffDays);

          // Trigger notification for expiry warning
          if (diffDays <= 15 && diffDays > 0) {
            const lastWarning = localStorage.getItem(`alakara_expiry_warning_${updatedSchool.id}`);
            const today = new Date().toDateString();
            if (lastWarning !== today) {
              addNotification({
                title: 'Subscription Expiry Warning',
                message: `Your school subscription will expire in ${diffDays} days. Please renew to avoid service interruption.`,
                type: 'warning',
                role: 'principal',
                userId: updatedSchool.id
              });
              localStorage.setItem(`alakara_expiry_warning_${updatedSchool.id}`, today);
            }
          }
        } else {
          setDaysToExpiry(null);
        }
      } else if (!updatedSchool) {
        navigate('/login');
      }
    };

    checkStatus();
    // Poll for status changes in this demo
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!school?.id) return;
      
      try {
        // Fetch Students
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('school_id', school.id);
        if (studentsData) setStudents(studentsData);

        // Fetch Classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', school.id);
        if (classesData) setClasses(classesData);

        // Fetch Exams
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('school_id', school.id);
        if (examsData) {
          // Map snake_case to camelCase if needed, or just use as is
          setExams(examsData.map(e => ({
            ...e,
            schoolId: e.school_id,
            createdAt: e.created_at,
            // For now, assume classes/subjects are stored in metadata or handle the mismatch
            classes: e.class_id ? [e.class_id] : [],
            subjects: e.subject_id ? [e.subject_id] : []
          })));
        }

        // Fetch Staff (Profiles)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'teacher')
          .eq('school_id', school.id);
        if (profilesData) setStaff(profilesData);

      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      }
    };

    fetchAllData();
  }, [school?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('alakara_current_school');
    navigate('/principal-login');
  };

  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Use phone number as identifier, removing email extensions fully
    const sanitizedPhone = newStaff.phone.replace(/\s+/g, '');
    const isValidPhone = /^(254\d{9}|07\d{8}|01\d{8})$/.test(sanitizedPhone);

    if (!isValidPhone) {
      alert('Phone number must start with 254, 07, or 01 and be of valid length');
      setIsLoading(false);
      return;
    }

    let finalEmail = sanitizedPhone;
    
    if (!finalEmail && newStaff.email) {
      finalEmail = newStaff.email.trim().toLowerCase();
    }

    if (editingStaff) {
      // Safety check: Prevent changing role of a teacher
      if (editingStaff.role?.toLowerCase() === 'teacher' && newStaff.role.toLowerCase() !== 'teacher') {
        alert('Teacher roles cannot be changed once assigned.');
        setIsLoading(false);
        return;
      }

      // Safety check: Prevent assigning principal or super-admin roles
      if (newStaff.role.toLowerCase() === 'principal' || newStaff.role.toLowerCase() === 'super-admin') {
        alert('You cannot assign Principal or Super Admin roles.');
        setIsLoading(false);
        return;
      }

      const updatedStaff = staff.map(s => s.id === editingStaff.id ? { 
        ...editingStaff, 
        name: newStaff.name, 
        email: finalEmail, 
        phone: sanitizedPhone,
        role: newStaff.role,
        assignments: newStaff.assignments
      } : s);
      setStaff(updatedStaff);
      
      // Sync with Supabase
      supabase.from('profiles').update({
        name: newStaff.name,
        email: finalEmail,
        phone: sanitizedPhone,
        role: newStaff.role.toLowerCase(),
        assignments: newStaff.assignments
      }).eq('id', editingStaff.id).then(({ error }) => {
        if (error) {
          console.error('Error updating profile in Supabase:', error);
          alert('Failed to update profile in Supabase. Local state updated.');
        }
      });

      setEditingStaff(null);
      setIsLoading(false);
    } else {
      // Safety check: Prevent assigning principal or super-admin roles
      if (newStaff.role.toLowerCase() === 'principal' || newStaff.role.toLowerCase() === 'super-admin') {
        alert('You cannot assign Principal or Super Admin roles.');
        setIsLoading(false);
        return;
      }

      const password = Math.random().toString(36).slice(-8);
      
      try {
        // 1. Create Auth Account using a secondary client to avoid signing out the principal
        // We need to import createClient or use a helper
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

        // Try to sign up with phone or email
        const isEmail = finalEmail.includes('@');
        const cleanPhone = sanitizedPhone.startsWith('+') ? sanitizedPhone : 
                           sanitizedPhone.startsWith('0') ? `+254${sanitizedPhone.substring(1)}` : 
                           `+${sanitizedPhone}`;

        const { data: authData, error: authError } = await secondaryClient.auth.signUp(
          isEmail 
            ? { email: finalEmail, password } 
            : { phone: cleanPhone, password }
        );

        if (authError && authError.message !== 'User already registered') {
          throw authError;
        }

        let authUserId = authData.user?.id;
        let linkedUserId = authData.user?.id;
        
        if (!authUserId) {
          // User might already exist in Auth. Try to find them in profiles.
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, user_id')
            .eq(isEmail ? 'email' : 'phone', isEmail ? finalEmail : sanitizedPhone)
            .maybeSingle();
          
          if (existingProfile) {
            authUserId = existingProfile.id;
            linkedUserId = existingProfile.user_id;
          } else {
            authUserId = crypto.randomUUID();
            linkedUserId = null;
          }
        }

        // 2. Sync with Supabase profiles table
        const { data, error } = await supabase.from('profiles').upsert({
          id: authUserId,
          user_id: linkedUserId,
          name: newStaff.name,
          email: finalEmail,
          phone: sanitizedPhone,
          role: newStaff.role.toLowerCase(),
          school_id: school.id,
          password: password, // Store password in profile for cross-device login fallback
          must_change_password: true,
          assignments: newStaff.assignments
        }).select().single();

        if (error) {
          throw error;
        }

        if (data) {
          const staffMember = {
            id: data.id,
            ...newStaff,
            email: finalEmail,
            status: 'Active',
            username: finalEmail,
            password,
            mustChangePassword: true,
            school_id: school.id
          };
          setStaff([...staff, staffMember]);
          setGeneratedStaffCreds({ name: newStaff.name, username: finalEmail, password });
          alert('Staff member added successfully and Auth account created!');
        }
      } catch (error: any) {
        console.error('Error adding staff:', error);
        alert('Error adding staff: ' + (error.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }
    setNewStaff({ name: '', email: '', phone: '', role: 'Teacher', assignments: [] });
    setShowAddStaffModal(false);
  };

  const openEditStaff = (member: any) => {
    setEditingStaff(member);
    setNewStaff({ 
      name: member.name, 
      email: member.email, 
      phone: member.phone || '',
      role: member.role,
      assignments: member.assignments || []
    });
    setShowAddStaffModal(true);
  };

  const removeStaff = (id: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  const updateStaffRole = (id: string, newRole: string) => {
    const member = staff.find(s => s.id === id);
    if (member && member.role?.toLowerCase() === 'teacher') {
      alert('Teacher roles cannot be changed once assigned.');
      return;
    }
    setStaff(staff.map(s => s.id === id ? { ...s, role: newRole } : s));
    
    // Sync with Supabase
    supabase.from('profiles').update({
      role: newRole.toLowerCase()
    }).eq('id', id).then(({ error }) => {
      if (error) {
        console.error('Error updating role in Supabase:', error);
      }
    });
  };

  const deleteStudentMark = (studentId: string, examId: string, subject: string) => {
    if (window.confirm(`Are you sure you want to delete the marks for ${subject}?`)) {
      const updatedMarks = marks.filter(m => !(m.studentId === studentId && m.examId === examId && m.subject === subject));
      setMarks(updatedMarks);
      addLog('Delete Mark', `Deleted marks for student ID ${studentId}, subject ${subject}`);
    }
  };

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (editingStudent) {
      const updatedStudents = students.map(s => s.id === editingStudent.id ? { ...editingStudent, ...newStudent } : s);
      setStudents(updatedStudents);
      
      // Sync with Supabase
      supabase.from('students').update({
        name: newStudent.name,
        adm: newStudent.adm,
        class: newStudent.class,
        gender: newStudent.gender,
        status: newStudent.status
      }).eq('id', editingStudent.id).then(({ error }) => {
        if (error) {
          console.error('Error updating student in Supabase:', error);
          alert('Failed to update student in Supabase. Local state updated.');
        }
      });

      setEditingStudent(null);
      setIsLoading(false);
    } else {
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

        // Use ADM number as dummy email for Auth
        const studentEmail = `${newStudent.adm.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`;
        const password = 'password123'; // Default password for students

        // 1. Create Auth Account
        const { data: authData, error: authError } = await secondaryClient.auth.signUp({
          email: studentEmail,
          password: password
        });

        if (authError && authError.message !== 'User already registered') {
          throw authError;
        }

        let authUserId = authData.user?.id;
        let linkedUserId = authData.user?.id;
        
        if (!authUserId) {
          // User might already exist. Try to find them.
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('adm', newStudent.adm)
            .maybeSingle();
          
          if (existingStudent) {
            authUserId = existingStudent.id;
            // Try to find linked user_id from profiles
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('student_id', existingStudent.id)
              .maybeSingle();
            linkedUserId = existingProfile?.user_id || null;
          } else {
            authUserId = crypto.randomUUID();
            linkedUserId = null;
          }
        }

        // 2. Create Student Record
        const { data: studentData, error: studentError } = await supabase.from('students').upsert({
          id: authUserId, // Use same ID for consistency
          name: newStudent.name,
          adm: newStudent.adm,
          class: newStudent.class,
          gender: newStudent.gender,
          status: 'Active',
          school_id: school.id
        }).select().single();

        if (studentError) throw studentError;

        // 3. Create Profile Record
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authUserId,
          user_id: linkedUserId,
          name: newStudent.name,
          email: studentEmail,
          role: 'student',
          school_id: school.id,
          student_id: studentData.id,
          password: password,
          must_change_password: true
        });

        if (profileError) throw profileError;

        if (studentData) {
          const student = {
            id: studentData.id,
            ...newStudent,
            status: 'Active',
            school_id: school.id
          };
          setStudents([...students, student]);
          alert('Student added successfully and Auth account created!');
        }
      } catch (error: any) {
        console.error('Error adding student:', error);
        alert('Error adding student: ' + (error.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }
    setNewStudent({ name: '', adm: '', class: 'Form 1', streamId: '', gender: 'Male', profile_image: null });
    setShowAddStudentModal(false);
  };

  const openEditStudent = (student: any) => {
    setEditingStudent(student);
    setNewStudent({ 
      name: student.name, 
      adm: student.adm, 
      class: student.class, 
      streamId: student.streamId || '',
      gender: student.gender || 'Male',
      profile_image: student.profile_image || null
    });
    setShowAddStudentModal(true);
  };

  const handleAddClass = (e: FormEvent) => {
    e.preventDefault();
    const classId = editingClass ? editingClass.id : Math.random().toString(36).substr(2, 9);
    
    if (editingClass) {
      setClasses(classes.map(c => c.id === editingClass.id ? { ...editingClass, name: newClass.name, teacherId: newClass.teacherId, capacity: newClass.capacity } : c));
      
      // Sync with Supabase
      supabase.from('classes').update({
        name: newClass.name,
        teacher_id: newClass.teacherId,
        capacity: parseInt(String(newClass.capacity))
      }).eq('id', editingClass.id).then(({ error }) => {
        if (error) {
          console.error('Error updating class in Supabase:', error);
          alert('Failed to update class in Supabase. Local state updated.');
        }
      });

      setEditingClass(null);
    } else {
      // Sync with Supabase first to get the generated ID
      supabase.from('classes').insert({
        name: newClass.name,
        teacher_id: newClass.teacherId,
        capacity: parseInt(String(newClass.capacity)),
        school_id: school.id
      }).select().single().then(({ data, error }) => {
        if (error) {
          console.error('Error creating class in Supabase:', error);
          alert('Database error saving new class: ' + error.message);
          return;
        }

        if (data) {
          const cls = {
            id: data.id,
            name: newClass.name,
            teacherId: newClass.teacherId,
            capacity: newClass.capacity
          };
          setClasses([...classes, cls]);
          alert('Class added successfully!');
        }
      });
    }

    // Handle streams
    const existingStreams = streams.filter(s => s.classId === classId);
    const newStreamNames = newClass.streams;
    
    // Remove streams not in new list
    const streamsToRemove = existingStreams.filter(s => !newStreamNames.includes(s.name));
    let updatedStreams = streams.filter(s => !streamsToRemove.find(r => r.id === s.id));
    
    // Add new streams
    newStreamNames.forEach(name => {
      if (!existingStreams.find(s => s.name === name)) {
        updatedStreams.push({
          id: Math.random().toString(36).substr(2, 9),
          classId: classId,
          name: name
        });
      }
    });
    
    setStreams(updatedStreams);
    setNewClass({ name: '', teacherId: '', capacity: 40, streams: [] });
    setShowAddClassModal(false);
  };

  const openEditClass = (cls: any) => {
    setEditingClass(cls);
    const classStreams = streams.filter(s => s.classId === cls.id).map(s => s.name);
    setNewClass({ 
      name: cls.name, 
      teacherId: cls.teacherId || '', 
      capacity: cls.capacity || 40,
      streams: classStreams
    });
    setShowAddClassModal(true);
  };

  const removeClass = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this class?')) {
      try {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
        setClasses(classes.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class from Supabase.');
      }
    }
  };

  const handleBulkStudentUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const newStudents = [...students];
        const studentsToInsert: any[] = [];

        data.forEach((row, index) => {
          if (index === 0) return; // Skip header
          if (!row[0]) return; // Skip empty rows

          const studentId = Math.random().toString(36).substr(2, 9);
          const studentData = {
            id: studentId,
            name: String(row[0]).trim(),
            adm: String(row[1] || '').trim(),
            class: String(row[2] || 'Form 1').trim(),
            status: 'Active',
            school_id: school.id
          };

          newStudents.push(studentData);
          studentsToInsert.push(studentData);
        });

        setStudents(newStudents);
        
        // Sync with Supabase
        if (studentsToInsert.length > 0) {
          supabase.from('students').insert(studentsToInsert).then(({ error }) => {
            if (error) {
              console.error('Error syncing bulk students:', error);
              alert('Partial sync failure: Some students could not be saved to Supabase.');
            } else {
              alert(`Successfully imported ${studentsToInsert.length} students and synced with Supabase!`);
            }
          });
        }
      } catch (err) {
        alert('Error parsing Excel file. Please ensure it follows the format: Name, Admission No, Class');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClassBulkStudentUpload = (e: ChangeEvent<HTMLInputElement>, className: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const newStudents = [...students];
        const studentsToInsert: any[] = [];

        data.forEach((row, index) => {
          if (index === 0) return; // Skip header
          if (!row[0]) return; // Skip empty rows

          const studentId = Math.random().toString(36).substr(2, 9);
          const studentData = {
            id: studentId,
            name: String(row[0]).trim(),
            adm: String(row[1] || '').trim(),
            class: className,
            status: 'Active',
            school_id: school.id
          };

          newStudents.push(studentData);
          studentsToInsert.push(studentData);
        });

        setStudents(newStudents);

        // Sync with Supabase
        if (studentsToInsert.length > 0) {
          supabase.from('students').insert(studentsToInsert).then(({ error }) => {
            if (error) {
              console.error('Error syncing bulk students to class:', error);
              alert('Partial sync failure: Some students could not be saved to Supabase.');
            } else {
              alert(`Successfully imported ${studentsToInsert.length} students to ${className} and synced with Supabase!`);
            }
          });
        }
      } catch (err) {
        alert('Error parsing Excel file. Please ensure it follows the format: Name, Admission No');
      }
    };
    reader.readAsBinaryString(file);
  };

  const removeStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      try {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw error;
        setStudents(students.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student from Supabase.');
      }
    }
  };

  const filteredAndSortedStudents = students
    .filter(s => 
      (s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.adm.toLowerCase().includes(studentSearchQuery.toLowerCase())) &&
      (selectedClassFilter === 'All' || s.class === selectedClassFilter)
    )
    .sort((a, b) => {
      const valA = a[studentSortBy].toLowerCase();
      const valB = b[studentSortBy].toLowerCase();
      if (studentSortOrder === 'asc') return valA.localeCompare(valB);
      return valB.localeCompare(valA);
    });

  const groupedStudents = filteredAndSortedStudents.reduce((acc: any, student) => {
    const className = student.class;
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  const toggleStudentSort = (key: 'name' | 'adm') => {
    if (studentSortBy === key) {
      setStudentSortOrder(studentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStudentSortBy(key);
      setStudentSortOrder('asc');
    }
  };

  const downloadStudentTemplate = (className?: string) => {
    const header = ['Full Name', 'Admission Number', 'Class'];
    const classStudents = className 
      ? students.filter(s => s.class === className)
      : [];
    
    const data = [
      header,
      ...classStudents.map(s => [s.name, s.adm, s.class])
    ];

    if (data.length === 1) {
      data.push(['Jane Doe', 'ADM-2024-001', className || 'Form 1']);
      data.push(['John Smith', 'ADM-2024-002', className || 'Form 2']);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, className ? `Students_${className}_Template.xlsx` : "Student_Bulk_Upload_Template.xlsx");
  };

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save drafts
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = {
        newExam,
        newStaff,
        schoolSettings,
        newClass,
        newStudent
      };
      localStorage.setItem('alakara_config_draft', JSON.stringify(draft));
      setHasUnsavedChanges(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [newExam, newStaff, schoolSettings, newClass, newStudent]);

  // Load drafts on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('alakara_config_draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      // Only set if they are not empty to avoid overwriting initial state with empty drafts
      if (draft.newExam.title) setNewExam(draft.newExam);
      if (draft.newStaff.name) setNewStaff(draft.newStaff);
      if (draft.schoolSettings.name) setSchoolSettings(draft.schoolSettings);
      if (draft.newClass.name) setNewClass(draft.newClass);
      if (draft.newStudent.name) setNewStudent(draft.newStudent);
    }
    // Reset unsaved changes after initial load
    setTimeout(() => setHasUnsavedChanges(false), 1000);
  }, []);

  // Prevent accidental reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleCreateExam = async (e: FormEvent) => {
    e.preventDefault();
    
    const examData: Database['public']['Tables']['exams']['Insert'] = {
      title: newExam.title,
      term: newExam.term,
      year: newExam.year,
      class_id: newExam.classes[0] || null, // Use first class for now to match schema
      subject_id: newExam.subjects[0] || null, // Use first subject for now to match schema
      locked: false,
      weighting: 100,
      school_id: school.id
    };

    try {
      const { data, error } = await supabase.from('exams').insert(examData).select().single();
      if (error) throw error;

      if (data) {
        const exam = {
          ...data,
          schoolId: data.school_id,
          createdAt: data.created_at,
          classes: data.class_id ? [data.class_id] : [],
          subjects: data.subject_id ? [data.subject_id] : [],
          status: data.locked ? 'Completed' : 'Active'
        };

        setExams([exam, ...exams]);
        setNewExam({ title: '', term: 'Term 2', year: '2026', classes: [], subjects: [], startDate: '', endDate: '' });
        setAcademicSubTab('overview');
        alert('Exam created successfully! It is now visible to teachers.');
      }
    } catch (error: any) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam: ' + error.message);
    }
  };

  const [logs, setLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('alakara_audit_trail');
    return saved ? JSON.parse(saved) : [];
  });

  const addLog = (action: string, details: string) => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: 'Principal',
      action,
      details
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    setLogs(updatedLogs);
    localStorage.setItem('alakara_audit_trail', JSON.stringify(updatedLogs));
  };

  const processExam = (id: string) => {
    if (window.confirm('Are you sure you want to process this exam? This will lock mark entry for teachers.')) {
      const exam = exams.find(e => e.id === id);
      setExams(exams.map(e => e.id === id ? { ...e, status: 'Completed' } : e));
      addLog('Process Exam', `Processed results for ${exam?.title}`);
      
      addNotification({
        title: 'Exam Results Published',
        message: `Results for "${exam?.title}" have been processed and published.`,
        type: 'success',
        role: 'principal',
        userId: school.id
      });

      // Notify students in the classes
      exam?.classes.forEach((className: string) => {
        addNotification({
          title: 'New Results Available',
          message: `The results for ${exam.title} are now available for viewing.`,
          type: 'info',
          role: 'student'
        });
      });
    }
  };

  const recallExam = (id: string) => {
    if (window.confirm('Are you sure you want to recall this exam? Teachers will be able to edit scores again.')) {
      setExams(exams.map(e => e.id === id ? { ...e, status: 'Active' } : e));
    }
  };

  const deleteExam = async (id: string) => {
    if (window.confirm('Delete this exam? All associated marks will be lost.')) {
      try {
        const { error } = await supabase.from('exams').delete().eq('id', id);
        if (error) throw error;
        setExams(exams.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam from Supabase.');
      }
    }
  };

  const toggleClassSelection = (className: string) => {
    setNewExam(prev => ({
      ...prev,
      classes: prev.classes.includes(className) 
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  const addLearningArea = (name: string) => {
    if (!name.trim()) return;
    if (learningAreas.includes(name.trim())) {
      alert('This learning area already exists.');
      return;
    }
    setLearningAreas([...learningAreas, name.trim()]);
  };

  const editLearningArea = (oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName || oldName === trimmedNewName) return;
    if (learningAreas.includes(trimmedNewName)) {
      alert('This learning area already exists.');
      return;
    }
    setLearningAreas(learningAreas.map(la => la === oldName ? trimmedNewName : la));
    
    // Update marks
    setMarks(marks.map(m => m.subject === oldName ? { ...m, subject: trimmedNewName } : m));
    
    // Update exams
    setExams(exams.map(e => ({
      ...e,
      subjects: e.subjects?.map((s: string) => s === oldName ? trimmedNewName : s)
    })));
  };

  const removeLearningArea = (name: string) => {
    if (window.confirm(`Remove ${name}? All associated marks will be hidden.`)) {
      setLearningAreas(learningAreas.filter(la => la !== name));
    }
  };

  const updateGradeBoundary = (index: number, field: string, value: any) => {
    const newGrading = [...gradingSystem];
    newGrading[index] = { ...newGrading[index], [field]: value };
    setGradingSystem(newGrading);
  };

  const addGrade = () => {
    setGradingSystem([...gradingSystem, { grade: 'New', min: 0, max: 0, points: 0 }]);
  };

  const removeGrade = (index: number) => {
    if (window.confirm('Remove this grade?')) {
      const newGrading = [...gradingSystem];
      newGrading.splice(index, 1);
      setGradingSystem(newGrading);
    }
  };

  const mockAnalysisData = [
    { subject: 'Math', average: 72, top: 98, bottom: 45 },
    { subject: 'English', average: 68, top: 92, bottom: 38 },
    { subject: 'Science', average: 65, top: 88, bottom: 42 },
    { subject: 'Social', average: 75, top: 95, bottom: 50 },
    { subject: 'CRE', average: 82, top: 99, bottom: 60 },
  ];

  const getAnalyticsData = () => {
    // 1. Class Performance Comparison
    const classPerformance = classes.map(c => {
      const classStudents = students.filter(s => s.class === c.name);
      const classMarks = marks.filter(m => classStudents.some(s => s.id === m.studentId));
      const totalScore = classMarks.reduce((sum, m) => sum + (m.total || 0), 0);
      const count = classMarks.length;
      return {
        name: c.name,
        average: count > 0 ? totalScore / count : 0,
        studentCount: classStudents.length
      };
    }).sort((a, b) => b.average - a.average);

    // 2. Subject Pass Rates
    const subjectStats = learningAreas.map(subject => {
      const subjectMarks = marks.filter(m => m.subject === subject);
      const passCount = subjectMarks.filter(m => (m.total || 0) >= 50).length;
      const failCount = subjectMarks.filter(m => (m.total || 0) < 50).length;
      const total = subjectMarks.length;
      return {
        subject,
        passRate: total > 0 ? (passCount / total) * 100 : 0,
        failRate: total > 0 ? (failCount / total) * 100 : 0,
        average: total > 0 ? subjectMarks.reduce((sum, m) => sum + (m.total || 0), 0) / total : 0
      };
    });

    // 3. Gender Performance
    const genderStats = ['Male', 'Female'].map(gender => {
      const genderStudents = students.filter(s => s.gender === gender);
      const genderMarks = marks.filter(m => genderStudents.some(s => s.id === m.studentId));
      const total = genderMarks.reduce((sum, m) => sum + (m.total || 0), 0);
      const count = genderMarks.length;
      return {
        gender,
        average: count > 0 ? total / count : 0
      };
    });

    return { classPerformance, subjectStats, genderStats };
  };

  const { classPerformance, subjectStats, genderStats } = getAnalyticsData();

  const handleGenerateReport = () => {
    if (!reportConfig.selectedStudentId) {
      alert('Please select a student.');
      return;
    }
    if (reportConfig.selectedExamIds.length === 0) {
      alert('Please select at least one exam.');
      return;
    }
    setShowReportPreview(true);
  };

  const openEditMarks = (student: any) => {
    setSelectedMarksStudent(student);
    const studentMarks = marks.filter(m => m.studentId === student.id);
    const marksMap: any = {};
    studentMarks.forEach(m => {
      marksMap[m.examId] = m.score;
    });
    setEditingMarks(marksMap);
    setShowEditMarksModal(true);
  };

  const saveStudentMarks = () => {
    const newMarks = [...marks.filter(m => m.studentId !== selectedMarksStudent.id)];
    Object.entries(editingMarks).forEach(([examId, score]) => {
      if (score !== '') {
        newMarks.push({
          id: `${examId}-${selectedMarksStudent.id}`,
          examId,
          studentId: selectedMarksStudent.id,
          score,
          subject: 'Mathematics', // Assuming math for now as per teacher dashboard mock
          updatedAt: new Date().toISOString()
        });
      }
    });
    setMarks(newMarks);
    setShowEditMarksModal(false);
    alert('Marks updated successfully!');
  };

  const getMeritListData = () => {
    if (!selectedAnalysisExamId) return [];
    
    const examMarks = marks.filter(m => m.examId === selectedAnalysisExamId);
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam) return [];

    // 1. Get all students in the exam classes
    const examStudents = students.filter(s => exam.classes.includes(s.class));

    // 2. Calculate scores for all students
    const studentAnalysis = examStudents.map(student => {
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

    // 3. Calculate FRM POS (Overall Rank)
    const overallRanked = [...studentAnalysis].sort((a, b) => b.totalScore - a.totalScore);
    const withOverallRank = overallRanked.map((s, index) => ({ ...s, frmPos: index + 1 }));

    // 4. Calculate CLS POS (Class Rank)
    const finalData = withOverallRank.map(student => {
      const classStudents = withOverallRank.filter(s => s.class === student.class);
      const classRanked = classStudents.sort((a, b) => b.totalScore - a.totalScore);
      const clsPos = classRanked.findIndex(s => s.id === student.id) + 1;
      return { ...student, clsPos };
    });

    // 5. Filter by selected class if needed
    const filtered = finalData.filter(s => selectedAnalysisClass === 'All' || s.class === selectedAnalysisClass);

    // 6. Apply custom sorting
    return filtered.sort((a, b) => {
      switch (meritListSortBy) {
        case 'total': return b.totalScore - a.totalScore;
        case 'average': return b.average - a.average;
        case 'position': return a.frmPos - b.frmPos;
        case 'name': return a.name.localeCompare(b.name);
        case 'gender': return (a.gender || '').localeCompare(b.gender || '');
        case 'stream': return (a.streamId || '').localeCompare(b.streamId || '');
        default: return a.frmPos - b.frmPos;
      }
    });
  };

  const [meritListSortBy, setMeritListSortBy] = useState<'total' | 'average' | 'position' | 'name' | 'gender' | 'stream'>('total');

  const getAnalysisData = () => {
    if (!selectedAnalysisExamId) return [];
    
    const examMarks = marks.filter(m => m.examId === selectedAnalysisExamId);
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!exam) return [];

    // Group marks by student
    const studentAnalysis = students
      .filter(s => (selectedAnalysisClass === 'All' || s.class === selectedAnalysisClass))
      .map(student => {
        const studentMarks = examMarks.filter(m => m.studentId === student.id);
        const subjectScores: any = {};
        let totalScore = 0;
        let subjectsCount = 0;

        learningAreas.forEach(la => {
          const mark = studentMarks.find(m => m.subject === la);
          const score = mark ? parseFloat(mark.score || mark.total || 0) : null;
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
          gender: student.gender,
          streamId: student.streamId,
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

  const getSubjectChampions = () => {
    if (!selectedProcessingExamId) return [];
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    if (!exam) return [];

    return learningAreas.map(subject => {
      const subjectMarks = marks.filter(m => 
        m.examId === selectedProcessingExamId && 
        m.subject === subject &&
        (selectedProcessingClass === 'All' || students.find(s => s.id === m.studentId)?.class === selectedProcessingClass)
      );
      
      const sorted = subjectMarks.sort((a, b) => parseFloat(b.total || b.score) - parseFloat(a.total || a.score));
      const topX = sorted.slice(0, topXSubjectChampionsCount);
      
      const champions = topX.map(m => {
        const student = students.find(s => s.id === m.studentId);
        return student ? { ...student, studentName: student.name, studentClass: student.class, score: m.total || m.score } : null;
      }).filter(Boolean);
      
      return {
        subject,
        champions
      };
    });
  };

  const getTopStudents = () => {
    if (!selectedProcessingExamId) return [];
    
    const exam = exams.find(e => e.id === selectedProcessingExamId);
    if (!exam) return [];

    const classStudents = students.filter(s => 
      (selectedProcessingClass === 'All' ? exam.classes.includes(s.class) : s.class === selectedProcessingClass)
    );
    
    const processed = classStudents.map(student => {
      const studentMarks = marks.filter(m => m.examId === selectedProcessingExamId && m.studentId === student.id);
      
      const aggregateTotal = studentMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      const average = studentMarks.length > 0 ? aggregateTotal / studentMarks.length : 0;
      
      // Find overall grade
      const gradeObj = gradingSystem.find(g => average >= g.min && average <= g.max);
      const grade = gradeObj ? gradeObj.grade : 'E';

      // Count distinctions (A and A-)
      const distinctionsCount = studentMarks.filter(m => {
        const score = parseFloat(m.total || m.score);
        const g = gradingSystem.find(gs => score >= gs.min && score <= gs.max);
        return g && (g.grade === 'A' || g.grade === 'A-');
      }).length;

      // Core subjects total
      const coreSubjectsTotal = studentMarks
        .filter(m => rankingLogic.coreSubjects.includes(m.subject))
        .reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);

      return {
        ...student,
        aggregateTotal,
        average,
        grade,
        distinctionsCount,
        coreSubjectsTotal
      };
    });

    // Ranking Logic
    const ranked = processed.sort((a, b) => {
      if (b.aggregateTotal !== a.aggregateTotal) return b.aggregateTotal - a.aggregateTotal;
      if (b.distinctionsCount !== a.distinctionsCount) return b.distinctionsCount - a.distinctionsCount;
      return b.coreSubjectsTotal - a.coreSubjectsTotal;
    });

    // Assign positions
    let currentPos = 1;
    const positioned = ranked.map((item, idx, arr) => {
      if (idx > 0) {
        const prev = arr[idx - 1];
        const isTie = item.aggregateTotal === prev.aggregateTotal && 
                     item.distinctionsCount === prev.distinctionsCount && 
                     item.coreSubjectsTotal === prev.coreSubjectsTotal;
        if (!isTie) {
          currentPos = idx + 1;
        }
      }
      return { ...item, position: currentPos };
    });

    return positioned.slice(0, topXCount);
  };

  const getMostImproved = (limit: number) => {
    if (exams.length < 2) return [];
    const currentExam = exams[exams.length - 1];
    const prevExam = exams[exams.length - 2];
    
    return students.map(student => {
      const currentMarks = marks.filter(m => m.examId === currentExam.id && m.studentId === student.id);
      const prevMarks = marks.filter(m => m.examId === prevExam.id && m.studentId === student.id);
      
      const currentTotal = currentMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      const prevTotal = prevMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      
      return {
        ...student,
        improvement: currentTotal - prevTotal,
        currentTotal,
        prevTotal
      };
    })
    .filter(s => s.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, limit);
  };

  const getMostDropped = (limit: number) => {
    if (exams.length < 2) return [];
    const currentExam = exams[exams.length - 1];
    const prevExam = exams[exams.length - 2];
    
    return students.map(student => {
      const currentMarks = marks.filter(m => m.examId === currentExam.id && m.studentId === student.id);
      const prevMarks = marks.filter(m => m.examId === prevExam.id && m.studentId === student.id);
      
      const currentTotal = currentMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      const prevTotal = prevMarks.reduce((acc, m) => acc + parseFloat(m.total || m.score || 0), 0);
      
      return {
        ...student,
        drop: prevTotal - currentTotal,
        currentTotal,
        prevTotal
      };
    })
    .filter(s => s.drop > 0)
    .sort((a, b) => b.drop - a.drop)
    .slice(0, limit);
  };

  const analysisData = getAnalysisData();

  const getAnalysisHighlights = () => {
    if (!selectedAnalysisExamId || analysisData.length === 0) return null;

    const bestStudent = analysisData[0];
    
    const currentExam = exams.find(e => e.id === selectedAnalysisExamId);
    if (!currentExam) return { bestStudent };

    const previousExams = exams
      .filter(e => e.id !== selectedAnalysisExamId && e.classes.some(c => currentExam.classes.includes(c)))
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    
    const previousExam = previousExams[0];
    
    if (!previousExam) return { bestStudent };

    const improvements = analysisData.map(student => {
      const prevExamMarks = marks.filter(m => m.examId === previousExam.id && m.studentId === student.id);
      const prevTotal = prevExamMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
      const prevAvg = prevExamMarks.length > 0 ? prevTotal / prevExamMarks.length : null;
      
      if (prevAvg === null) return { ...student, improvement: 0 };
      return { ...student, improvement: student.average - prevAvg };
    });

    const mostImproved = [...improvements].sort((a, b) => b.improvement - a.improvement)[0];
    const mostDropped = [...improvements].sort((a, b) => a.improvement - b.improvement)[0];

    return {
      bestStudent,
      mostImproved: mostImproved && mostImproved.improvement > 0 ? mostImproved : null,
      mostDropped: mostDropped && mostDropped.improvement < 0 ? mostDropped : null,
      previousExamTitle: previousExam.title
    };
  };

  const exportAnalysis = (format: 'excel' | 'pdf' = 'excel') => {
    const isMeritList = academicSubTab === 'merit-list';
    const data = isMeritList ? getMeritListData() : analysisData;
    
    if (!selectedAnalysisExamId || data.length === 0) return;
    
    const exam = exams.find(e => e.id === selectedAnalysisExamId);
    const highlights = getAnalysisHighlights();
    
    if (format === 'excel') {
      const mainSheetData = data.map(row => {
        const exportRow: any = {};
        
        if (isMeritList) {
          exportRow['ADMNO'] = row.adm;
          exportRow['FULL NAMES'] = row.name;
          exportRow['KPSEA'] = '';
          exportRow['STR'] = row.class.substring(0, 1);
          learningAreas.forEach(la => {
            exportRow[la.substring(0, 4).toUpperCase()] = row.subjectScores[la] ?? '';
          });
          exportRow['T Marks'] = row.totalScore;
          exportRow['Mean Grd'] = `${row.average.toFixed(0)} ${row.grade}`;
          exportRow['CLS POS'] = row.clsPos;
          exportRow['FRM POS'] = row.frmPos;
        } else {
          exportRow['Rank'] = row.rank;
          exportRow['Adm No'] = row.adm;
          exportRow['Student Name'] = row.name;
          exportRow['Class'] = row.class;
          learningAreas.forEach(la => {
            exportRow[la] = row.subjectScores[la] ?? '--';
          });
          exportRow['Total'] = row.totalScore;
          exportRow['Average (%)'] = row.average.toFixed(1);
          exportRow['Grade'] = row.grade;
        }
        
        return exportRow;
      });

      const highlightsData = [
        { Category: 'Best Student', Name: highlights?.bestStudent?.name, Detail: `${highlights?.bestStudent?.average.toFixed(1)}% (Rank 1)` },
      ];

      if (highlights?.mostImproved) {
        highlightsData.push({ 
          Category: 'Most Improved', 
          Name: highlights.mostImproved.name, 
          Detail: `+${highlights.mostImproved.improvement.toFixed(1)}% from ${highlights.previousExamTitle}` 
        });
      }

      if (highlights?.mostDropped) {
        highlightsData.push({ 
          Category: 'Most Dropped', 
          Name: highlights.mostDropped.name, 
          Detail: `${highlights.mostDropped.improvement.toFixed(1)}% from ${highlights.previousExamTitle}` 
        });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(mainSheetData);
      const wsHighlights = XLSX.utils.json_to_sheet(highlightsData);
      
      XLSX.utils.book_append_sheet(wb, ws, isMeritList ? "Merit List" : "Full Analysis");
      XLSX.utils.book_append_sheet(wb, wsHighlights, "Highlights");
      
      XLSX.writeFile(wb, `${exam?.title}_${isMeritList ? 'Merit_List' : 'Analysis'}.xlsx`);
    } else {
      // PDF Export
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text(schoolSettings.name || school.name, 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`${exam?.title} - ${isMeritList ? 'Merit List' : 'Performance Analysis'}`, 105, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Class: ${selectedAnalysisClass} | Date: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' });

      if (!isMeritList) {
        // Highlights (Only for Analysis view)
        doc.setFontSize(12);
        doc.text('Analysis Highlights', 14, 45);
        autoTable(doc, {
          startY: 50,
          head: [['Category', 'Student Name', 'Details']],
          body: [
            ['Best Student', highlights?.bestStudent?.name || 'N/A', `${highlights?.bestStudent?.average.toFixed(1)}%`],
            ['Most Improved', highlights?.mostImproved?.name || 'N/A', highlights?.mostImproved ? `+${highlights.mostImproved.improvement.toFixed(1)}%` : 'N/A'],
            ['Most Dropped', highlights?.mostDropped?.name || 'N/A', highlights?.mostDropped ? `-${highlights.mostDropped.improvement.toFixed(1)}%` : 'N/A'],
          ],
          theme: 'striped',
          headStyles: { fillColor: [0, 102, 51] }
        });
      }

      // Main Table
      const tableHead = isMeritList 
        ? [['ADMNO', 'FULL NAMES', 'STR', ...learningAreas.map(la => la.substring(0, 4).toUpperCase()), 'T Marks', 'Mean Grd', 'CLS POS', 'FRM POS']]
        : [['Rank', 'Adm', 'Name', ...learningAreas, 'Total', 'Avg', 'Grade']];
      
      const tableBody = data.map(row => {
        if (isMeritList) {
          return [
            row.adm,
            row.name.toUpperCase(),
            row.class.substring(0, 1),
            ...learningAreas.map(la => row.subjectScores[la] ?? ''),
            row.totalScore.toFixed(0),
            `${row.average.toFixed(0)} ${row.grade}`,
            row.clsPos,
            row.frmPos
          ];
        }
        return [
          row.rank,
          row.adm,
          row.name,
          ...learningAreas.map(la => row.subjectScores[la] ?? '--'),
          row.totalScore.toFixed(0),
          `${row.average.toFixed(1)}%`,
          row.grade
        ];
      });

      autoTable(doc, {
        startY: isMeritList ? 40 : (doc as any).lastAutoTable.finalY + 15,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: isMeritList ? {
          1: { cellWidth: 40 }, // Name column wider
        } : {
          0: { cellWidth: 10 },
          1: { cellWidth: 15 },
          2: { cellWidth: 30 }
        }
      });

      doc.save(`${exam?.title}_${isMeritList ? 'Merit_List' : 'Analysis'}.pdf`);
    }
  };

  const handleUpdateSchool = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Update Supabase
      await supabaseService.updateSchoolSettings(school.id, {
        name: schoolSettings.name,
        motto: schoolSettings.motto,
        email: schoolSettings.email,
        phone: schoolSettings.phone,
        website: schoolSettings.website,
        address: schoolSettings.address,
        letterhead_template: schoolSettings.letterheadTemplate,
        logo_url: schoolSettings.logo
      });

      const allSchools = JSON.parse(localStorage.getItem('alakara_schools') || '[]');
      const updatedSchools = allSchools.map((s: any) => 
        s.id === school.id ? { ...s, ...schoolSettings } : s
      );
      localStorage.setItem('alakara_schools', JSON.stringify(updatedSchools));
      
      // Update current school too
      const currentSchool = JSON.parse(localStorage.getItem('alakara_current_school') || '{}');
      localStorage.setItem('alakara_current_school', JSON.stringify({ ...currentSchool, ...schoolSettings }));
      
      setSchool({ ...school, ...schoolSettings });
      setHasUnsavedChanges(false);
      localStorage.removeItem('alakara_config_draft');
      alert('School settings updated successfully!');
      
      addLog('Update School Settings', `Updated settings for ${schoolSettings.name}`);
    } catch (error: any) {
      alert('Error updating school settings: ' + error.message);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSchoolSettings({ ...schoolSettings, logo: reader.result as string });
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        alert('Error uploading logo: ' + error.message);
      }
    }
  };

  if (!school) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
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
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="bg-kenya-green p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Bora School <span className="text-kenya-red">Principal</span></span>
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
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('staff'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'staff' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <Users className="w-5 h-5" />
              Staff Management
            </button>
            <button 
              onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'students' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <UserCheck className="w-5 h-5" />
              Student Management
            </button>
            <button 
              onClick={() => { setActiveTab('classes'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'classes' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <Library className="w-5 h-5" />
              Class Management
            </button>
            <button 
              onClick={() => { setActiveTab('academic'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'academic' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <BookOpen className="w-5 h-5" />
              Academic Records
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'settings' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <Settings className="w-5 h-5" />
              School Settings
            </button>
            <button 
              onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isSuspended ? 'opacity-50 cursor-not-allowed' : activeTab === 'users' ? 'bg-kenya-green text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} 
              disabled={isSuspended}
            >
              <ShieldCheck className="w-5 h-5" />
              System Users
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
            <h2 className="font-bold text-kenya-black text-lg truncate max-w-[150px] sm:max-w-none">{school.name}</h2>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hidden xs:inline-block ${isSuspended ? 'bg-kenya-red/10 text-kenya-red' : 'bg-kenya-green/10 text-kenya-green'}`}>
              {school.status}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell role="principal" userId={school.id} />
            <div className="h-8 w-px bg-gray-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-kenya-black">{principalProfile?.name || 'Principal'}</p>
                <p className="text-xs text-gray-500">{school.location}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {daysToExpiry !== null && daysToExpiry <= 15 && daysToExpiry > 0 && !isSuspended && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 bg-amber-500 p-6 rounded-[2rem] text-white shadow-xl flex flex-col md:flex-row items-center gap-6 border-4 border-white/20"
            >
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black uppercase tracking-tight">Subscription Expiring Soon</h3>
                <p className="font-bold text-white/90">
                  Your system access will be automatically suspended in <span className="text-2xl font-black underline decoration-white/40">{daysToExpiry} days</span>.
                </p>
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-2xl font-black text-xl border border-white/20">
                Expires: {new Date(school.subscriptionExpiresAt).toLocaleDateString()}
              </div>
            </motion.div>
          )}

          {isSuspended && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-kenya-red p-8 rounded-[2rem] text-white shadow-2xl shadow-kenya-red/30 flex flex-col md:flex-row items-center gap-8 border-4 border-white/20"
            >
              <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md">
                <AlertTriangle className="w-16 h-16 text-white animate-pulse" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">
                  {daysToExpiry !== null && daysToExpiry <= 0 ? 'Subscription Expired' : 'Account Suspended'}
                </h2>
                <p className="text-xl font-bold text-white/90 mb-6">
                  {daysToExpiry !== null && daysToExpiry <= 0 
                    ? 'Your school subscription has expired. Please renew to regain access to management features.'
                    : 'Access to school management features has been restricted by the system administrator.'}
                </p>
                <div className="inline-flex items-center gap-4 bg-white text-kenya-red px-8 py-4 rounded-2xl font-black text-2xl shadow-lg">
                  <Phone className="w-8 h-8" />
                  REQUEST AN ADMIN TO ACTIVATE YOUR USAGE CALL 0713209373
                </div>
              </div>
            </motion.div>
          )}

          <div className={`space-y-8 ${isSuspended ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
            {activeTab === 'dashboard' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-kenya-black">{students.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Active Teachers</p>
                    <p className="text-3xl font-bold text-kenya-black">{staff.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Upcoming Exams</p>
                    <p className="text-3xl font-bold text-kenya-black">{exams.filter(e => e.status === 'Active').length}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-bold text-kenya-black mb-6 uppercase tracking-tight">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => { setActiveTab('staff'); setShowAddStaffModal(true); }}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-kenya-green/5 hover:bg-kenya-green/10 transition-colors group"
                    >
                      <div className="p-3 bg-kenya-green text-white rounded-xl group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-kenya-black">Add Staff</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('students'); setShowAddStudentModal(true); }}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                    >
                      <div className="p-3 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition-transform">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-kenya-black">Add Student</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('academic'); setAcademicSubTab('create-exam'); }}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-colors group"
                    >
                      <div className="p-3 bg-amber-600 text-white rounded-xl group-hover:scale-110 transition-transform">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-kenya-black">New Exam</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-colors group"
                    >
                      <div className="p-3 bg-purple-600 text-white rounded-xl group-hover:scale-110 transition-transform">
                        <Settings className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-kenya-black">Settings</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <h3 className="text-xl font-bold text-kenya-black mb-6">Class Performance Comparison</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="average" fill="#006633" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-kenya-black mb-6">Subject Pass Rates (%)</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectStats} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                          <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} width={80} />
                          <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          />
                          <Bar dataKey="passRate" fill="#006633" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-kenya-black mb-6">Gender Performance Comparison</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genderStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="average"
                            nameKey="gender"
                          >
                            <Cell fill="#006633" />
                            <Cell fill="#990000" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'staff' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Staff Management</h2>
                    <p className="text-gray-500">Manage your teaching and administrative faculty.</p>
                  </div>
                  <Button onClick={() => setShowAddStaffModal(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Faculty Member
                  </Button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Name & Email</th>
                        <th className="px-6 py-4">Current Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {staff.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-kenya-black">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={member.role}
                              onChange={(e) => updateStaffRole(member.id, e.target.value)}
                              disabled={member.role?.toLowerCase() === 'teacher'}
                              className={`bg-gray-50 border border-gray-200 rounded-lg text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-kenya-green/20 ${member.role?.toLowerCase() === 'teacher' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <option value="Principal">Principal</option>
                              <option value="Deputy Principal">Deputy Principal</option>
                              <option value="Teacher">Teacher</option>
                              <option value="Head of Science">Head of Science</option>
                              <option value="Head of Arts">Head of Arts</option>
                              <option value="Senior Teacher">Senior Teacher</option>
                              <option value="Bursar">Bursar</option>
                              <option value="Secretary">Secretary</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-kenya-green/10 text-kenya-green">
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openEditStaff(member)}
                                className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                                title="Edit Staff"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => removeStaff(member.id)}
                                className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                title="Remove Staff"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'students' ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Student Management</h2>
                    <p className="text-gray-500">Register and manage your school's learners.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      type="file" 
                      id="bulk-student-upload" 
                      className="hidden" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleBulkStudentUpload}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={() => document.getElementById('bulk-student-upload')?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Bulk Import
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => downloadStudentTemplate()}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Template
                    </Button>
                    <Button onClick={() => setShowAddStudentModal(true)} className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add Individual Learner
                    </Button>
                  </div>
                </div>

                {/* Search and Sort Controls */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search by name or admission number..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    />
                  </div>
                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select 
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kenya-green/20 min-w-[120px]"
                      >
                        <option value="All">All Classes</option>
                        {Array.from(new Set(students.map(s => s.class))).sort().map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">Sort:</span>
                      <button 
                        onClick={() => toggleStudentSort('name')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${studentSortBy === 'name' ? 'bg-kenya-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Name
                        {studentSortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                      <button 
                        onClick={() => toggleStudentSort('adm')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${studentSortBy === 'adm' ? 'bg-kenya-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Adm
                        {studentSortBy === 'adm' && <ArrowUpDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {Object.keys(groupedStudents).sort().map((className) => (
                    <div key={className} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 py-1 bg-gray-100 rounded-full">
                          {className} ({groupedStudents[className].length})
                        </h3>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                          <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Admission No</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {groupedStudents[className].map((student: any) => (
                              <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-kenya-black">{student.name}</td>
                                <td className="px-6 py-4 font-mono text-sm text-gray-500">{student.adm}</td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-kenya-green/10 text-kenya-green">
                                    {student.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => openEditStudent(student)}
                                      className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                                      title="Edit Student"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => removeStudent(student.id)}
                                      className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                      title="Remove Student"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(groupedStudents).length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 italic">No students found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'classes' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Class Management</h2>
                    <p className="text-gray-500">Create and manage classes and assign class teachers.</p>
                  </div>
                  <Button onClick={() => setShowAddClassModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Class
                  </Button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Class Name</th>
                        <th className="px-6 py-4">Class Teacher</th>
                        <th className="px-6 py-4">Capacity</th>
                        <th className="px-6 py-4">Students Enrolled</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {classes.map((cls) => {
                        const teacher = staff.find(s => s.id === cls.teacherId);
                        const enrolled = students.filter(s => s.class === cls.name).length;
                        return (
                          <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-kenya-black">{cls.name}</td>
                            <td className="px-6 py-4 text-gray-600">{teacher ? teacher.name : <span className="text-gray-400 italic">Not Assigned</span>}</td>
                            <td className="px-6 py-4 text-gray-600">{cls.capacity}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enrolled >= cls.capacity ? 'bg-kenya-red/10 text-kenya-red' : 'bg-kenya-green/10 text-kenya-green'}`}>
                                {enrolled} / {cls.capacity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => setManagingClass(cls)}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Manage Students"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => openEditClass(cls)}
                                  className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                                  title="Edit Class"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => removeClass(cls.id)}
                                  className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                  title="Remove Class"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'users' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">System Users & Credentials</h2>
                    <p className="text-gray-500">View and manage all user accounts and their passwords.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-kenya-black flex items-center gap-2">
                      <Users className="w-5 h-5 text-kenya-green" />
                      Staff Accounts
                    </h3>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Username/Email</th>
                            <th className="px-4 py-3">Password</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {staff.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-sm">{member.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{member.username || member.email}</td>
                              <td className="px-4 py-3 font-mono text-xs text-kenya-red font-bold">{member.password || '********'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-kenya-black flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      Student Accounts
                    </h3>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Admission No</th>
                            <th className="px-4 py-3">Password</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-sm">{student.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{student.adm}</td>
                              <td className="px-4 py-3 font-mono text-xs text-kenya-red font-bold">{student.password || '********'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'academic' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-kenya-black">Academic Management</h2>
                    <p className="text-gray-500">Oversee exams, grading, and student performance.</p>
                  </div>
                  {academicSubTab !== 'overview' && (
                    <Button variant="ghost" onClick={() => setAcademicSubTab('overview')} className="gap-2">
                      Back to Academic Overview
                    </Button>
                  )}
                </div>

                {academicSubTab === 'overview' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { id: 'create-exam', title: 'Create New Exam', desc: 'Schedule and set up new examinations.', icon: PlusCircle, color: 'text-kenya-green', bg: 'bg-kenya-green/10' },
                      { id: 'learning-area', title: 'Learning Areas', desc: 'Manage subjects and curriculum areas.', icon: Library, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { id: 'grading', title: 'Grading System', desc: 'Define grade boundaries and scales.', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
                      { id: 'edit-exam', title: 'Edit Exams & Subjects', desc: 'Modify existing exam configurations.', icon: Edit3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { id: 'analysis', title: 'Analyse Results', desc: 'Deep dive into student performance data.', icon: BarChart3, color: 'text-kenya-red', bg: 'bg-kenya-red/10' },
                      { id: 'results-processing', title: 'Results Processing', desc: 'Subject champions and top performers.', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                      { id: 'merit-list', title: 'Merit List', desc: 'Detailed spreadsheet-style performance list.', icon: ClipboardList, color: 'text-kenya-green', bg: 'bg-kenya-green/10' },
                      { id: 'marks-entry', title: 'Marks Entry', desc: 'Directly enter and update student scores.', icon: Edit, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { id: 'reports', title: 'Generate Report Cards', desc: 'Produce and distribute student reports.', icon: FileSpreadsheet, color: 'text-purple-600', bg: 'bg-purple-50' },
                      { id: 'academic-settings', title: 'Academic Settings', desc: 'Configure assessments and ranking logic.', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setAcademicSubTab(item.id as any)}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
                      >
                        <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-kenya-black mb-1 flex items-center justify-between">
                          {item.title}
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : academicSubTab === 'create-exam' ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-kenya-black mb-6">Setup New Examination</h3>
                    <form onSubmit={handleCreateExam} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-bold text-kenya-black">Exam Title</label>
                          <input 
                            type="text" required
                            value={newExam.title}
                            onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                            placeholder="e.g. End of Term 1 Exams"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-kenya-black">Term</label>
                          <select 
                            value={newExam.term}
                            onChange={(e) => setNewExam({...newExam, term: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option>Term 1</option>
                            <option>Term 2</option>
                            <option>Term 3</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-kenya-black">Year</label>
                          <select 
                            value={newExam.year}
                            onChange={(e) => setNewExam({...newExam, year: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option>2024</option>
                            <option>2025</option>
                            <option>2026</option>
                          </select>
                        </div>
                      </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-kenya-black">Target Class</label>
                          <select 
                            required
                            value={newExam.classes[0] || ''}
                            onChange={(e) => setNewExam({...newExam, classes: [e.target.value]})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option value="">Select Class...</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-kenya-black">Subject (Optional)</label>
                          <select 
                            value={newExam.subjects[0] || ''}
                            onChange={(e) => setNewExam({...newExam, subjects: [e.target.value]})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option value="">All Subjects</option>
                            {learningAreas.map(la => (
                              <option key={la} value={la}>{la}</option>
                            ))}
                          </select>
                        </div>

                      <div className="grid grid-cols-2 gap-6 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setAcademicSubTab('overview')} className="w-full">Cancel</Button>
                        <Button type="submit" className="w-full">Create & Activate Exam</Button>
                      </div>
                    </form>
                  </div>
                ) : academicSubTab === 'learning-area' ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-6">Manage Learning Areas</h3>
                      <div className="flex gap-4 mb-8">
                        <input 
                          type="text" 
                          id="new-la-input"
                          placeholder="Enter subject name..."
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addLearningArea((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button onClick={() => {
                          const input = document.getElementById('new-la-input') as HTMLInputElement;
                          addLearningArea(input.value);
                          input.value = '';
                        }}>Add Subject</Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {learningAreas.map((la) => (
                          <div key={la} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                            <span className="font-bold text-kenya-black">{la}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => {
                                  const newName = prompt(`Edit ${la}:`, la);
                                  if (newName) editLearningArea(la, newName);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => removeLearningArea(la)}
                                className="p-2 text-gray-400 hover:text-kenya-red"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : academicSubTab === 'grading' ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-kenya-black">Grading System Configuration</h3>
                        <p className="text-sm text-gray-500">Adjust grade boundaries and points for the current term.</p>
                      </div>
                      <Button onClick={addGrade} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Grade
                      </Button>
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Grade</th>
                          <th className="px-6 py-4">Min Score</th>
                          <th className="px-6 py-4">Max Score</th>
                          <th className="px-6 py-4">Points</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gradingSystem.map((g, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={g.grade}
                                onChange={(e) => updateGradeBoundary(idx, 'grade', e.target.value)}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-black text-kenya-black"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={g.min}
                                onChange={(e) => updateGradeBoundary(idx, 'min', parseInt(e.target.value))}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={g.max}
                                onChange={(e) => updateGradeBoundary(idx, 'max', parseInt(e.target.value))}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={g.points}
                                onChange={(e) => updateGradeBoundary(idx, 'points', parseInt(e.target.value))}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => removeGrade(idx)}
                                className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : academicSubTab === 'marks-entry' ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-kenya-black">Direct Marks Entry</h3>
                          <p className="text-sm text-gray-500">Select an exam and class to enter scores directly.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          {Object.keys(pendingMarks).length > 0 && (
                            <Button onClick={savePendingMarks} className="gap-2 shadow-lg shadow-kenya-green/20">
                              <Save className="w-4 h-4" />
                              Save Changes ({Object.keys(pendingMarks).length})
                            </Button>
                          )}
                          <select 
                            value={selectedAnalysisClass}
                            onChange={(e) => setSelectedAnalysisClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="All">Select Class...</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedAnalysisExamId}
                            onChange={(e) => setSelectedAnalysisExamId(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Examination...</option>
                            {exams.map(e => (
                              <option key={e.id} value={e.id}>{e.title} ({e.term} {e.year})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {!selectedAnalysisExamId || selectedAnalysisClass === 'All' ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <Edit className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium italic">Please select both an examination and a class to enter marks.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                          <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                              <tr className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                <th className="px-4 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">ADMNO</th>
                                <th className="px-4 py-3 border-r border-gray-200 sticky left-[100px] bg-gray-50 z-10 min-w-[200px]">STUDENT NAME</th>
                                {learningAreas.map(la => (
                                  <th key={la} className="px-2 py-3 border-r border-gray-200 text-center min-w-[80px]">{la.substring(0, 4).toUpperCase()}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {students.filter(s => s.class === selectedAnalysisClass).map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 border-r border-gray-100 sticky left-0 bg-white z-10 font-mono text-xs">{student.adm}</td>
                                  <td className="px-4 py-3 border-r border-gray-100 sticky left-[100px] bg-white z-10 font-bold text-kenya-black uppercase">{student.name}</td>
                                  {learningAreas.map(la => {
                                    const key = `${selectedAnalysisExamId}|${student.id}|${la}`;
                                    const currentMark = pendingMarks[key] !== undefined 
                                      ? pendingMarks[key] 
                                      : marks.find(m => m.studentId === student.id && m.examId === selectedAnalysisExamId && m.subject === la)?.score || '';
                                    
                                    return (
                                      <td key={la} className="px-2 py-2 border-r border-gray-100 text-center">
                                        <input 
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={currentMark}
                                          onChange={(e) => {
                                            let val = e.target.value;
                                            if (parseFloat(val) > 100) val = '100';
                                            if (parseFloat(val) < 0) val = '0';
                                            setPendingMarks({
                                              ...pendingMarks,
                                              [key]: val
                                            });
                                          }}
                                          className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                                          placeholder="-"
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : academicSubTab === 'merit-list' ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-kenya-black">Merit List</h3>
                          <p className="text-sm text-gray-500">Official ranking and performance breakdown.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <select 
                            value={selectedAnalysisClass}
                            onChange={(e) => setSelectedAnalysisClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="All">All Classes</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedAnalysisExamId}
                            onChange={(e) => setSelectedAnalysisExamId(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Examination...</option>
                            {exams.map(e => (
                              <option key={e.id} value={e.id}>{e.title} ({e.term} {e.year})</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Sort By:</span>
                            <select 
                              value={meritListSortBy}
                              onChange={(e) => setMeritListSortBy(e.target.value as any)}
                              className="bg-transparent border-none focus:ring-0 font-bold text-xs text-kenya-black"
                            >
                              <option value="total">Total Marks</option>
                              <option value="average">Average (%)</option>
                              <option value="position">Position</option>
                              <option value="name">Name</option>
                              <option value="gender">Gender</option>
                              <option value="stream">Stream</option>
                            </select>
                          </div>
                          {selectedAnalysisExamId && (
                            <Button onClick={() => exportAnalysis('excel')} variant="secondary" className="gap-2 py-2 text-xs">
                              <Download className="w-4 h-4" />
                              Export Excel
                            </Button>
                          )}
                        </div>
                      </div>

                      {!selectedAnalysisExamId ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium italic">Please select an examination to view the merit list.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-100 rounded-xl">
                          <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                              <tr className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                <th className="px-2 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">ADMNO</th>
                                <th className="px-2 py-3 border-r border-gray-200 sticky left-[60px] bg-gray-50 z-10 min-w-[180px]">FULL NAMES</th>
                                <th className="px-2 py-3 border-r border-gray-200 text-center">KPSEA</th>
                                <th className="px-2 py-3 border-r border-gray-200 text-center">STR</th>
                                {learningAreas.map(la => (
                                  <th key={la} className="px-2 py-3 border-r border-gray-200 text-center min-w-[60px]">{la.substring(0, 4).toUpperCase()}</th>
                                ))}
                                <th className="px-2 py-3 border-r border-gray-200 text-center">T Marks</th>
                                <th className="px-2 py-3 border-r border-gray-200 text-center">Mean Grd</th>
                                <th className="px-2 py-3 border-r border-gray-200 text-center">CLS POS</th>
                                <th className="px-2 py-3 text-center">FRM POS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {getMeritListData().map((row: any) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors text-[11px] font-bold">
                                  <td className="px-2 py-2 border-r border-gray-100 sticky left-0 bg-white z-10">{row.adm}</td>
                                  <td className="px-2 py-2 border-r border-gray-100 sticky left-[60px] bg-white z-10 uppercase">{row.name}</td>
                                  <td className="px-2 py-2 border-r border-gray-100 text-center text-gray-300">-</td>
                                  <td className="px-2 py-2 border-r border-gray-100 text-center">{row.class.substring(0, 1)}</td>
                                  {learningAreas.map(la => (
                                    <td key={la} className="px-2 py-2 border-r border-gray-100 text-center">
                                      {row.subjectScores[la] !== null ? row.subjectScores[la] : ''}
                                    </td>
                                  ))}
                                  <td className="px-2 py-2 border-r border-gray-100 text-center font-black">{row.totalScore.toFixed(0)}</td>
                                  <td className="px-2 py-2 border-r border-gray-100 text-center">{row.average.toFixed(0)} {row.grade}</td>
                                  <td className="px-2 py-2 border-r border-gray-100 text-center">{row.clsPos}</td>
                                  <td className="px-2 py-2 text-center">{row.frmPos}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : academicSubTab === 'academic-settings' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Assessment Categories */}
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-kenya-black">Assessment Categories</h3>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const name = prompt('Enter category name (e.g. CAT 1):');
                            const max = prompt('Enter maximum score:');
                            if (name && max) {
                              setAssessmentCategories([...assessmentCategories, { id: name.toLowerCase().replace(/\s+/g, '-'), name, maxScore: parseInt(max) }]);
                            }
                          }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Category
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {assessmentCategories.map((cat, idx) => (
                            <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <div>
                                <p className="font-bold text-kenya-black">{cat.name}</p>
                                <p className="text-xs text-gray-500">Max Score: {cat.maxScore}</p>
                              </div>
                              <button 
                                onClick={() => setAssessmentCategories(assessmentCategories.filter((_, i) => i !== idx))}
                                className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ranking Logic */}
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h3 className="text-xl font-bold text-kenya-black mb-6">Ranking Logic Configuration</h3>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase">Primary Ranking Criteria</label>
                            <select 
                              value={rankingLogic.primaryCriteria}
                              onChange={(e) => setRankingLogic({...rankingLogic, primaryCriteria: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                            >
                              <option value="aggregate_total">Aggregate Total Marks</option>
                              <option value="average_score">Overall Average Score</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase">Core Subjects (Tie-Breakers)</label>
                            <div className="grid grid-cols-2 gap-2">
                              {learningAreas.map(la => (
                                <label key={la} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={rankingLogic.coreSubjects.includes(la)}
                                    onChange={(e) => {
                                      const subjects = e.target.checked 
                                        ? [...rankingLogic.coreSubjects, la]
                                        : rankingLogic.coreSubjects.filter((s: string) => s !== la);
                                      setRankingLogic({...rankingLogic, coreSubjects: subjects});
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-kenya-green"
                                  />
                                  <span className="text-xs font-medium text-gray-600">{la}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exam Locking Control */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-6">Result Locking Control</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exams.map(exam => (
                          <div key={exam.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-kenya-black">{exam.title}</p>
                              <p className="text-xs text-gray-500">{exam.term} {exam.year}</p>
                            </div>
                            <Button 
                              variant={exam.locked ? 'secondary' : 'default'}
                              size="sm"
                              onClick={() => {
                                const newExams = exams.map(e => e.id === exam.id ? {...e, locked: !e.locked} : e);
                                setExams(newExams);
                              }}
                              className="gap-2"
                            >
                              {exam.locked ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              {exam.locked ? 'Unlock' : 'Lock'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : academicSubTab === 'edit-exam' ? (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-8">Edit Exam Configuration</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase">Select Class</label>
                          <select 
                            value={selectedEditClass}
                            onChange={(e) => setSelectedEditClass(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option value="">Choose Class...</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase">Select Subject</label>
                          <select 
                            value={selectedEditSubject}
                            onChange={(e) => setSelectedEditSubject(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option value="">Choose Subject...</option>
                            {learningAreas.map(la => <option key={la} value={la}>{la}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase">Select Exam</label>
                          <select 
                            value={selectedEditExamId}
                            onChange={(e) => setSelectedEditExamId(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                          >
                            <option value="">Choose Exam...</option>
                            {exams.filter(e => e.classes.includes(selectedEditClass) || e.classes.length === 0).map(e => (
                              <option key={e.id} value={e.id}>{e.title} ({e.term} {e.year})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {selectedEditExamId && (
                        <div className="space-y-6 border-t border-gray-100 pt-8">
                          {exams.find(e => e.id === selectedEditExamId)?.locked ? (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800">
                              <Lock className="w-5 h-5" />
                              <p className="text-sm font-medium">This exam is locked and cannot be edited. Please unlock it first.</p>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-gray-500 uppercase">Weighting (%)</label>
                                  <input 
                                    type="number"
                                    value={editExamConfig.weighting}
                                    onChange={(e) => setEditExamConfig({...editExamConfig, weighting: parseInt(e.target.value)})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-gray-500 uppercase">Max Marks</label>
                                  <input 
                                    type="number"
                                    value={editExamConfig.maxMarks}
                                    onChange={(e) => setEditExamConfig({...editExamConfig, maxMarks: parseInt(e.target.value)})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setSelectedEditExamId('')}>Cancel</Button>
                                <Button onClick={() => setShowEditConfirmation(true)} className="gap-2">
                                  <Save className="w-4 h-4" />
                                  Save Changes
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : academicSubTab === 'analysis' ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-kenya-black">Exam Analysis</h3>
                          <p className="text-sm text-gray-500">Select an examination to view detailed performance analysis.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <select 
                            value={selectedAnalysisClass}
                            onChange={(e) => setSelectedAnalysisClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="All">All Classes</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedAnalysisExamId}
                            onChange={(e) => setSelectedAnalysisExamId(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Examination...</option>
                            {exams.map(e => (
                              <option key={e.id} value={e.id}>{e.title} ({e.term} {e.year})</option>
                            ))}
                          </select>
                          
                          {selectedAnalysisExamId && (
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={analysisOptions.showGrades}
                                    onChange={(e) => setAnalysisOptions({...analysisOptions, showGrades: e.target.checked})}
                                    className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                  />
                                  <span className="text-xs font-bold text-gray-600">Show Grades</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={analysisOptions.showRank}
                                    onChange={(e) => setAnalysisOptions({...analysisOptions, showRank: e.target.checked})}
                                    className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                  />
                                  <span className="text-xs font-bold text-gray-600">Show Rank</span>
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button onClick={() => exportAnalysis('excel')} variant="secondary" className="gap-2 py-2 text-xs">
                                  <Download className="w-4 h-4" />
                                  Excel
                                </Button>
                                <Button onClick={() => exportAnalysis('pdf')} className="gap-2 py-2 text-xs">
                                  <Download className="w-4 h-4" />
                                  PDF
                                </Button>
                                <Button onClick={() => window.print()} variant="ghost" className="gap-2 py-2 text-xs border border-gray-200">
                                  <Printer className="w-4 h-4" />
                                  Print Analysis
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {!selectedAnalysisExamId ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium italic">Please select an examination to begin analysis.</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Highlights Section */}
                          {getAnalysisHighlights() && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-kenya-green/5 border border-kenya-green/10 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-kenya-green uppercase tracking-widest mb-1">Best Student</p>
                                <p className="text-lg font-black text-kenya-black">{getAnalysisHighlights()?.bestStudent?.name}</p>
                                <p className="text-xs font-bold text-gray-500">{getAnalysisHighlights()?.bestStudent?.average.toFixed(1)}% Mean Score</p>
                              </div>
                              
                              {getAnalysisHighlights()?.mostImproved && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Most Improved</p>
                                  <p className="text-lg font-black text-kenya-black">{getAnalysisHighlights()?.mostImproved?.name}</p>
                                  <p className="text-xs font-bold text-blue-500">+{getAnalysisHighlights()?.mostImproved?.improvement.toFixed(1)}% from {getAnalysisHighlights()?.previousExamTitle}</p>
                                </div>
                              )}

                              {getAnalysisHighlights()?.mostDropped && (
                                <div className="bg-kenya-red/5 border border-kenya-red/10 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black text-kenya-red uppercase tracking-widest mb-1">Most Dropped</p>
                                  <p className="text-lg font-black text-kenya-black">{getAnalysisHighlights()?.mostDropped?.name}</p>
                                  <p className="text-xs font-bold text-kenya-red">{getAnalysisHighlights()?.mostDropped?.improvement.toFixed(1)}% from {getAnalysisHighlights()?.previousExamTitle}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
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
                                <th className="px-4 py-4 text-right font-black text-kenya-black">Actions</th>
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
                                  <td className="px-4 py-4 font-bold text-kenya-black sticky left-0 bg-white z-10">
                                    <div className="flex items-center gap-3">
                                      {row.profile_image ? (
                                        <img src={row.profile_image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                          <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                      )}
                                      {row.name}
                                    </div>
                                  </td>
                                  {learningAreas.map(la => {
                                    const score = row.subjectScores[la];
                                    const gradeObj = gradingSystem.find(g => score !== null && score >= g.min && score <= g.max);
                                    return (
                                      <td key={la} className="px-4 py-4 text-center">
                                        <div className="flex flex-col items-center group relative">
                                          <span className={`font-bold ${score === null ? 'text-gray-300' : 'text-kenya-black'}`}>
                                            {score !== null ? score : '--'}
                                          </span>
                                          {analysisOptions.showGrades && score !== null && (
                                            <span className="text-[10px] font-black text-kenya-green">{gradeObj?.grade}</span>
                                          )}
                                          {score !== null && (
                                            <button 
                                              onClick={() => deleteStudentMark(row.id, selectedAnalysisExamId, la)}
                                              className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-sm border border-gray-100 text-kenya-red opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
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
                                  <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => {
                                          if (window.confirm(`Delete ALL marks for ${row.name} in this exam?`)) {
                                            setMarks(marks.filter(m => !(m.studentId === row.id && m.examId === selectedAnalysisExamId)));
                                          }
                                        }}
                                        className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                        title="Delete All Marks"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-kenya-black mb-6">Subject Performance Averages</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockAnalysisData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                cursor={{fill: '#f9fafb'}}
                              />
                              <Bar dataKey="average" fill="#006633" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-kenya-black mb-6">Performance Range (Top vs Bottom)</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockAnalysisData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                              <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="top" stroke="#006633" strokeWidth={3} dot={{r: 6, fill: '#006633'}} />
                              <Line type="monotone" dataKey="bottom" stroke="#990000" strokeWidth={3} dot={{r: 6, fill: '#990000'}} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-6">Examination Management</h3>
                      <div className="overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                              <th className="px-6 py-4">Exam Title</th>
                              <th className="px-6 py-4">Term/Year</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {exams.map((exam) => (
                              <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-bold text-kenya-black">{exam.title}</p>
                                  <p className="text-xs text-gray-500">{exam.classes.join(', ')}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-kenya-black">{exam.term} {exam.year}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    exam.status === 'Active' ? 'bg-kenya-green/10 text-kenya-green' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {exam.status === 'Active' ? 'Open for Marks' : 'Processed'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {exam.status === 'Active' ? (
                                      <button 
                                        onClick={() => processExam(exam.id)}
                                        className="p-2 text-kenya-green hover:bg-kenya-green/10 rounded-lg transition-colors"
                                        title="Process & Lock Marks"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => recallExam(exam.id)}
                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="Recall Exam (Allow Editing)"
                                      >
                                        <ArrowUpDown className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => deleteExam(exam.id)}
                                      className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                      title="Delete Exam"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                ) : academicSubTab === 'results-processing' ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-kenya-black">Results Processing</h3>
                          <p className="text-sm text-gray-500">Manage bulk uploads and identify top performers.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <Button onClick={printRawMarks} variant="outline" size="sm" className="gap-2">
                            <Printer className="w-4 h-4" />
                            Print Raw Marks
                          </Button>
                          <Button onClick={publishAnalysedResults} variant="secondary" size="sm" className="gap-2">
                            <Globe className="w-4 h-4" />
                            Publish Results
                          </Button>
                          <Button onClick={unpublishAnalysedResults} variant="ghost" size="sm" className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                            <ShieldAlert className="w-4 h-4" />
                            Recall Results
                          </Button>
                          <select 
                            value={selectedProcessingClass}
                            onChange={(e) => setSelectedProcessingClass(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="All">All Classes</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedProcessingExamId}
                            onChange={(e) => setSelectedProcessingExamId(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold text-sm"
                          >
                            <option value="">Select Examination...</option>
                            {exams.map(e => (
                              <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                          </select>
                          
                          <div className="flex items-center gap-2">
                            {stagedMarks && (
                              <Button onClick={saveStagedMarks} className="gap-2 shadow-lg shadow-kenya-green/20">
                                <Save className="w-4 h-4" />
                                Save Uploaded Marks
                              </Button>
                            )}
                            <Button onClick={downloadBulkMarksTemplate} variant="ghost" size="sm" className="gap-2">
                              <Download className="w-4 h-4" />
                              Template
                            </Button>
                            <label className="cursor-pointer">
                              <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleBulkMarksUpload} />
                              <div className="bg-kenya-green text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-kenya-green/90 transition-colors">
                                <Upload className="w-4 h-4" />
                                Bulk Upload
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {!selectedProcessingExamId ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium italic">Select an examination to begin processing results.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Subject Champions */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Subject Champions</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Show Top</span>
                                <select 
                                  value={topXSubjectChampionsCount}
                                  onChange={(e) => setTopXSubjectChampionsCount(parseInt(e.target.value))}
                                  className="text-[10px] font-black bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
                                >
                                  <option value={1}>1</option>
                                  <option value={3}>3</option>
                                  <option value={5}>5</option>
                                  <option value={10}>10</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {getSubjectChampions().map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4 group hover:border-kenya-green/30 transition-all">
                                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm font-black text-kenya-green text-xs">
                                        {item.subject.substring(0, 2).toUpperCase()}
                                      </div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.subject}</p>
                                    </div>
                                    <button 
                                      onClick={() => setViewingSubjectChampions(item.subject)}
                                      className="text-[10px] font-bold text-kenya-green hover:underline"
                                    >
                                      View All
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {item.champions.length > 0 ? item.champions.map((champ: any, cIdx: number) => (
                                      <div key={cIdx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-black text-gray-300 w-4">#{cIdx + 1}</span>
                                          <div>
                                            <p className="text-sm font-bold text-kenya-black leading-none">{champ.studentName}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{champ.studentClass}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-black text-kenya-green">{champ.score}%</p>
                                        </div>
                                      </div>
                                    )) : (
                                      <p className="text-xs text-gray-400 italic text-center py-2">No data available</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Top Overall Performers */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Overall Merit List</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Show Top</span>
                                <select 
                                  value={topXCount}
                                  onChange={(e) => setTopXCount(parseInt(e.target.value))}
                                  className="text-[10px] font-black bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
                                >
                                  <option value={3}>3</option>
                                  <option value={5}>5</option>
                                  <option value={10}>10</option>
                                  <option value={20}>20</option>
                                  <option value={50}>50</option>
                                </select>
                              </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                              <table className="w-full text-left min-w-[400px]">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">Avg</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {getTopStudents().map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                                          idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                          idx === 1 ? 'bg-gray-100 text-gray-600' :
                                          idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-kenya-black">{student.name}</p>
                                        <p className="text-[10px] text-gray-500">{student.adm} • {student.class}</p>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="text-sm font-black text-kenya-green">{student.average.toFixed(1)}%</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Most Improved */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Most Improved</h4>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Top positive growth</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">Growth</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {getMostImproved(5).map((student, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="font-bold text-kenya-black text-xs">{student.name}</p>
                                        <p className="text-[10px] text-gray-500">{student.adm}</p>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="font-black text-blue-600">+{student.improvement.toFixed(1)}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Most Dropped */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-kenya-black uppercase tracking-widest text-sm">Most Dropped</h4>
                              <span className="text-[10px] font-bold text-kenya-red uppercase tracking-wider">Highest performance drop</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">Drop</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {getMostDropped(5).map((student, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <p className="font-bold text-kenya-black text-xs">{student.name}</p>
                                        <p className="text-[10px] text-gray-500">{student.adm}</p>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="font-black text-kenya-red">-{student.drop.toFixed(1)}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : academicSubTab === 'reports' ? (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                      <h3 className="text-xl font-bold text-kenya-black mb-8">Generate Student Report Card</h3>
                      
                      <div className="space-y-8">
                        {/* Step 1: Select Student or Class */}
                        <div className="space-y-4">
                          <label className="text-sm font-black text-kenya-black uppercase tracking-wider">1. Select Learner or Class</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select 
                                value={reportConfig.selectedStudentId}
                                onChange={(e) => setReportConfig({...reportConfig, selectedStudentId: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 appearance-none"
                              >
                                <option value="">Choose a student...</option>
                                {students.map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.adm}) - {s.class}</option>
                                ))}
                              </select>
                            </div>
                            <div className="relative">
                              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select 
                                value={reportConfig.selectedClass}
                                onChange={(e) => setReportConfig({...reportConfig, selectedClass: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 appearance-none"
                              >
                                <option value="All">Or generate for entire class...</option>
                                {classes.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Step 2: Select Exams */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-black text-kenya-black uppercase tracking-wider">2. Include Examinations</label>
                            {reportConfig.selectedClass !== 'All' && reportConfig.selectedExamIds.length > 0 && (
                              <Button 
                                size="sm" 
                                onClick={generateAllClassReports}
                                className="gap-2 bg-kenya-black hover:bg-kenya-black/90"
                              >
                                <Download className="w-4 h-4" />
                                Generate Class ZIP
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {exams.map(exam => (
                              <label key={exam.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${reportConfig.selectedExamIds.includes(exam.id) ? 'bg-kenya-green/5 border-kenya-green' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.selectedExamIds.includes(exam.id)}
                                  onChange={() => {
                                    const newIds = reportConfig.selectedExamIds.includes(exam.id)
                                      ? reportConfig.selectedExamIds.filter(id => id !== exam.id)
                                      : [...reportConfig.selectedExamIds, exam.id];
                                    setReportConfig({...reportConfig, selectedExamIds: newIds});
                                  }}
                                  className="w-5 h-5 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <div>
                                  <p className="font-bold text-kenya-black text-sm">{exam.title}</p>
                                  <p className="text-xs text-gray-500">{exam.term} {exam.year}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Step 3: Report Options */}
                        <div className="space-y-4">
                          <label className="text-sm font-black text-kenya-black uppercase tracking-wider">3. Report Customization</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <div className="space-y-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includeAverages}
                                  onChange={(e) => setReportConfig({...reportConfig, includeAverages: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Include Subject Averages</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includeGrades}
                                  onChange={(e) => setReportConfig({...reportConfig, includeGrades: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Include Letter Grades</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includeLetterhead}
                                  onChange={(e) => setReportConfig({...reportConfig, includeLetterhead: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Show School Letterhead</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={reportConfig.includePerformanceTrend}
                                  onChange={(e) => setReportConfig({...reportConfig, includePerformanceTrend: e.target.checked})}
                                  className="w-4 h-4 rounded border-gray-300 text-kenya-green focus:ring-kenya-green"
                                />
                                <span className="text-sm font-bold text-kenya-black">Track Performance Trend</span>
                              </label>
                            </div>
                            <div className="space-y-2 col-span-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Report Card Template</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                  { id: 'classic', name: 'Classic' },
                                  { id: 'modern', name: 'Modern' },
                                  { id: 'graph', name: 'Graph-Based' },
                                  { id: 'primary', name: 'Primary' },
                                  { id: 'compact', name: 'Compact' },
                                ].map(t => (
                                  <button 
                                    key={t.id}
                                    onClick={() => setReportConfig({...reportConfig, templateType: t.id as any})}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${reportConfig.templateType === t.id ? 'bg-kenya-black text-white border-kenya-black' : 'bg-white text-gray-500 border-gray-200'}`}
                                  >
                                    {t.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 uppercase">Performance Graph Type</label>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setReportConfig({...reportConfig, graphType: 'bar'})}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${reportConfig.graphType === 'bar' ? 'bg-kenya-black text-white border-kenya-black' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                  Bar Chart
                                </button>
                                <button 
                                  onClick={() => setReportConfig({...reportConfig, graphType: 'line'})}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${reportConfig.graphType === 'line' ? 'bg-kenya-black text-white border-kenya-black' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                  Trend Line
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button onClick={handleGenerateReport} className="w-full py-4 rounded-xl font-black text-lg shadow-xl shadow-kenya-green/20">
                          Generate & Download Report Card
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-kenya-black mb-2 uppercase tracking-tight">
                      {academicSubTab.replace('-', ' ')}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                      This module is being configured for the current academic term. Please check back shortly.
                    </p>
                    <Button onClick={() => setAcademicSubTab('overview')}>Return to Menu</Button>
                  </div>
                )}
              </div>
            ) : activeTab === 'settings' ? (
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">School Configuration</h1>
                    <p className="text-gray-500">Manage your institution's identity and communication standards.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: School Info Form */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-kenya-black flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-kenya-green" />
                          Institution Details
                        </h3>
                      </div>
                      
                      <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-bold text-kenya-black">School Name</label>
                            <input 
                              type="text" 
                              value={schoolSettings.name}
                              onChange={(e) => setSchoolSettings({...schoolSettings, name: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              placeholder="e.g. Bora School High School"
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-bold text-kenya-black">School Motto</label>
                            <div className="relative">
                              <Quote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={schoolSettings.motto}
                                onChange={(e) => setSchoolSettings({...schoolSettings, motto: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="e.g. Excellence in Service"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Official Email</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="email" 
                                value={schoolSettings.email}
                                onChange={(e) => setSchoolSettings({...schoolSettings, email: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="info@school.ac.ke"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Phone Number</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={schoolSettings.phone}
                                onChange={(e) => setSchoolSettings({...schoolSettings, phone: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="+254 700 000 000"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Website</label>
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={schoolSettings.website}
                                onChange={(e) => setSchoolSettings({...schoolSettings, website: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                                placeholder="www.school.ac.ke"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-kenya-black">Physical Address</label>
                            <input 
                              type="text" 
                              value={schoolSettings.address}
                              onChange={(e) => setSchoolSettings({...schoolSettings, address: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                              placeholder="P.O. Box 123, Nairobi"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-kenya-black flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-kenya-green" />
                          Letterhead Designer
                        </h3>
                      </div>
                      <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { id: 'standard', name: 'Standard', desc: 'Classic centered layout' },
                            { id: 'modern', name: 'Modern', desc: 'Clean left-aligned style' },
                            { id: 'minimal', name: 'Minimal', desc: 'Sleek professional look' },
                            { id: 'elegant', name: 'Elegant', desc: 'Sophisticated serif design' },
                            { id: 'bold', name: 'Bold', desc: 'Strong header presence' },
                            { id: 'compact', name: 'Compact', desc: 'Space-saving layout' }
                          ].map(template => (
                            <button
                              key={template.id}
                              onClick={() => setSchoolSettings({...schoolSettings, letterheadTemplate: template.id})}
                              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                                schoolSettings.letterheadTemplate === template.id 
                                  ? 'border-kenya-green bg-kenya-green/5' 
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <p className="font-bold text-kenya-black text-sm">{template.name}</p>
                              <p className="text-[10px] text-gray-500">{template.desc}</p>
                            </button>
                          ))}
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                          <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Live Preview</p>
                          <div className="bg-white shadow-lg rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center border border-gray-200">
                            <Letterhead settings={schoolSettings} />
                            <div className="w-full h-32 bg-gray-50 rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs italic">
                              Document Content Area
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Logo Upload & Subjects */}
                  <div className="space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                      <h3 className="text-lg font-bold text-kenya-black mb-6">School Seal / Logo</h3>
                      <div className="relative group mx-auto w-48 h-48 mb-6">
                        <div className="w-full h-full rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group-hover:border-kenya-green transition-colors">
                          {schoolSettings.logo ? (
                            <img src={schoolSettings.logo} alt="School Logo" className="w-full h-full object-contain p-4" />
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                              <p className="text-[10px] font-bold text-gray-400 uppercase">No Logo Uploaded</p>
                            </div>
                          )}
                        </div>
                        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-kenya-black/0 group-hover:bg-kenya-black/40 transition-all rounded-3xl">
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 px-4">Recommended: Square PNG with transparent background (min 500x500px)</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-kenya-black">Subject Management</h3>
                        <Library className="w-5 h-5 text-kenya-green" />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="settings-la-input"
                            placeholder="New subject..."
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addLearningArea((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button 
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('settings-la-input') as HTMLInputElement;
                              addLearningArea(input.value);
                              input.value = '';
                            }}
                          >
                            Add
                          </Button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                          {learningAreas.map((la) => (
                            <div key={la} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                              <span className="text-sm font-bold text-kenya-black">{la}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => {
                                    const newName = prompt(`Edit ${la}:`, la);
                                    if (newName) editLearningArea(la, newName);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => removeLearningArea(la)}
                                  className="p-1 text-gray-400 hover:text-kenya-red"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <Button onClick={handleUpdateSchool} className="w-full py-4 rounded-xl font-black text-lg shadow-xl shadow-kenya-green/20">
                        Save Configuration
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-kenya-black mb-2">Section Under Construction</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  The {activeTab} section is currently being updated to meet the new Ministry of Education guidelines.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">{editingStaff ? 'Edit Faculty Member' : 'Add Faculty Member'}</h3>
                <button onClick={() => { setShowAddStaffModal(false); setEditingStaff(null); setNewStaff({ name: '', email: '', role: 'Teacher', assignedSubjects: [], assignedClasses: [] }); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Phone Number (For Login)</label>
                  <input 
                    type="tel" 
                    required
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. 0712345678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Designated Role</label>
                  <select 
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    disabled={editingStaff && editingStaff.role?.toLowerCase() === 'teacher'}
                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 ${editingStaff && editingStaff.role?.toLowerCase() === 'teacher' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="Principal">Principal</option>
                    <option value="Deputy Principal">Deputy Principal</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Head of Science">Head of Science</option>
                    <option value="Head of Arts">Head of Arts</option>
                    <option value="Senior Teacher">Senior Teacher</option>
                    <option value="Bursar">Bursar</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {editingStaff && editingStaff.role?.toLowerCase() === 'teacher' && (
                    <p className="text-[10px] text-gray-500 italic ml-1">Teacher roles cannot be changed once assigned.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-kenya-black ml-1">Teaching Assignments</label>
                    <button 
                      type="button"
                      onClick={() => setNewStaff({
                        ...newStaff, 
                        assignments: [...newStaff.assignments, { classId: '', streamId: '', subject: '' }]
                      })}
                      className="text-xs font-bold text-kenya-green hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Assignment
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {newStaff.assignments.map((assignment, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 relative">
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = [...newStaff.assignments];
                            updated.splice(index, 1);
                            setNewStaff({ ...newStaff, assignments: updated });
                          }}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Class</label>
                            <select 
                              value={assignment.classId}
                              onChange={(e) => {
                                const updated = [...newStaff.assignments];
                                updated[index].classId = e.target.value;
                                updated[index].streamId = ''; // Reset stream when class changes
                                setNewStaff({ ...newStaff, assignments: updated });
                              }}
                              className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                            >
                              <option value="">Select Class</option>
                              {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Stream</label>
                            <select 
                              value={assignment.streamId}
                              onChange={(e) => {
                                const updated = [...newStaff.assignments];
                                updated[index].streamId = e.target.value;
                                setNewStaff({ ...newStaff, assignments: updated });
                              }}
                              className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                            >
                              <option value="">All Streams</option>
                              {streams.filter(s => s.classId === assignment.classId).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Subject</label>
                          <select 
                            value={assignment.subject}
                            onChange={(e) => {
                              const updated = [...newStaff.assignments];
                              updated[index].subject = e.target.value;
                              setNewStaff({ ...newStaff, assignments: updated });
                            }}
                            className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                          >
                            <option value="">Select Subject</option>
                            {learningAreas.map(la => (
                              <option key={la} value={la}>{la}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    
                    {newStaff.assignments.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-xs text-gray-400">No assignments added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {editingStaff && editingStaff.mustChangePassword && (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Default Password</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-black text-kenya-black tracking-widest">{editingStaff.password}</code>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingStaff.password);
                          alert('Password copied to clipboard');
                        }}
                        className="text-[10px] font-bold text-kenya-green uppercase hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-yellow-600 italic">This password will expire after the teacher's first successful login.</p>
                  </div>
                )}

                <Button type="submit" className="w-full py-4 rounded-xl font-bold">{editingStaff ? 'Update Member' : 'Register Member'}</Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Generated Staff Credentials Modal */}
        {generatedStaffCreds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">Teacher Added</h3>
                <button onClick={() => setGeneratedStaffCreds(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                <p className="text-gray-600">
                  Successfully added <span className="font-bold text-kenya-black">{generatedStaffCreds.name}</span>. Please share these login credentials with them:
                </p>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
                    <p className="text-lg font-mono text-kenya-black">{generatedStaffCreds.username}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    <p className="text-lg font-mono text-kenya-black">{generatedStaffCreds.password}</p>
                  </div>
                </div>
                <Button onClick={() => setGeneratedStaffCreds(null)} className="w-full py-4 rounded-xl font-bold">Done</Button>
              </div>
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
                <h3 className="text-2xl font-bold text-kenya-black">{editingStudent ? 'Edit Learner' : 'Add Individual Learner'}</h3>
                <button onClick={() => { setShowAddStudentModal(false); setEditingStudent(null); setNewStudent({ name: '', adm: '', class: 'Form 1', streamId: '' }); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                      {newStudent.profile_image ? (
                        <img src={newStudent.profile_image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-kenya-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                      <Upload className="w-6 h-6 text-white" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewStudent({...newStudent, profile_image: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

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
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="text-sm font-bold text-kenya-black ml-1">Gender</label>
                    <select 
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-kenya-black ml-1">Class / Grade</label>
                    <select 
                      value={newStudent.class}
                      onChange={(e) => setNewStudent({...newStudent, class: e.target.value, streamId: ''})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-kenya-black ml-1">Stream</label>
                    <select 
                      value={newStudent.streamId}
                      onChange={(e) => setNewStudent({...newStudent, streamId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    >
                      <option value="">Select Stream</option>
                      {streams.filter(s => {
                        const cls = classes.find(c => c.name === newStudent.class);
                        return cls && s.classId === cls.id;
                      }).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">{editingStudent ? 'Update Learner' : 'Register Learner'}</Button>
              </form>
            </motion.div>
          </div>
        )}
        {/* Add Class Modal */}
        {showAddClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-kenya-black">{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
                <button onClick={() => { setShowAddClassModal(false); setEditingClass(null); setNewClass({ name: '', teacherId: '', capacity: 40, streams: [] }); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClass} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Class Name</label>
                  <input 
                    type="text" 
                    required
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                    placeholder="e.g. Form 1"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-kenya-black ml-1">Streams</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const name = prompt('Enter stream name (e.g. A, B, East, West):');
                        if (name && !newClass.streams.includes(name)) {
                          setNewClass({ ...newClass, streams: [...newClass.streams, name] });
                        }
                      }}
                      className="text-xs font-bold text-kenya-green hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Stream
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newClass.streams.map(stream => (
                      <div key={stream} className="flex items-center gap-2 px-3 py-1.5 bg-kenya-green/10 text-kenya-green rounded-lg border border-kenya-green/20">
                        <span className="text-xs font-bold">{stream}</span>
                        <button 
                          type="button"
                          onClick={() => setNewClass({ ...newClass, streams: newClass.streams.filter(s => s !== stream) })}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {newClass.streams.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No streams defined. This class will have a single default stream.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Class Teacher</label>
                  <select 
                    value={newClass.teacherId}
                    onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  >
                    <option value="">-- Select Teacher --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-kenya-black ml-1">Capacity</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newClass.capacity}
                    onChange={(e) => setNewClass({...newClass, capacity: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                  />
                </div>
                <Button type="submit" className="w-full py-4 rounded-xl font-bold">{editingClass ? 'Update Class' : 'Create Class'}</Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Marks Modal */}
        {showEditMarksModal && selectedMarksStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-kenya-black">Manage Student Marks</h3>
                  <p className="text-sm text-gray-500">{selectedMarksStudent.name} ({selectedMarksStudent.adm}) - {selectedMarksStudent.class}</p>
                </div>
                <button onClick={() => setShowEditMarksModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {exams.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 italic">No examinations found. Create an exam first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exams.map(exam => (
                      <div key={exam.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-kenya-black">{exam.title}</p>
                          <p className="text-xs text-gray-500">{exam.term} {exam.year}</p>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Score (%)</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={editingMarks[exam.id] || ''}
                            onChange={(e) => setEditingMarks({...editingMarks, [exam.id]: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20 font-bold"
                            placeholder="--"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                <Button variant="ghost" onClick={() => setShowEditMarksModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={saveStudentMarks} className="flex-1">Save Changes</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Exam Confirmation Modal */}
      {showEditConfirmation && (
        <div className="fixed inset-0 bg-kenya-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-kenya-black mb-2">Confirm Changes</h3>
            <p className="text-gray-600 mb-8">
              You are about to modify the configuration for <span className="font-bold">{(exams.find(e => e.id === selectedEditExamId))?.title}</span>. 
              This may affect how results are calculated and ranked. Are you sure you want to proceed?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowEditConfirmation(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-kenya-green hover:bg-kenya-green/90" onClick={handleSaveExamEdit}>
                Confirm & Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Preview Modal */}
        {showReportPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl border border-gray-100 max-h-[95vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-kenya-black">Report Card Preview</h3>
                  <p className="text-sm text-gray-500">Review the document before printing or distribution.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={downloadReportPDF} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button variant="ghost" onClick={() => window.print()} className="flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  <button onClick={() => setShowReportPreview(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <div className="bg-white shadow-sm p-8 min-h-[1100px] border border-gray-200 mx-auto max-w-[850px] font-sans text-kenya-black">
                  {/* Header Section */}
                  <div className="border-2 border-kenya-black p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="w-24 h-24 flex items-center justify-center">
                        {schoolSettings.logo ? (
                          <img src={schoolSettings.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[8px] text-gray-400 font-bold text-center">LOGO</div>
                        )}
                      </div>
                      <div className="flex-1 text-center px-4">
                        <h1 className="text-2xl font-black uppercase tracking-tight mb-1">{schoolSettings.name || 'SCHOOL NAME'}</h1>
                        <p className="text-xs font-bold mb-1">P.O BOX {schoolSettings.address || '923-50403'}</p>
                        <p className="text-xs font-bold mb-2">Website: {schoolSettings.website || 'www.school.ac.ke'}</p>
                        <div className="inline-block border-t-2 border-b-2 border-kenya-black px-8 py-1">
                          <h2 className="text-lg font-black uppercase">REPORT FORM</h2>
                        </div>
                      </div>
                      <div className="w-24 h-24 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {students.find(s => s.id === reportConfig.selectedStudentId)?.photo ? (
                          <img src={students.find(s => s.id === reportConfig.selectedStudentId)?.photo} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[8px] text-gray-300 font-bold uppercase text-center p-2">Student Photo</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Details Section */}
                  {(() => {
                    const student = students.find(s => s.id === reportConfig.selectedStudentId);
                    const classStudents = students.filter(s => s.class === student?.class);
                    const allStudents = students;
                    
                    // Calculate overall rank
                    const overallRankings = allStudents.map(s => {
                      const sMarks = marks.filter(m => reportConfig.selectedExamIds.includes(m.examId) && m.studentId === s.id);
                      const total = sMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                      return { id: s.id, total };
                    }).sort((a, b) => b.total - a.total);
                    const overallRank = overallRankings.findIndex(r => r.id === student?.id) + 1;

                    // Calculate class rank
                    const classRankings = classStudents.map(s => {
                      const sMarks = marks.filter(m => reportConfig.selectedExamIds.includes(m.examId) && m.studentId === s.id);
                      const total = sMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                      return { id: s.id, total };
                    }).sort((a, b) => b.total - a.total);
                    const classRank = classRankings.findIndex(r => r.id === student?.id) + 1;

                    return (
                      <div className="border-2 border-kenya-black p-4 mb-4">
                        <div className="grid grid-cols-3 gap-y-2 text-[11px]">
                          <p><span className="font-bold">Adm No :</span> <span className="font-black">{student?.adm}</span></p>
                          <p><span className="font-bold">Full Name :</span> <span className="font-black uppercase">{student?.name}</span></p>
                          <p><span className="font-bold">Kpsea :</span> <span className="font-black"></span></p>
                          
                          <p><span className="font-bold">UPI No :</span> <span className="font-black">A23WERTYST</span></p>
                          <p><span className="font-bold">Grade :</span> <span className="font-black uppercase">{student?.class} A 2026</span></p>
                          <p><span className="font-bold">Term :</span> <span className="font-black">2</span></p>
                          
                          <p><span className="font-bold">House :</span> <span className="font-black"></span></p>
                          <p><span className="font-bold">Rank :</span> <span className="font-black">{classRank} (out of {classStudents.length})</span></p>
                          <p><span className="font-bold">Rank (Overall) :</span> <span className="font-black">{overallRank} (out of {allStudents.length})</span></p>
                          
                          <p><span className="font-bold">Year :</span> <span className="font-black">2026</span></p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Performance Table */}
                  <div className="mb-4">
                    <table className="w-full border-2 border-kenya-black border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-kenya-black p-2 text-left font-black uppercase">LEARNING AREA</th>
                          <th className="border border-kenya-black p-1 text-center font-black uppercase w-24">
                            <div className="text-[8px]">Exam 1 opener</div>
                            <div className="text-[7px] font-normal">out of 100</div>
                            <div className="flex justify-between px-2 mt-1 border-t border-kenya-black pt-1">
                              <span>Score</span>
                              <span className="border-l border-kenya-black pl-2">Grade</span>
                            </div>
                          </th>
                          <th className="border border-kenya-black p-2 text-center font-black uppercase">Score</th>
                          <th className="border border-kenya-black p-2 text-center font-black uppercase">Grade</th>
                          <th className="border border-kenya-black p-2 text-center font-black uppercase">%</th>
                          <th className="border border-kenya-black p-2 text-center font-black uppercase">Grd</th>
                          <th className="border border-kenya-black p-2 text-center font-black uppercase w-16">
                            <div className="text-[8px] leading-tight">Learning Area Rank</div>
                          </th>
                          <th className="border border-kenya-black p-2 text-left font-black uppercase min-w-[150px]">Remarks</th>
                          <th className="border border-kenya-black p-2 text-left font-black uppercase">Teacher</th>
                        </tr>
                      </thead>
                      <tbody>
                        {learningAreas.map(subject => {
                          const student = students.find(s => s.id === reportConfig.selectedStudentId);
                          const subjectTeacher = staff.find(t => 
                            t.assignedSubjects?.includes(subject) && 
                            t.assignedClasses?.includes(student?.class)
                          );

                          const examId = reportConfig.selectedExamIds[0];
                          const mark = marks.find(m => m.studentId === reportConfig.selectedStudentId && m.examId === examId && m.subject === subject);
                          const score = mark ? parseFloat(mark.score) : null;
                          const gradeObj = gradingSystem.find(g => score !== null && score >= g.min && score <= g.max);
                          const grade = gradeObj ? gradeObj.grade : '--';

                          // Calculate subject rank
                          const classStudents = students.filter(s => s.class === student?.class);
                          const subjectRankings = classStudents.map(s => {
                            const sMark = marks.find(m => m.studentId === s.id && m.examId === examId && m.subject === subject);
                            return { id: s.id, score: sMark ? parseFloat(sMark.score) : 0 };
                          }).sort((a, b) => b.score - a.score);
                          const subjectRank = subjectRankings.findIndex(r => r.id === student?.id) + 1;

                          return (
                            <tr key={subject} className="h-8">
                              <td className="border border-kenya-black p-2 font-bold uppercase">{subject}</td>
                              <td className="border border-kenya-black p-0 text-center">
                                <div className="flex h-full">
                                  <div className="flex-1 flex items-center justify-center border-r border-kenya-black">{score !== null ? score : ''}</div>
                                  <div className="flex-1 flex items-center justify-center">{grade !== '--' ? grade : ''}</div>
                                </div>
                              </td>
                              <td className="border border-kenya-black p-2 text-center"></td>
                              <td className="border border-kenya-black p-2 text-center"></td>
                              <td className="border border-kenya-black p-2 text-center font-bold">{score !== null ? score + '%' : ''}</td>
                              <td className="border border-kenya-black p-2 text-center font-bold">{grade !== '--' ? grade : ''}</td>
                              <td className="border border-kenya-black p-2 text-center font-bold">{score !== null ? `${subjectRank}/${classStudents.length}` : ''}</td>
                              <td className="border border-kenya-black p-2 italic text-[9px]">
                                {score !== null ? (score >= 50 ? 'Meeting Expectations' : 'Approaching Expectations') : ''}
                              </td>
                              <td className="border border-kenya-black p-2 text-[9px] leading-tight">
                                <div className="font-bold">Teacher</div>
                                <div className="uppercase italic">{subjectTeacher?.name.split(' ')[0] || 'N/A'}</div>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Summary Row */}
                        {(() => {
                          const student = students.find(s => s.id === reportConfig.selectedStudentId);
                          const examId = reportConfig.selectedExamIds[0];
                          const studentMarks = marks.filter(m => m.studentId === student?.id && m.examId === examId);
                          const total = studentMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                          const avg = studentMarks.length > 0 ? total / studentMarks.length : 0;
                          const gradeObj = gradingSystem.find(g => avg >= g.min && avg <= g.max);
                          
                          return (
                            <tr className="bg-gray-50 font-black text-[11px]">
                              <td colSpan={9} className="border border-kenya-black p-3">
                                <div className="flex justify-between items-center">
                                  <p>Total Marks : <span className="text-lg">{total.toFixed(0)}</span> (out of {learningAreas.length * 100})</p>
                                  <p>Average Marks : <span className="text-lg">{avg.toFixed(0)} {gradeObj?.grade}</span></p>
                                  <p>Value Added : <span className="text-lg">--</span></p>
                                  <p>V.A from Kpsea : <span className="text-lg">--</span></p>
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Progressive Summary & Chart Section */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border-2 border-kenya-black p-4 flex flex-col items-center justify-center relative min-h-[200px]">
                      <div className="absolute left-2 top-1/2 -rotate-90 origin-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Performance Level</div>
                      <div className="w-full h-full border border-gray-100 flex items-center justify-center text-[10px] text-gray-300 italic">
                        Chart Visualization Placeholder
                      </div>
                      <div className="absolute bottom-2 left-2 text-[8px] font-bold text-gray-400">KPSEA T1 - GRADE 9</div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase text-center border-b-2 border-kenya-black pb-1">PROGRESSIVE SUMMARY</h3>
                      <table className="w-full border-2 border-kenya-black border-collapse text-[9px]">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-kenya-black p-1"></th>
                            <th colSpan={3} className="border border-kenya-black p-1 uppercase">GRADE 7</th>
                            <th colSpan={3} className="border border-kenya-black p-1 uppercase">GRADE 8</th>
                            <th colSpan={3} className="border border-kenya-black p-1 uppercase">GRADE 9</th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border border-kenya-black p-1"></th>
                            <th className="border border-kenya-black p-1">T 1</th>
                            <th className="border border-kenya-black p-1">T 2</th>
                            <th className="border border-kenya-black p-1">T 3</th>
                            <th className="border border-kenya-black p-1">T 1</th>
                            <th className="border border-kenya-black p-1">T 2</th>
                            <th className="border border-kenya-black p-1">T 3</th>
                            <th className="border border-kenya-black p-1">T 1</th>
                            <th className="border border-kenya-black p-1">T 2</th>
                            <th className="border border-kenya-black p-1">T 3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const student = students.find(s => s.id === reportConfig.selectedStudentId);
                            const examId = reportConfig.selectedExamIds[0];
                            const studentMarks = marks.filter(m => m.studentId === student?.id && m.examId === examId);
                            const total = studentMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                            const avg = studentMarks.length > 0 ? total / studentMarks.length : 0;
                            const gradeObj = gradingSystem.find(g => avg >= g.min && avg <= g.max);
                            
                            const classStudents = students.filter(s => s.class === student?.class);
                            const rankings = classStudents.map(s => {
                              const sMarks = marks.filter(m => m.examId === examId && m.studentId === s.id);
                              const t = sMarks.reduce((sum, m) => sum + parseFloat(m.score as string), 0);
                              return { id: s.id, total: t };
                            }).sort((a, b) => b.total - a.total);
                            const position = rankings.findIndex(r => r.id === student?.id) + 1;

                            return (
                              <>
                                <tr className="h-6">
                                  <td className="border border-kenya-black p-1 font-bold">Marks</td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1 font-black text-center">{total.toFixed(0)}</td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                </tr>
                                <tr className="h-6">
                                  <td className="border border-kenya-black p-1 font-bold">Mean score</td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1 font-black text-center">{avg.toFixed(0)}</td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                </tr>
                                <tr className="h-6">
                                  <td className="border border-kenya-black p-1 font-bold">Performance Level</td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1 font-black text-center">{gradeObj?.grade}</td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                </tr>
                                <tr className="h-6">
                                  <td className="border border-kenya-black p-1 font-bold">Points</td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1 font-black text-center">{total.toFixed(0)}</td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                </tr>
                                <tr className="h-6">
                                  <td className="border border-kenya-black p-1 font-bold">Position</td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                  <td className="border border-kenya-black p-1 font-black text-center">{position}</td><td className="border border-kenya-black p-1"></td><td className="border border-kenya-black p-1"></td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Remarks Section */}
                  <div className="border-2 border-kenya-black p-4 mb-4 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase mb-1">GRADE TEACHER:</p>
                        <div className="h-8 border-b border-gray-200"></div>
                        <p className="text-[10px] font-black uppercase mt-2 mb-1">COMMENTS:</p>
                        <div className="h-8 border-b border-gray-200"></div>
                      </div>
                      <div className="w-40 border border-gray-200 rounded p-1 flex flex-col items-center justify-end">
                        <div className="w-full border-t border-gray-200 text-[8px] text-center pt-1 font-bold uppercase">Signature</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase mb-1">PRINCIPAL:</p>
                        <div className="h-8 border-b border-gray-200"></div>
                        <p className="text-[10px] font-black uppercase mt-2 mb-1">COMMENTS:</p>
                        <div className="h-8 border-b border-gray-200"></div>
                      </div>
                      <div className="w-40 border border-gray-200 rounded p-1 flex flex-col items-center justify-end">
                        <div className="w-full border-t border-gray-200 text-[8px] text-center pt-1 font-bold uppercase">Signature</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="space-y-2 text-[10px]">
                    <p className="font-bold">Parent's Signature: _________________________________________________________________________________</p>
                    <div className="flex justify-between items-end pt-2">
                      <div>
                        <p className="font-bold">Next Term Begins On: <span className="font-black">Monday, 04 May 2026</span></p>
                      </div>
                      <div className="text-right">
                        <p className="font-black">Print Date {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="pt-4 text-center border-t border-gray-100">
                      <p className="font-black italic uppercase tracking-widest">{schoolSettings.motto || 'STRIVE FOR EXCELLENCE'}</p>
                      <p className="text-[8px] font-bold text-gray-400 mt-1">Not valid if without an official school rubber stamp</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Manage Class Students Modal */}
        {managingClass && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-kenya-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-kenya-black">Manage Students: {managingClass.name}</h3>
                  <p className="text-gray-500">Add or remove students from this class.</p>
                </div>
                <button onClick={() => setManagingClass(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                {/* Add Student to this Class */}
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-kenya-black flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-kenya-green" />
                      Add Student to {managingClass.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="class-bulk-student-upload" 
                        className="hidden" 
                        accept=".xlsx, .xls, .csv"
                        onChange={(e) => handleClassBulkStudentUpload(e, managingClass.name)}
                      />
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => downloadStudentTemplate(managingClass.name)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Template
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => document.getElementById('class-bulk-student-upload')?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Bulk Import to {managingClass.name}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search student by name or admission number to add..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kenya-green/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const query = (e.target as HTMLInputElement).value;
                            const found = students.find(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.adm.includes(query));
                            if (found) {
                              setStudents(students.map(s => s.id === found.id ? { ...s, class: managingClass.name } : s));
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    </div>
                    <Button onClick={() => { setManagingClass(null); setActiveTab('students'); setShowAddStudentModal(true); }}>
                      Register New Student
                    </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 ml-1 italic">Type name/adm and press Enter to quickly move a student to this class.</p>
                </div>

                {/* Current Students in this Class */}
                <div className="space-y-4">
                  <h4 className="font-bold text-kenya-black flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Enrolled Students ({students.filter(s => s.class === managingClass.name).length})
                  </h4>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Admission No</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {students.filter(s => s.class === managingClass.name).map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-kenya-black">{student.name}</td>
                            <td className="px-6 py-4 font-mono text-sm text-gray-500">{student.adm}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => {
                                  if (window.confirm(`Remove ${student.name} from ${managingClass.name}?`)) {
                                    setStudents(students.map(s => s.id === student.id ? { ...s, class: 'Unassigned' } : s));
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                                title="Remove from Class"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {students.filter(s => s.class === managingClass.name).length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">
                              No students currently enrolled in this class.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Subject Champions Modal */}
        {viewingSubjectChampions && (
          <div className="fixed inset-0 bg-kenya-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-xl font-black text-kenya-black uppercase tracking-widest">{viewingSubjectChampions} Champions</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase">Top Performers in {viewingSubjectChampions}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => downloadSubjectChampionsPDF(viewingSubjectChampions)}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <button 
                    onClick={() => setViewingSubjectChampions(null)}
                    className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-kenya-red"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[400px]">
                  <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {marks
                      .filter(m => 
                        m.examId === selectedProcessingExamId && 
                        m.subject === viewingSubjectChampions &&
                        (selectedProcessingClass === 'All' || students.find(s => s.id === m.studentId)?.class === selectedProcessingClass)
                      )
                      .sort((a, b) => parseFloat(b.total || b.score) - parseFloat(a.total || a.score))
                      .map((m, idx) => {
                        const student = students.find(s => s.id === m.studentId);
                        return (
                          <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                idx === 1 ? 'bg-gray-100 text-gray-600' :
                                idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-bold text-kenya-black">{student?.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{student?.adm}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">{student?.class}</td>
                            <td className="px-4 py-4 text-right">
                              <span className="font-black text-kenya-green">{m.total || m.score}%</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </main>
    </div>
  );
};

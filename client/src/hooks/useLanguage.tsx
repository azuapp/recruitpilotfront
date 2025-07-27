import { createContext, ReactNode, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  isRTL: boolean;
};

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    candidates: "Candidates",
    applicationForm: "Application Form",
    interviews: "Interviews",
    emailHistory: "Email History",
    assessments: "Assessments",
    users: "Users",
    
    // Common actions
    export: "Export",
    filter: "Filter",
    search: "Search",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    send: "Send",
    schedule: "Schedule",
    sendEmail: "Send Email",
    scheduleInterview: "Schedule Interview",
    
    // Dashboard
    totalCandidates: "Total Candidates",
    activePositions: "Active Positions",
    interviewsScheduled: "Interviews Scheduled",
    emailsSent: "Emails Sent",
    recentCandidates: "Recent Candidates",
    recentInterviews: "Recent Interviews",
    overviewDescription: "Overview of your recruitment activities",
    newPosition: "New Position",
    growing: "Growing",
    acrossDepartments: "Across departments",
    thisWeek: "This week",
    aiAssessments: "AI Assessments",
    quickActions: "Quick Actions",
    runAiAssessment: "Run AI Assessment",
    sendBulkEmails: "Send Bulk Emails",
    viewCandidates: "View Candidates",
    recentActivity: "Recent Activity",
    newApplicationsReceived: "New applications received",
    checkCandidatesPageDetails: "Check candidates page for details",
    aiAssessmentsCompleted: "AI assessments completed",
    reviewScoresInsights: "Review scores and insights",
    interviewsScheduledActivity: "Interviews scheduled",
    manageYourCalendar: "Manage your calendar",
    manageReviewApplications: "Manage and review job applications",
    trackEmailCommunications: "Track all email communications",
    aiAssessmentsPage: "AI Assessments",
    aiPoweredResumeAnalysis: "AI-powered resume analysis and candidate scoring",
    totalAssessments: "Total Assessments",
    averageScore: "Average Score",
    processing: "Processing",
    assessmentResults: "Assessment Results",
    
    // Candidates
    exportCandidates: "Export Candidates",
    filterByPosition: "Filter by Position",
    filterByStatus: "Filter by Status",
    candidateName: "Candidate Name",
    position: "Position",
    status: "Status",
    appliedAt: "Applied At",
    score: "Score",
    actions: "Actions",
    
    // Interviews
    interviewDate: "Interview Date",
    interviewType: "Interview Type",
    interviewStatus: "Interview Status",
    notes: "Notes",
    
    // Email
    emailSubject: "Email Subject",
    emailContent: "Email Content",
    emailType: "Email Type",
    emailStatus: "Email Status",
    sentAt: "Sent At",
    
    // Status values
    new: "New",
    reviewed: "Reviewed",
    interview: "Interview",
    hired: "Hired",
    rejected: "Rejected",
    completed: "Completed",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
    sent: "Sent",
    delivered: "Delivered",
    pending: "Pending",
    failed: "Failed",
    scheduled: "Scheduled",
    
    // Form labels
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    phoneNumber: "Phone Number",
    address: "Address",
    
    // Branding
    recruitPro: "RecruitPro",
    aiRecruitment: "AI Recruitment",
    hrManager: "HR Manager",
    
    // Common
    loading: "Loading...",
    noDataFound: "No data found",
    error: "Error",
    success: "Success",
    welcome: "Welcome",
    logout: "Logout",
    login: "Login",
  },
  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    candidates: "المرشحين",
    applicationForm: "نموذج التقديم",
    interviews: "المقابلات",
    emailHistory: "سجل البريد الإلكتروني",
    assessments: "التقييمات",
    users: "المستخدمين",
    
    // Common actions
    export: "تصدير",
    filter: "تصفية",
    search: "بحث",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    send: "إرسال",
    schedule: "جدولة",
    sendEmail: "إرسال بريد إلكتروني",
    scheduleInterview: "جدولة مقابلة",
    
    // Dashboard
    totalCandidates: "إجمالي المرشحين",
    activePositions: "المناصب النشطة",
    interviewsScheduled: "المقابلات المجدولة",
    emailsSent: "الإيميلات المرسلة",
    recentCandidates: "المرشحين الحديثين",
    recentInterviews: "المقابلات الحديثة",
    overviewDescription: "نظرة عامة على أنشطة التوظيف الخاصة بك",
    newPosition: "منصب جديد",
    growing: "نمو",
    acrossDepartments: "عبر الأقسام",
    thisWeek: "هذا الأسبوع",
    aiAssessments: "تقييمات الذكاء الاصطناعي",
    quickActions: "الإجراءات السريعة",
    runAiAssessment: "تشغيل تقييم الذكاء الاصطناعي",
    sendBulkEmails: "إرسال رسائل جماعية",
    viewCandidates: "عرض المرشحين",
    recentActivity: "النشاط الحديث",
    newApplicationsReceived: "تم استلام طلبات جديدة",
    checkCandidatesPageDetails: "تحقق من صفحة المرشحين للتفاصيل",
    aiAssessmentsCompleted: "تم إكمال تقييمات الذكاء الاصطناعي",
    reviewScoresInsights: "مراجعة النتائج والرؤى",
    interviewsScheduledActivity: "تم جدولة المقابلات",
    manageYourCalendar: "إدارة التقويم الخاص بك",
    manageReviewApplications: "إدارة ومراجعة طلبات الوظائف",
    trackEmailCommunications: "تتبع جميع الاتصالات عبر البريد الإلكتروني",
    aiAssessmentsPage: "تقييمات الذكاء الاصطناعي",
    aiPoweredResumeAnalysis: "تحليل السير الذاتية بالذكاء الاصطناعي وتقييم المرشحين",
    totalAssessments: "إجمالي التقييمات",
    averageScore: "متوسط النتيجة",
    processing: "قيد المعالجة",
    assessmentResults: "نتائج التقييم",
    
    // Candidates
    exportCandidates: "تصدير المرشحين",
    filterByPosition: "تصفية حسب المنصب",
    filterByStatus: "تصفية حسب الحالة",
    candidateName: "اسم المرشح",
    position: "المنصب",
    status: "الحالة",
    appliedAt: "تاريخ التقديم",
    score: "النتيجة",
    actions: "الإجراءات",
    
    // Interviews
    interviewDate: "تاريخ المقابلة",
    interviewType: "نوع المقابلة",
    interviewStatus: "حالة المقابلة",
    notes: "الملاحظات",
    
    // Email
    emailSubject: "موضوع البريد الإلكتروني",
    emailContent: "محتوى البريد الإلكتروني",
    emailType: "نوع البريد الإلكتروني",
    emailStatus: "حالة البريد الإلكتروني",
    sentAt: "تاريخ الإرسال",
    
    // Status values
    new: "جديد",
    reviewed: "تمت المراجعة",
    interview: "مقابلة",
    hired: "تم التوظيف",
    rejected: "مرفوض",
    completed: "مكتمل",
    cancelled: "ملغي",
    rescheduled: "أعيدت جدولته",
    sent: "تم الإرسال",
    delivered: "تم التسليم",
    pending: "قيد الانتظار",
    failed: "فشل",
    scheduled: "مجدولة",
    
    // Form labels
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    phoneNumber: "رقم الهاتف",
    address: "العنوان",
    
    // Branding
    recruitPro: "ريكروت برو",
    aiRecruitment: "التوظيف بالذكاء الاصطناعي",
    hrManager: "مدير الموارد البشرية",
    
    // Common
    loading: "جاري التحميل...",
    noDataFound: "لا توجد بيانات",
    error: "خطأ",
    success: "نجح",
    welcome: "مرحباً",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
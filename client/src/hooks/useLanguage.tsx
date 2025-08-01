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
    evaluations: "Evaluations",
    users: "Users",
    
    // Users page
    userManagement: "User Management",
    manageAdminUsers: "Manage admin users and permissions",
    addUser: "Add User",
    searchUsers: "Search users...",
    adminUsers: "Admin Users",
    user: "User",
    role: "Role",
    lastLogin: "Last Login",
    created: "Created",
    jobDescriptions: "Job Descriptions",
    
    // Job Descriptions page
    manageJobRequirements: "Manage job requirements for AI-powered candidate scoring",
    addJobDescription: "Add Job Description",
    addNewJobDescription: "Add New Job Description",
    editJobDescription: "Edit Job Description",
    positionTitle: "Position Title",
    positionPlaceholder: "e.g., Frontend Developer, Data Scientist",
    keyResponsibilities: "Key Responsibilities",
    responsibilitiesPlaceholder: "Describe the main responsibilities and duties for this role...",
    requiredExperience: "Required Experience",
    experiencePlaceholder: "Specify years of experience, industry background, specific technologies...",
    requiredSkills: "Required Skills",
    skillsPlaceholder: "List technical skills, soft skills, certifications, tools...",
    additionalNotes: "Additional Notes",
    notesPlaceholder: "Company culture, benefits, remote work policy, etc.",
    noJobDescriptions: "No Job Descriptions",
    createJobDescriptionsMessage: "Create job descriptions to enable AI-powered candidate scoring and matching.",
    addFirstJobDescription: "Add Your First Job Description",
    active: "Active",
    inactive: "Inactive",
    
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

    // Evaluations page
    evaluationControls: "Evaluation Controls",
    selectPositionEvaluate: "Select a position and run AI evaluation to rank candidates by job fit",
    selectPosition: "Select position",
    allPositions: "All Positions", 
    runEvaluation: "Run Evaluation",
    evaluating: "Evaluating...",
    noEvaluationsAvailable: "No Evaluations Available",
    runEvaluationMessage: "Run an evaluation to see candidate rankings and job fit analysis",
    startEvaluation: "Start Evaluation",
    candidateEvaluations: "Candidate Evaluations",
    aiPoweredEvaluationDescription: "AI-powered candidate evaluation and ranking based on job fit analysis",
    totalEvaluated: "Total Evaluated",
    topCandidates: "Top Candidates",
    avgFitScore: "Avg Fit Score",
    evaluationResults: "Evaluation Results",
    fitScore: "Fit Score",
    experienceMatch: "Experience Match",
    educationMatch: "Education Match", 
    skillsMatch: "Skills Match",
    matchingSkills: "Matching Skills",
    missingSkills: "Missing Skills",
    aiRecommendation: "AI Recommendation",
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

    // Assessment page specific
    runBulkAssessment: "Run Bulk Assessment",
    bulkAssessmentCompleted: "Bulk Assessment Completed",
    assessmentFailed: "Assessment Failed",
    noCandidatesAvailable: "No candidates available for assessment",
    failedToRunBulkAssessment: "Failed to run bulk assessment",
    aiPoweredCandidateAssessments: "AI-powered candidate assessments and insights",
    highScores: "High Scores",
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    noAssessmentsFound: "No assessments found",
    assessmentsWillAppear: "Assessments will appear here once candidates are processed by our AI system.",
    overallScore: "Overall Score",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
    aiInsights: "AI Insights",
    assessmentDeleted: "Assessment Deleted",
    assessmentDeletedSuccessfully: "Assessment deleted successfully",
    deleteAssessmentConfirm: "Are you sure you want to delete this assessment?",
    unknownCandidate: "Unknown Candidate",
    loadingAssessments: "Loading assessments...",

    // Evaluation page specific  
    topRanked: "Top Ranked",
    strongMatch: "Strong Match",
    good: "Good",
    fair: "Fair",
    weak: "Weak",
    averageFitScore: "Average Fit Score",
    recommendation: "Recommendation",
    ranking: "Ranking",
    evaluatedAt: "Evaluated At",
    skillAnalysis: "Skill Analysis",
    missing: "Missing",
    matching: "Matching",
    evaluationCompleted: "Evaluation Completed",
    candidatesEvaluated: "candidates evaluated for",
    evaluationFailed: "Evaluation Failed",
    failedToRunEvaluation: "Failed to run evaluation",
    loadingEvaluations: "Loading evaluations...",
    noEvaluationsFound: "No evaluations found",
    evaluationsWillAppear: "Evaluations will appear here once you run position-specific analysis.",
    technicalSkills: "Technical Skills",
    communicationSkills: "Communication Skills",
    culturalFit: "Cultural Fit",
    
    // Candidates
    exportCandidates: "Export Candidates",
    filterByPosition: "Filter by Position",
    filterByStatus: "Filter by Status",
    dateRange: "Date Range",
    candidateName: "Candidate Name",
    position: "Position",
    status: "Status",
    appliedAt: "Applied At",
    score: "Score",
    actions: "Actions",
    
    // Interviews
    scheduleManageInterviews: "Schedule and manage candidate interviews",
    allInterviews: "All Interviews",
    interviewDate: "Interview Date",
    interviewType: "Interview Type",
    interviewStatus: "Interview Status",
    notes: "Notes",
    
    // Email
    emailSubject: "Email Subject",
    emailContent: "Email Content",
    emailType: "Email Type",
    emailStatus: "Email Status",
    
    // Candidate details dialog
    personalInformation: "Personal Information",
    applicationDetails: "Application Details",
    assessmentResults: "Assessment Results",
    sentAt: "Sent At",
    
    // Status values
    new: "New",
    reviewed: "Reviewed",
    interview: "Interview",
    hired: "Hired",
    rejected: "Rejected",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
    sent: "Sent",
    delivered: "Delivered",
    scheduled: "Scheduled",
    
    // Assessment actions
    positionAssessmentCompleted: "Position Assessment Completed",
    failedToRunPositionAssessment: "Failed to run position assessment",
    candidateAssessmentCompleted: "Candidate Assessment Completed", 
    failedToRunCandidateAssessment: "Failed to run candidate assessment",
    pleaseSelectPosition: "Please select a position to assess",
    selectCandidate: "Select Candidate",
    pleaseSelectCandidate: "Please select a candidate to assess",
    assessByPosition: "Assess by Position",
    assessCandidate: "Assess Candidate",
    
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
    
    // Delete functionality
    deleteEvaluation: "Delete Evaluation",
    confirmDelete: "Are you sure you want to delete this evaluation?",
    deleteCandidate: "Delete Candidate",
    confirmDeleteCandidate: "Are you sure you want to delete this candidate? This action cannot be undone.",
    deleteEmail: "Delete Email",
    confirmDeleteEmail: "Are you sure you want to delete this email? This action cannot be undone.",
    deleteInterview: "Delete Interview",
    confirmDeleteInterview: "Are you sure you want to delete this interview? This action cannot be undone.",
    deleteAssessment: "Delete Assessment",
    confirmDeleteAssessment: "Are you sure you want to delete this assessment? This action cannot be undone.",
  },
  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    candidates: "المرشحين",
    applicationForm: "نموذج التقديم",
    interviews: "المقابلات",
    emailHistory: "سجل البريد الإلكتروني",
    assessments: "التقييمات الأساسية",
    evaluations: "تقييمات المطابقة",
    users: "المستخدمين",
    
    // Users page
    userManagement: "إدارة المستخدمين",
    manageAdminUsers: "إدارة المستخدمين الإداريين والصلاحيات",
    addUser: "إضافة مستخدم",
    searchUsers: "البحث عن المستخدمين...",
    adminUsers: "المستخدمين الإداريين",
    user: "المستخدم",
    role: "الدور",
    lastLogin: "آخر تسجيل دخول",
    created: "تاريخ الإنشاء",
    jobDescriptions: "الوصف الوظيفي",
    
    // Job Descriptions page
    manageJobRequirements: "إدارة متطلبات الوظائف للتقييم الذكي للمرشحين",
    addJobDescription: "إضافة وصف وظيفي",
    addNewJobDescription: "إضافة وصف وظيفي جديد",
    editJobDescription: "تعديل الوصف الوظيفي",
    positionTitle: "المسمى الوظيفي",
    positionPlaceholder: "مثال: مطور واجهة أمامية، عالم بيانات",
    keyResponsibilities: "المسؤوليات الرئيسية",
    responsibilitiesPlaceholder: "اوصف المسؤوليات والواجبات الرئيسية لهذا الدور...",
    requiredExperience: "الخبرة المطلوبة",
    experiencePlaceholder: "حدد سنوات الخبرة، الخلفية الصناعية، التقنيات المحددة...",
    requiredSkills: "المهارات المطلوبة",
    skillsPlaceholder: "اذكر المهارات التقنية، المهارات الناعمة، الشهادات، الأدوات...",
    additionalNotes: "ملاحظات إضافية",
    notesPlaceholder: "ثقافة الشركة، المزايا، سياسة العمل عن بعد، إلخ.",
    noJobDescriptions: "لا توجد أوصاف وظيفية",
    createJobDescriptionsMessage: "أنشئ أوصاف وظيفية لتمكين التقييم الذكي ومطابقة المرشحين.",
    addFirstJobDescription: "أضف أول وصف وظيفي",
    active: "نشط",
    inactive: "غير نشط",
    
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

    // Assessment page specific
    runBulkAssessment: "تشغيل التقييم الجماعي",
    bulkAssessmentCompleted: "اكتمل التقييم الجماعي",
    assessmentFailed: "فشل التقييم",
    noCandidatesAvailable: "لا يوجد مرشحون متاحون للتقييم",
    failedToRunBulkAssessment: "فشل في تشغيل التقييم الجماعي",
    aiPoweredCandidateAssessments: "تقييمات المرشحين المدعومة بالذكاء الاصطناعي والرؤى",
    highScores: "النتائج العالية",
    noAssessmentsFound: "لم يتم العثور على تقييمات",
    assessmentsWillAppear: "ستظهر التقييمات هنا بمجرد معالجة المرشحين بواسطة نظام الذكاء الاصطناعي.",
    overallScore: "النتيجة الإجمالية",
    skills: "المهارات",
    experience: "الخبرة",
    education: "التعليم",
    assessmentDeleted: "تم حذف التقييم",
    assessmentDeletedSuccessfully: "تم حذف التقييم بنجاح",
    deleteAssessmentConfirm: "هل أنت متأكد من أنك تريد حذف هذا التقييم؟",
    unknownCandidate: "مرشح غير معروف",
    loadingAssessments: "جارٍ تحميل التقييمات...",

    // Evaluation page specific  
    topRanked: "الترتيب الأعلى",
    strongMatch: "مطابقة قوية",
    good: "جيد",
    fair: "مقبول",
    weak: "ضعيف",
    averageFitScore: "متوسط نتيجة المطابقة",
    recommendation: "التوصية",
    ranking: "الترتيب",
    evaluatedAt: "تم التقييم في",
    skillAnalysis: "تحليل المهارات",
    missing: "مفقود",
    matching: "مطابق",
    evaluationCompleted: "اكتمل التقييم",
    candidatesEvaluated: "مرشح تم تقييمهم لـ",
    evaluationFailed: "فشل التقييم",
    failedToRunEvaluation: "فشل في تشغيل التقييم",
    loadingEvaluations: "جارٍ تحميل التقييمات...",
    noEvaluationsFound: "لم يتم العثور على تقييمات",
    evaluationsWillAppear: "ستظهر التقييمات هنا بمجرد تشغيل التحليل الخاص بالمنصب.",
    technicalSkills: "المهارات التقنية",
    communicationSkills: "مهارات التواصل",
    culturalFit: "التناسب الثقافي",
    
    // Candidates
    exportCandidates: "تصدير المرشحين",
    filterByPosition: "تصفية حسب المنصب",
    filterByStatus: "تصفية حسب الحالة",
    dateRange: "النطاق الزمني",
    candidateName: "اسم المرشح",
    position: "المنصب",
    status: "الحالة",
    appliedAt: "تاريخ التقديم",
    score: "النتيجة",
    actions: "الإجراءات",
    
    // Interviews
    scheduleManageInterviews: "جدولة وإدارة مقابلات المرشحين",
    allInterviews: "جميع المقابلات",
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
    
    // Candidate details dialog
    personalInformation: "المعلومات الشخصية",
    applicationDetails: "تفاصيل التطبيق",
    assessmentResults: "نتائج التقييم",
    aiInsights: "رؤى الذكاء الاصطناعي",
    
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
    
    // Assessment actions
    positionAssessmentCompleted: "تم إكمال تقييم المنصب",
    failedToRunPositionAssessment: "فشل في تشغيل تقييم المنصب",
    candidateAssessmentCompleted: "تم إكمال تقييم المرشح", 
    failedToRunCandidateAssessment: "فشل في تشغيل تقييم المرشح",
    pleaseSelectPosition: "يرجى اختيار منصب للتقييم",
    selectCandidate: "اختيار مرشح",
    pleaseSelectCandidate: "يرجى اختيار مرشح للتقييم",
    assessByPosition: "تقييم حسب المنصب",
    assessCandidate: "تقييم المرشح",
    
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
    
    // Evaluations page
    evaluationControls: "عناصر التحكم في التقييم",
    selectPositionEvaluate: "اختر منصباً وشغل التقييم بالذكاء الاصطناعي لترتيب المرشحين حسب توافق الوظيفة",
    selectPosition: "اختر منصب",
    allPositions: "جميع المناصب",
    runEvaluation: "تشغيل التقييم",
    evaluating: "جاري التقييم...",
    noEvaluationsAvailable: "لا توجد تقييمات متاحة",
    runEvaluationMessage: "شغل تقييماً لرؤية ترتيب المرشحين وتحليل توافق الوظيفة",
    startEvaluation: "بدء التقييم",
    candidateEvaluations: "تقييمات المرشحين",
    aiPoweredEvaluationDescription: "تقييم وترتيب المرشحين بالذكاء الاصطناعي بناءً على تحليل توافق الوظيفة",
    totalEvaluated: "إجمالي المقيمين",
    topCandidates: "المرشحين المتميزين",
    avgFitScore: "متوسط نقاط التوافق",
    evaluationResults: "نتائج التقييم",
    fitScore: "نقاط التوافق",
    experienceMatch: "توافق الخبرة",
    educationMatch: "توافق التعليم",
    skillsMatch: "توافق المهارات",
    matchingSkills: "المهارات المطابقة",
    missingSkills: "المهارات المفقودة",
    aiRecommendation: "توصية الذكاء الاصطناعي",

    // Common
    loading: "جاري التحميل...",
    noDataFound: "لا توجد بيانات",
    error: "خطأ",
    success: "نجح",
    welcome: "مرحباً",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    
    // Delete functionality
    deleteEvaluation: "حذف التقييم",
    confirmDelete: "هل أنت متأكد من حذف هذا التقييم؟",
    deleteCandidate: "حذف المرشح",
    confirmDeleteCandidate: "هل أنت متأكد من حذف هذا المرشح؟ هذا الإجراء لا يمكن التراجع عنه.",
    deleteEmail: "حذف الإيميل",
    confirmDeleteEmail: "هل أنت متأكد من حذف هذا الإيميل؟ هذا الإجراء لا يمكن التراجع عنه.",
    deleteInterview: "حذف المقابلة",
    confirmDeleteInterview: "هل أنت متأكد من حذف هذا المقابلة؟ هذا الإجراء لا يمكن التراجع عنه.",
    deleteAssessment: "حذف التقييم",
    confirmDeleteAssessment: "هل أنت متأكد من حذف هذا التقييم؟ هذا الإجراء لا يمكن التراجع عنه.",
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
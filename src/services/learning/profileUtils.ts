import {
  AcademicBoardRecord,
  SemesterResultRecord,
  StudentGoal,
  StudentGoalStatus,
  UserProfile,
} from '../../types';

export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_AVATAR_RAW_BYTES = 2 * 1024 * 1024; // 2 MB raw file upload limit
export const MAX_AVATAR_DATA_URL_LENGTH = 320_000; // ~240 KB binary after base64 encoding

export interface ProfileCompletionSection {
  id: string;
  label: string;
  completed: number;
  total: number;
}

export interface ProfileCompletionSummary {
  percentage: number;
  completedCount: number;
  totalCount: number;
  sections: ProfileCompletionSection[];
  missingPrompts: string[];
}

/**
 * Calculate percentage strictly from valid marksObtained and maximumMarks.
 * Never fabricates values or converts SGPA/CGPA.
 */
export function calculateBoardPercentage(
  marksObtained?: number,
  maximumMarks?: number
): number | undefined {
  if (
    typeof marksObtained !== 'number' ||
    typeof maximumMarks !== 'number' ||
    !Number.isFinite(marksObtained) ||
    !Number.isFinite(maximumMarks)
  ) {
    return undefined;
  }
  if (maximumMarks <= 0 || marksObtained < 0 || marksObtained > maximumMarks) {
    return undefined;
  }
  return Math.round((marksObtained / maximumMarks) * 10000) / 100;
}

export function validateAcademicBoardRecord(
  record: Partial<AcademicBoardRecord>
): string[] {
  const errors: string[] = [];

  if (!record.board?.trim() && !record.school?.trim()) {
    errors.push('Please provide either the education board or school name.');
  }

  if (record.passingYear !== undefined) {
    if (
      !Number.isInteger(record.passingYear) ||
      record.passingYear < 1975 ||
      record.passingYear > 2045
    ) {
      errors.push('Passing year must be a valid 4-digit year between 1975 and 2045.');
    }
  }

  const hasObtained = record.marksObtained !== undefined;
  const hasMaximum = record.maximumMarks !== undefined;

  if (hasObtained && (!Number.isFinite(record.marksObtained) || record.marksObtained! < 0)) {
    errors.push('Marks obtained cannot be negative.');
  }

  if (hasMaximum && (!Number.isFinite(record.maximumMarks) || record.maximumMarks! <= 0)) {
    errors.push('Maximum marks must be greater than 0.');
  }

  if (hasObtained && !hasMaximum) {
    errors.push('Please enter maximum marks alongside marks obtained.');
  }

  if (!hasObtained && hasMaximum) {
    errors.push('Please enter marks obtained alongside maximum marks.');
  }

  if (
    hasObtained &&
    hasMaximum &&
    Number.isFinite(record.marksObtained) &&
    Number.isFinite(record.maximumMarks) &&
    record.marksObtained! > record.maximumMarks!
  ) {
    errors.push('Marks obtained cannot exceed maximum marks.');
  }

  if (record.percentage !== undefined) {
    if (!Number.isFinite(record.percentage) || record.percentage < 0 || record.percentage > 100) {
      errors.push('Percentage must be between 0 and 100.');
    }
  }

  return errors;
}

export function validateSemesterResult(record: Partial<SemesterResultRecord>): string[] {
  const errors: string[] = [];

  if (!record.semester?.trim()) {
    errors.push('Semester label is required (e.g., Semester 1).');
  }

  if (
    record.sgpa === undefined &&
    record.cgpa === undefined &&
    record.earnedCredits === undefined
  ) {
    errors.push('Enter at least SGPA, CGPA, or earned credits for this semester.');
  }

  if (record.sgpa !== undefined) {
    if (!Number.isFinite(record.sgpa) || record.sgpa < 0 || record.sgpa > 10) {
      errors.push('SGPA must be between 0 and 10.');
    }
  }

  if (record.cgpa !== undefined) {
    if (!Number.isFinite(record.cgpa) || record.cgpa < 0 || record.cgpa > 10) {
      errors.push('CGPA must be between 0 and 10.');
    }
  }

  if (record.earnedCredits !== undefined) {
    if (
      !Number.isFinite(record.earnedCredits) ||
      record.earnedCredits < 0 ||
      record.earnedCredits > 400
    ) {
      errors.push('Earned credits must be between 0 and 400.');
    }
  }

  if (record.resultYear !== undefined) {
    if (
      !Number.isInteger(record.resultYear) ||
      record.resultYear < 1980 ||
      record.resultYear > 2045
    ) {
      errors.push('Result year must be a valid year between 1980 and 2045.');
    }
  }

  return errors;
}

export function validateProfileYears(
  admissionYear?: number,
  expectedGraduationYear?: number
): string[] {
  const errors: string[] = [];
  if (
    admissionYear !== undefined &&
    (!Number.isInteger(admissionYear) || admissionYear < 1980 || admissionYear > 2045)
  ) {
    errors.push('Admission year must be between 1980 and 2045.');
  }
  if (
    expectedGraduationYear !== undefined &&
    (!Number.isInteger(expectedGraduationYear) ||
      expectedGraduationYear < 1980 ||
      expectedGraduationYear > 2045)
  ) {
    errors.push('Expected graduation year must be between 1980 and 2045.');
  }
  if (
    admissionYear !== undefined &&
    expectedGraduationYear !== undefined &&
    expectedGraduationYear < admissionYear
  ) {
    errors.push('Expected graduation year cannot be earlier than admission year.');
  }
  return errors;
}

export function validateHttpUrl(value?: string, label = 'URL'): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return `${label} must start with https:// or http://.`;
    }
    return null;
  } catch {
    return `${label} must be a valid URL (e.g., https://...).`;
  }
}

export function validateAvatarFile(file: {
  type: string;
  size: number;
  name?: string;
}): { valid: boolean; error?: string } {
  const normalizedType = (file.type || '').toLowerCase();
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(normalizedType as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: 'Please choose a JPG, PNG, or WebP image file.',
    };
  }
  if (file.size <= 0) {
    return {
      valid: false,
      error: 'Selected image file appears empty.',
    };
  }
  if (file.size > MAX_AVATAR_RAW_BYTES) {
    return {
      valid: false,
      error: 'Profile picture must be 2 MB or smaller.',
    };
  }
  return { valid: true };
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and resizes/compresses an uploaded profile image so it remains private
 * and safely within Firestore subdocument size bounds.
 */
export async function processProfileImageUpload(
  file: File
): Promise<{ dataUrl: string; mimeType: string }> {
  const check = validateAvatarFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid image file.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);

  // Resize/compress on canvas when browser supports Image + 2D canvas
  if (typeof document !== 'undefined' && typeof Image !== 'undefined') {
    try {
      const compressed = await new Promise<{ dataUrl: string; mimeType: string } | null>(
        (resolve) => {
          const img = new Image();
          const timer = setTimeout(() => resolve(null), 1000);
          img.onload = () => {
            clearTimeout(timer);
            try {
              const maxDim = 320;
              const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim));
              const width = Math.max(1, Math.round((img.width || maxDim) * scale));
              const height = Math.max(1, Math.round((img.height || maxDim) * scale));

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(null);
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const dataUrl = canvas.toDataURL(outMime, 0.82);
              if (dataUrl && dataUrl.startsWith('data:image/')) {
                resolve({ dataUrl, mimeType: outMime });
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
          };
          img.src = rawDataUrl;
        }
      );

      if (compressed && compressed.dataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH) {
        return compressed;
      }
    } catch {
      // Fall through to raw size check below
    }
  }

  if (rawDataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw new Error(
      'Image could not be compressed small enough. Please choose a smaller JPG, PNG, or WebP photo.'
    );
  }

  return { dataUrl: rawDataUrl, mimeType: file.type };
}

/**
 * Transitions a goal's status cleanly without fabricating completion dates or auto-completing.
 */
export function transitionGoalStatus(
  goal: StudentGoal,
  nextStatus: StudentGoalStatus,
  options?: { completedAt?: string; nowIso?: string }
): StudentGoal {
  const nowIso = options?.nowIso || new Date().toISOString();
  const todayDate = nowIso.split('T')[0];

  if (nextStatus === 'Completed') {
    return {
      ...goal,
      status: 'Completed',
      completedAt: options?.completedAt || goal.completedAt || todayDate,
      updatedAt: nowIso,
    };
  }

  return {
    ...goal,
    status: nextStatus,
    completedAt: undefined,
    updatedAt: nowIso,
  };
}

function hasMeaningfulBoardRecord(record?: AcademicBoardRecord): boolean {
  if (!record) return false;
  return Boolean(
    record.board?.trim() ||
      record.school?.trim() ||
      record.percentage !== undefined ||
      record.marksObtained !== undefined
  );
}

/**
 * Computes profile completion strictly from meaningful saved student profile fields.
 * Intentionally kept separate from quiz mastery, task completion, and goal completion.
 */
export function calculateProfileCompletion(
  profile: UserProfile
): ProfileCompletionSummary {
  const overviewChecks: { ok: boolean; prompt: string }[] = [
    {
      ok: Boolean(profile.name?.trim() && profile.name.trim() !== 'Student'),
      prompt: 'Add your full name',
    },
    {
      ok: Boolean(profile.institution?.trim()),
      prompt: 'Add your college or school name',
    },
    {
      ok: Boolean(
        profile.degree?.trim() || profile.branch?.trim() || profile.academicLevel?.trim()
      ),
      prompt: 'Add your degree or academic track',
    },
    {
      ok: Boolean(profile.currentYear?.trim() || profile.currentSemester?.trim()),
      prompt: 'Set your current year or semester',
    },
    {
      ok: Boolean(profile.city?.trim() || profile.state?.trim() || profile.country?.trim()),
      prompt: 'Add your city, state, or country',
    },
    {
      ok: Boolean(profile.bio?.trim() || profile.careerInterest?.trim()),
      prompt: 'Add a short bio or career interest',
    },
  ];

  const academicChecks: { ok: boolean; prompt: string }[] = [
    {
      ok:
        hasMeaningfulBoardRecord(profile.secondaryEducation) ||
        hasMeaningfulBoardRecord(profile.higherSecondaryEducation),
      prompt: 'Add Class 10 or Class 12 academic history',
    },
    {
      ok: (profile.semesterResults?.length || 0) > 0,
      prompt: 'Add at least one semester result',
    },
  ];

  const goalsChecks: { ok: boolean; prompt: string }[] = [
    {
      ok: (profile.goals?.length || 0) > 0,
      prompt: 'Create a personal or academic goal',
    },
  ];

  const portfolioChecks: { ok: boolean; prompt: string }[] = [
    {
      ok: (profile.skills?.length || 0) > 0,
      prompt: 'Add your technical or soft skills',
    },
    {
      ok: Boolean(
        (profile.projects?.length || 0) > 0 ||
          (profile.certifications?.length || 0) > 0 ||
          (profile.experiences?.length || 0) > 0 ||
          profile.socialLinks?.github?.trim() ||
          profile.socialLinks?.linkedin?.trim() ||
          profile.socialLinks?.portfolio?.trim()
      ),
      prompt: 'Add a project, certification, internship, or portfolio link',
    },
  ];

  const studyPrefChecks: { ok: boolean; prompt: string }[] = [
    {
      ok: (profile.subjects?.length || 0) > 0,
      prompt: 'List your study subjects',
    },
    {
      ok: Boolean(
        profile.dailyGoalHours > 0 &&
          ((profile.preferredStudyDays?.length || 0) > 0 ||
            Boolean(profile.preferredStudyTime?.trim()))
      ),
      prompt: 'Set daily study hours and preferred days/time',
    },
    {
      ok: Boolean(
        profile.targetExam?.trim() ||
          profile.learningGoal?.trim() ||
          (profile.upcomingExams?.length || 0) > 0
      ),
      prompt: 'Set an exam target or learning goal',
    },
  ];

  const sections: ProfileCompletionSection[] = [
    {
      id: 'overview',
      label: 'Overview',
      completed: overviewChecks.filter((c) => c.ok).length,
      total: overviewChecks.length,
    },
    {
      id: 'academics',
      label: 'Academics',
      completed: academicChecks.filter((c) => c.ok).length,
      total: academicChecks.length,
    },
    {
      id: 'goals',
      label: 'Goals',
      completed: goalsChecks.filter((c) => c.ok).length,
      total: goalsChecks.length,
    },
    {
      id: 'portfolio',
      label: 'Skills & Portfolio',
      completed: portfolioChecks.filter((c) => c.ok).length,
      total: portfolioChecks.length,
    },
    {
      id: 'preferences',
      label: 'Study Preferences',
      completed: studyPrefChecks.filter((c) => c.ok).length,
      total: studyPrefChecks.length,
    },
  ];

  const allChecks = [
    ...overviewChecks,
    ...academicChecks,
    ...goalsChecks,
    ...portfolioChecks,
    ...studyPrefChecks,
  ];
  const completedCount = allChecks.filter((c) => c.ok).length;
  const totalCount = allChecks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const missingPrompts = allChecks.filter((c) => !c.ok).map((c) => c.prompt);

  return {
    percentage,
    completedCount,
    totalCount,
    sections,
    missingPrompts,
  };
}

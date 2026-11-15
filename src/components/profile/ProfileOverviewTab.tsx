import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User,
  GraduationCap,
  MapPin,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { StudioPanel } from '../ui/Common';
import { validateProfileYears } from '../../services/learning/profileUtils';

interface ProfileOverviewTabProps {
  profile: UserProfile;
  isEditing: boolean;
  onSetEditing: (editing: boolean) => void;
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const inputClass =
  'w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
  profile,
  isEditing,
  onSetEditing,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [preferredName, setPreferredName] = useState(profile.preferredName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [academicLevel, setAcademicLevel] = useState(profile.academicLevel || '');
  const [institution, setInstitution] = useState(profile.institution || '');
  const [degree, setDegree] = useState(profile.degree || '');
  const [branch, setBranch] = useState(profile.branch || '');
  const [currentYear, setCurrentYear] = useState(profile.currentYear || '');
  const [currentSemester, setCurrentSemester] = useState(profile.currentSemester || '');
  const [admissionYear, setAdmissionYear] = useState(
    profile.admissionYear !== undefined ? String(profile.admissionYear) : ''
  );
  const [expectedGraduationYear, setExpectedGraduationYear] = useState(
    profile.expectedGraduationYear !== undefined ? String(profile.expectedGraduationYear) : ''
  );
  const [city, setCity] = useState(profile.city || '');
  const [stateVal, setStateVal] = useState(profile.state || '');
  const [country, setCountry] = useState(profile.country || '');
  const [careerInterest, setCareerInterest] = useState(profile.careerInterest || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [showOptionalGroup, setShowOptionalGroup] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setName(profile.name || '');
      setPreferredName(profile.preferredName || '');
      setEmail(profile.email || '');
      setAcademicLevel(profile.academicLevel || '');
      setInstitution(profile.institution || '');
      setDegree(profile.degree || '');
      setBranch(profile.branch || '');
      setCurrentYear(profile.currentYear || '');
      setCurrentSemester(profile.currentSemester || '');
      setAdmissionYear(profile.admissionYear !== undefined ? String(profile.admissionYear) : '');
      setExpectedGraduationYear(
        profile.expectedGraduationYear !== undefined ? String(profile.expectedGraduationYear) : ''
      );
      setCity(profile.city || '');
      setStateVal(profile.state || '');
      setCountry(profile.country || '');
      setCareerInterest(profile.careerInterest || '');
      setBio(profile.bio || '');
      setErrors([]);
    }
  }, [profile, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    const trimmedName = name.trim();
    if (!trimmedName) {
      validationErrors.push('Full name is required.');
    }

    const parsedAdmission = admissionYear.trim() ? Number(admissionYear.trim()) : undefined;
    const parsedGrad = expectedGraduationYear.trim()
      ? Number(expectedGraduationYear.trim())
      : undefined;

    if (admissionYear.trim() && Number.isNaN(parsedAdmission)) {
      validationErrors.push('Admission year must be a number.');
    }
    if (expectedGraduationYear.trim() && Number.isNaN(parsedGrad)) {
      validationErrors.push('Expected graduation year must be a number.');
    }
    validationErrors.push(...validateProfileYears(parsedAdmission, parsedGrad));

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSaving(true);
    try {
      const patch: Partial<UserProfile> = {
        name: trimmedName,
        preferredName: preferredName.trim(),
        email: email.trim(),
        academicLevel: academicLevel.trim(),
        institution: institution.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        currentYear: currentYear.trim(),
        currentSemester: currentSemester.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        country: country.trim(),
        careerInterest: careerInterest.trim(),
        bio: bio.trim(),
      };
      if (parsedAdmission !== undefined) patch.admissionYear = parsedAdmission;
      if (parsedGrad !== undefined) patch.expectedGraduationYear = parsedGrad;

      await onSaveProfile(patch);
      onSetEditing(false);
    } catch (err: any) {
      setErrors([err?.message || 'Failed to save profile details. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <StudioPanel className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Edit Personal &amp; Academic Overview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Required identity fields and academic enrollment details
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSetEditing(false)}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {errors.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200 space-y-1"
            >
              {errors.map((err) => (
                <p key={err} className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{err}</span>
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="overview-full-name" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="overview-full-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="overview-preferred-name" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Preferred Name (optional)
              </label>
              <input
                id="overview-preferred-name"
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g. Ananya"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="overview-email" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Email
              </label>
              <input
                id="overview-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="overview-institution" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                College / University / School
              </label>
              <input
                id="overview-institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="overview-academic-level" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Academic Level
              </label>
              <input
                id="overview-academic-level"
                type="text"
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                placeholder="e.g. Undergraduate, Postgraduate, High School"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="overview-degree" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Degree
              </label>
              <input
                id="overview-degree"
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Tech, B.Sc, MBA"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="overview-branch" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Branch / Major
              </label>
              <input
                id="overview-branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="overview-current-year" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Current Academic Year
              </label>
              <input
                id="overview-current-year"
                type="text"
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                placeholder="e.g. 3rd Year"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="overview-current-semester" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Current Semester
              </label>
              <input
                id="overview-current-semester"
                type="text"
                value={currentSemester}
                onChange={(e) => setCurrentSemester(e.target.value)}
                placeholder="e.g. Semester 6"
                className={inputClass}
              />
            </div>
          </div>

          {/* Expandable Optional Details */}
          <div className="border-t border-[#E5E1D6] dark:border-[#1E2F47] pt-4 space-y-4">
            <button
              type="button"
              onClick={() => setShowOptionalGroup((prev) => !prev)}
              aria-expanded={showOptionalGroup}
              className="flex items-center justify-between w-full text-left text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <span>Location, Graduation Timeline &amp; Bio (Optional)</span>
              {showOptionalGroup ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showOptionalGroup && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="overview-city" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      City
                    </label>
                    <input
                      id="overview-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="overview-state" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      State / Province
                    </label>
                    <input
                      id="overview-state"
                      type="text"
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="overview-country" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Country
                    </label>
                    <input
                      id="overview-country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. India"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="overview-admission-year" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Admission Year
                    </label>
                    <input
                      id="overview-admission-year"
                      type="number"
                      min={1980}
                      max={2045}
                      value={admissionYear}
                      onChange={(e) => setAdmissionYear(e.target.value)}
                      placeholder="e.g. 2023"
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="overview-graduation-year" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Expected Graduation Year
                    </label>
                    <input
                      id="overview-graduation-year"
                      type="number"
                      min={1980}
                      max={2045}
                      value={expectedGraduationYear}
                      onChange={(e) => setExpectedGraduationYear(e.target.value)}
                      placeholder="e.g. 2027"
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="overview-career-interest" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Career Interest
                    </label>
                    <input
                      id="overview-career-interest"
                      type="text"
                      value={careerInterest}
                      onChange={(e) => setCareerInterest(e.target.value)}
                      placeholder="e.g. Backend Systems, ML Research"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="overview-bio" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Short Bio
                  </label>
                  <textarea
                    id="overview-bio"
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your academic focus or goals."
                    className={`${inputClass} leading-relaxed`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSetEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-[#EFECE3] dark:hover:bg-[#16263D] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Overview'}</span>
            </button>
          </div>
        </form>
      </StudioPanel>
    );
  }

  const locationDisplay = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
  const timelineDisplay =
    profile.admissionYear || profile.expectedGraduationYear
      ? `${profile.admissionYear || '—'} – ${profile.expectedGraduationYear || '—'}`
      : 'Not specified';

  return (
    <StudioPanel className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Personal &amp; Academic Details
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Self-reported personal identity, academic enrollment, and career focus
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSetEditing(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          <span>Edit Overview</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <User className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Identity</span>
          </div>
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Full Name</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {profile.name && profile.name !== 'Student' ? profile.name : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Preferred Name</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {profile.preferredName?.trim() || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Bio</dt>
              <dd className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                {profile.bio?.trim() || 'No bio added yet'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <GraduationCap className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Academic Enrollment</span>
          </div>
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">College / University</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {profile.institution?.trim() || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Degree &amp; Branch</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {[profile.degree, profile.branch].filter(Boolean).join(' · ') || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Current Year &amp; Semester</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 tabular-nums">
                {[profile.currentYear, profile.currentSemester].filter(Boolean).join(' · ') || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Admission – Graduation</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 tabular-nums">
                {timelineDisplay}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Location &amp; Direction</span>
          </div>
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Location</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {locationDisplay || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Academic Level</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {profile.academicLevel?.trim() || 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Career Interest</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {profile.careerInterest?.trim() || 'Not set'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </StudioPanel>
  );
};

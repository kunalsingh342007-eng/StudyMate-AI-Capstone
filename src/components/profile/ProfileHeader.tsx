import React, { useRef, useState } from 'react';
import {
  Camera,
  Trash2,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { StudioPanel, ProgressMeter, StatusIndicator } from '../ui/Common';
import {
  calculateProfileCompletion,
  processProfileImageUpload,
} from '../../services/learning/profileUtils';

interface ProfileHeaderProps {
  profile: UserProfile;
  emailVerified?: boolean;
  isSignedIn: boolean;
  onEditClick: () => void;
  onUploadAvatar: (dataUrl: string, mimeType: string) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  emailVerified,
  isSignedIn,
  onEditClick,
  onUploadAvatar,
  onRemoveAvatar,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const displayName = profile.name?.trim() || 'Student';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST';

  const locationParts = [profile.city, profile.state, profile.country]
    .map((p) => p?.trim())
    .filter(Boolean);
  const locationText = locationParts.join(', ');

  const academicSummary = [
    profile.degree?.trim(),
    profile.branch?.trim(),
    profile.currentYear?.trim(),
    profile.currentSemester?.trim(),
  ]
    .filter(Boolean)
    .join(' · ');

  const completion = calculateProfileCompletion(profile);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const processed = await processProfileImageUpload(file);
      await onUploadAvatar(processed.dataUrl, processed.mimeType);
    } catch (err: any) {
      setAvatarError(err?.message || 'Could not update profile picture.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemove = async () => {
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      await onRemoveAvatar();
    } catch (err: any) {
      setAvatarError(err?.message || 'Could not remove profile picture.');
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <StudioPanel className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start gap-5 flex-1 min-w-0">
          {/* Avatar & Private Photo Controls */}
          <div className="flex flex-col items-start sm:items-center gap-2.5 shrink-0">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#0A1628] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${displayName} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-teal-300 font-bold text-2xl select-none">
                  {initials}
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="profile-avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelected}
              className="sr-only"
              aria-label="Upload profile picture"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-[11px] font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>{avatarBusy ? 'Saving...' : profile.avatarUrl ? 'Change' : 'Upload Photo'}</span>
              </button>

              {profile.avatarUrl && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={handleRemove}
                  aria-label="Remove profile picture"
                  className="p-1.5 rounded-lg bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Private · JPG, PNG, WebP (max 2 MB)
            </span>
          </div>

          {/* Identity Summary */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </h2>
              {profile.preferredName?.trim() && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Preferred: {profile.preferredName.trim()}
                </span>
              )}
              {profile.academicLevel?.trim() && (
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {profile.academicLevel.trim()}
                </span>
              )}
            </div>

            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                <span>{profile.email?.trim() || 'Email not set'}</span>
              </span>

              {isSignedIn ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <ShieldCheck
                    className={`w-3.5 h-3.5 ${
                      emailVerified
                        ? 'text-lime-600 dark:text-lime-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  />
                  <span>{emailVerified ? 'Verified Account Email' : 'Unverified Account Email'}</span>
                </span>
              ) : (
                <StatusIndicator label="Local Session" tone="neutral" />
              )}
            </div>

            {(profile.institution?.trim() || academicSummary) && (
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                <GraduationCap className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                {profile.institution?.trim() && (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {profile.institution.trim()}
                  </span>
                )}
                {profile.institution?.trim() && academicSummary && (
                  <span aria-hidden="true" className="text-slate-400">
                    &middot;
                  </span>
                )}
                {academicSummary && <span>{academicSummary}</span>}
              </div>
            )}

            {(locationText || profile.careerInterest?.trim()) && (
              <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                {locationText && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                    <span>{locationText}</span>
                  </span>
                )}
                {profile.careerInterest?.trim() && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                    <span>Career Focus: {profile.careerInterest.trim()}</span>
                  </span>
                )}
              </div>
            )}

            {profile.bio?.trim() && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-1 max-w-2xl leading-relaxed">
                {profile.bio.trim()}
              </p>
            )}
          </div>
        </div>

        {/* Top Edit Action & Profile Completion Meter */}
        <div className="w-full lg:w-72 shrink-0 space-y-3 bg-[#F7F5EF] dark:bg-[#16263D] rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Profile Completion
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {completion.percentage}%
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                  ({completion.completedCount}/{completion.totalCount} saved)
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onEditClick}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Edit2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Edit Profile</span>
            </button>
          </div>

          <ProgressMeter
            value={completion.percentage}
            tone={completion.percentage >= 80 ? 'lime' : 'teal'}
            label={`Profile completion ${completion.percentage}%`}
          />

          {completion.missingPrompts.length > 0 ? (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Next to add: {completion.missingPrompts[0]}
            </p>
          ) : (
            <p className="text-[11px] text-lime-700 dark:text-lime-400 inline-flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>All core profile sections populated</span>
            </p>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-[#E5E1D6] dark:border-[#1E2F47] pt-2 leading-snug">
            Reflects saved profile details only — separate from quiz mastery and goal progress.
          </p>
        </div>
      </div>

      {avatarError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{avatarError}</span>
        </div>
      )}
    </StudioPanel>
  );
};

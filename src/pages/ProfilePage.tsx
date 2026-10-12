import React, { useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  Clock,
  Flame,
  Award,
  CheckCircle2,
  BookOpen,
  Sparkles,
  HelpCircle,
  GraduationCap,
  Target,
  Edit2,
  Save,
  Check,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';

export const ProfilePage: React.FC = () => {
  const { userProfile, saveUserProfile, progress, activePlan } = useStorage();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [academicLevel, setAcademicLevel] = useState(userProfile.academicLevel);
  const [institution, setInstitution] = useState(userProfile.institution || 'School of Computer Science');
  const [targetExam, setTargetExam] = useState(userProfile.targetExam);
  const [targetExamDate, setTargetExamDate] = useState(userProfile.targetExamDate);
  const [dailyGoalHours, setDailyGoalHours] = useState(userProfile.dailyGoalHours);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Exam days countdown
  const examDaysLeft = targetExamDate
    ? Math.max(
        0,
        Math.ceil((new Date(targetExamDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      )
    : 18;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile({
      name: name.trim() || 'Alex Rivera',
      email: email.trim(),
      academicLevel,
      institution: institution.trim(),
      targetExam: targetExam.trim(),
      targetExamDate,
      dailyGoalHours: Number(dailyGoalHours) || 3,
      bio: bio.trim(),
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const achievements = [
    {
      id: 'ach-1',
      title: '7-Day Consistency Streak',
      desc: 'Completed planned study intervals every day for a whole week.',
      icon: Flame,
      color: 'bg-amber-500 text-white',
      unlocked: true,
      date: 'Earned yesterday',
    },
    {
      id: 'ach-2',
      title: 'Active Retrieval Champion',
      desc: 'Tested understanding across 10+ timed quizzes with AI explanations.',
      icon: HelpCircle,
      color: 'bg-purple-600 text-white',
      unlocked: true,
      date: 'Earned 3 days ago',
    },
    {
      id: 'ach-3',
      title: 'Deep Concept Explorer',
      desc: 'Deep-dived into 5 multi-tier explanations with code & analogies.',
      icon: Sparkles,
      color: 'bg-indigo-600 text-white',
      unlocked: true,
      date: 'Earned 1 week ago',
    },
    {
      id: 'ach-4',
      title: 'Exam Readiness Milestone',
      desc: 'Covered over 60% of syllabus topics before final review week.',
      icon: Target,
      color: 'bg-emerald-600 text-white',
      unlocked: (progress.completedTasksCount || 14) >= 12,
      date: 'In progress',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 font-mono">
            STUDENT PROFILE & ACADEMIC PORTFOLIO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
            Academic Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your academic track, goal countdowns, learning metrics, and study habits
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-800 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-100/40 via-indigo-50/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-purple-600/30 border-2 border-white shrink-0">
            {userProfile.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('') || 'AR'}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B]">
                {userProfile.name || 'Alex Rivera'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                {userProfile.academicLevel || 'Undergraduate Senior'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-500" />
              <span>{userProfile.email || 'alex.rivera@university.edu'}</span>
              <span className="text-slate-300">&bull;</span>
              <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
              <span>{userProfile.institution || 'School of Computer Science'}</span>
            </p>

            {userProfile.bio && (
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                {userProfile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Target Exam Ribbon */}
        <div className="mt-6 pt-6 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Examination</p>
              <p className="text-sm font-extrabold text-[#1E1B4B]">
                {userProfile.targetExam || activePlan?.subject || 'Semester Finals'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right sm:text-right">
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                ⏳ {examDaysLeft} Days Remaining
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Exam Date: {new Date(userProfile.targetExamDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Learning Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-purple-100/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Study Streak</p>
            <p className="text-xl font-extrabold text-[#1E1B4B]">
              {progress.streakDays || userProfile.streakDays || 7} Days
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-purple-100/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tasks Completed</p>
            <p className="text-xl font-extrabold text-[#1E1B4B]">
              {progress.completedTasksCount || 14} Tasks
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-purple-100/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Study Time</p>
            <p className="text-xl font-extrabold text-[#1E1B4B]">
              {progress.totalHoursStudied || 26.5} hrs
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-purple-100/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Quiz Average</p>
            <p className="text-xl font-extrabold text-[#1E1B4B]">
              {progress.averageQuizScore || 78}%
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form (if editing is toggled) */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-md space-y-5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <h3 className="text-base font-bold text-[#1E1B4B]">Edit Student Profile</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Level</label>
              <input
                type="text"
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution / School</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Exam Name</label>
              <input
                type="text"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Exam Date</label>
              <input
                type="date"
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Daily Goal (Hours)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Academic Bio / Focus</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-purple-600 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Academic Achievements / Milestones */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-purple-100/80">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Academic Milestones & Badges</h3>
            <p className="text-xs text-slate-500">Evidence-based study badges unlocked on your learning journey</p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            3 / 4 Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {achievements.map((ach) => {
            const Icon = ach.icon;
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  ach.unlocked
                    ? 'bg-purple-50/30 border-purple-100 hover:bg-purple-50/60'
                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                <div className={`p-2.5 rounded-2xl shrink-0 ${ach.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1E1B4B] truncate">
                      {ach.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {ach.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

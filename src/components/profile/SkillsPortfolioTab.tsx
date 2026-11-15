import React, { useState, useEffect } from 'react';
import {
  Code2,
  FolderGit2,
  Award,
  Briefcase,
  Link2,
  Plus,
  Edit2,
  Trash2,
  Save,
  ExternalLink,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  SkillProficiency,
  StudentCertification,
  StudentExperience,
  StudentProject,
  StudentSkill,
  UserProfile,
} from '../../types';
import { StudioPanel, StatusIndicator } from '../ui/Common';
import { validateHttpUrl } from '../../services/learning/profileUtils';

interface SkillsPortfolioTabProps {
  profile: UserProfile;
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const inputClass =
  'w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

export const SkillsPortfolioTab: React.FC<SkillsPortfolioTabProps> = ({
  profile,
  onSaveProfile,
}) => {
  const skills = profile.skills || [];
  const projects = profile.projects || [];
  const certifications = profile.certifications || [];
  const experiences = profile.experiences || [];
  const socialLinks = profile.socialLinks || {};

  const [saving, setSaving] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // Skill Add Form
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState<'Technical' | 'Non-Technical'>('Technical');
  const [skillProficiency, setSkillProficiency] = useState<SkillProficiency | ''>('Intermediate');

  // Project Form
  const [editingProjectId, setEditingProjectId] = useState<string | 'new' | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectTech, setProjectTech] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectStatus, setProjectStatus] = useState<'Planned' | 'In Progress' | 'Completed'>('Completed');

  // Certification Form
  const [editingCertId, setEditingCertId] = useState<string | 'new' | null>(null);
  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certUrl, setCertUrl] = useState('');

  // Experience Form
  const [editingExpId, setEditingExpId] = useState<string | 'new' | null>(null);
  const [expRole, setExpRole] = useState('');
  const [expOrg, setExpOrg] = useState('');
  const [expType, setExpType] = useState<'Internship' | 'Research' | 'Work' | 'Leadership'>('Internship');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expActive, setExpActive] = useState(false);
  const [expDesc, setExpDesc] = useState('');

  // Social Links Form
  const [editingLinks, setEditingLinks] = useState(false);
  const [githubUrl, setGithubUrl] = useState(socialLinks.github || '');
  const [linkedinUrl, setLinkedinUrl] = useState(socialLinks.linkedin || '');
  const [portfolioUrl, setPortfolioUrl] = useState(socialLinks.portfolio || '');

  useEffect(() => {
    if (!editingLinks) {
      setGithubUrl(socialLinks.github || '');
      setLinkedinUrl(socialLinks.linkedin || '');
      setPortfolioUrl(socialLinks.portfolio || '');
    }
  }, [socialLinks, editingLinks]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setSectionError('Enter a skill name before adding.');
      return;
    }
    setSectionError(null);
    const newSkill: StudentSkill = {
      id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: skillName.trim(),
      category: skillCategory,
      ...(skillProficiency ? { proficiency: skillProficiency } : {}),
    };
    setSaving(true);
    try {
      await onSaveProfile({ skills: [...skills, newSkill] });
      setSkillName('');
    } catch (err: any) {
      setSectionError(err?.message || 'Failed to save skill.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (id: string) => {
    setSaving(true);
    try {
      await onSaveProfile({ skills: skills.filter((s) => s.id !== id) });
    } catch (err: any) {
      setSectionError(err?.message || 'Could not remove skill.');
    } finally {
      setSaving(false);
    }
  };

  const openProjectEditor = (proj?: StudentProject) => {
    setSectionError(null);
    if (proj) {
      setEditingProjectId(proj.id);
      setProjectTitle(proj.title);
      setProjectDesc(proj.description);
      setProjectTech(proj.technologies.join(', '));
      setProjectUrl(proj.projectUrl || '');
      setProjectStatus(proj.status);
    } else {
      setEditingProjectId('new');
      setProjectTitle('');
      setProjectDesc('');
      setProjectTech('');
      setProjectUrl('');
      setProjectStatus('Completed');
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) {
      setSectionError('Project title is required.');
      return;
    }
    const urlError = validateHttpUrl(projectUrl, 'Project URL');
    if (urlError) {
      setSectionError(urlError);
      return;
    }

    const candidate: StudentProject = {
      id:
        editingProjectId && editingProjectId !== 'new'
          ? editingProjectId
          : `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: projectTitle.trim(),
      description: projectDesc.trim(),
      technologies: projectTech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      ...(projectUrl.trim() ? { projectUrl: projectUrl.trim() } : {}),
      status: projectStatus,
    };

    const nextProjects =
      editingProjectId === 'new'
        ? [candidate, ...projects]
        : projects.map((p) => (p.id === editingProjectId ? candidate : p));

    setSectionError(null);
    setSaving(true);
    try {
      await onSaveProfile({ projects: nextProjects });
      setEditingProjectId(null);
    } catch (err: any) {
      setSectionError(err?.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setSaving(true);
    try {
      await onSaveProfile({ projects: projects.filter((p) => p.id !== id) });
    } catch (err: any) {
      setSectionError(err?.message || 'Could not remove project.');
    } finally {
      setSaving(false);
    }
  };

  const openCertEditor = (cert?: StudentCertification) => {
    setSectionError(null);
    if (cert) {
      setEditingCertId(cert.id);
      setCertName(cert.name);
      setCertOrg(cert.issuingOrganization);
      setCertDate(cert.issueDate || '');
      setCertUrl(cert.credentialUrl || '');
    } else {
      setEditingCertId('new');
      setCertName('');
      setCertOrg('');
      setCertDate('');
      setCertUrl('');
    }
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim() || !certOrg.trim()) {
      setSectionError('Certification title and issuing organization are required.');
      return;
    }
    const urlError = validateHttpUrl(certUrl, 'Credential URL');
    if (urlError) {
      setSectionError(urlError);
      return;
    }

    const candidate: StudentCertification = {
      id:
        editingCertId && editingCertId !== 'new'
          ? editingCertId
          : `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: certName.trim(),
      issuingOrganization: certOrg.trim(),
      ...(certDate ? { issueDate: certDate } : {}),
      ...(certUrl.trim() ? { credentialUrl: certUrl.trim() } : {}),
    };

    const nextCerts =
      editingCertId === 'new'
        ? [candidate, ...certifications]
        : certifications.map((c) => (c.id === editingCertId ? candidate : c));

    setSectionError(null);
    setSaving(true);
    try {
      await onSaveProfile({ certifications: nextCerts });
      setEditingCertId(null);
    } catch (err: any) {
      setSectionError(err?.message || 'Failed to save certification.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    setSaving(true);
    try {
      await onSaveProfile({ certifications: certifications.filter((c) => c.id !== id) });
    } catch (err: any) {
      setSectionError(err?.message || 'Could not remove certification.');
    } finally {
      setSaving(false);
    }
  };

  const openExpEditor = (exp?: StudentExperience) => {
    setSectionError(null);
    if (exp) {
      setEditingExpId(exp.id);
      setExpRole(exp.role);
      setExpOrg(exp.organization);
      setExpType(exp.type);
      setExpStart(exp.startDate || '');
      setExpEnd(exp.endDate || '');
      setExpActive(Boolean(exp.currentlyActive));
      setExpDesc(exp.description || '');
    } else {
      setEditingExpId('new');
      setExpRole('');
      setExpOrg('');
      setExpType('Internship');
      setExpStart('');
      setExpEnd('');
      setExpActive(false);
      setExpDesc('');
    }
  };

  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expRole.trim() || !expOrg.trim()) {
      setSectionError('Role and organization are required.');
      return;
    }

    const candidate: StudentExperience = {
      id:
        editingExpId && editingExpId !== 'new'
          ? editingExpId
          : `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: expRole.trim(),
      organization: expOrg.trim(),
      type: expType,
      ...(expStart ? { startDate: expStart } : {}),
      ...(expEnd && !expActive ? { endDate: expEnd } : {}),
      currentlyActive: expActive,
      ...(expDesc.trim() ? { description: expDesc.trim() } : {}),
    };

    const nextExp =
      editingExpId === 'new'
        ? [candidate, ...experiences]
        : experiences.map((ex) => (ex.id === editingExpId ? candidate : ex));

    setSectionError(null);
    setSaving(true);
    try {
      await onSaveProfile({ experiences: nextExp });
      setEditingExpId(null);
    } catch (err: any) {
      setSectionError(err?.message || 'Failed to save experience record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExp = async (id: string) => {
    setSaving(true);
    try {
      await onSaveProfile({ experiences: experiences.filter((ex) => ex.id !== id) });
    } catch (err: any) {
      setSectionError(err?.message || 'Could not remove experience record.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = [
      validateHttpUrl(githubUrl, 'GitHub URL'),
      validateHttpUrl(linkedinUrl, 'LinkedIn URL'),
      validateHttpUrl(portfolioUrl, 'Portfolio URL'),
    ].filter(Boolean) as string[];

    if (errs.length > 0) {
      setSectionError(errs[0]);
      return;
    }

    setSectionError(null);
    setSaving(true);
    try {
      await onSaveProfile({
        socialLinks: {
          github: githubUrl.trim(),
          linkedin: linkedinUrl.trim(),
          portfolio: portfolioUrl.trim(),
        },
      });
      setEditingLinks(false);
    } catch (err: any) {
      setSectionError(err?.message || 'Failed to save portfolio links.');
    } finally {
      setSaving(false);
    }
  };

  const technicalSkills = skills.filter((s) => s.category === 'Technical');
  const nonTechnicalSkills = skills.filter((s) => s.category === 'Non-Technical');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF] dark:bg-[#16263D] px-4 py-3 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
        <p>
          Skills, self-assessed proficiency, projects, experiences, and portfolio links are <strong className="font-semibold">self-reported</strong> entries, kept distinct from your verified Firebase account email.
        </p>
      </div>

      {sectionError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{sectionError}</span>
        </div>
      )}

      {/* Skills Section */}
      <StudioPanel className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Skills
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Technical and non-technical skills with optional self-assessed proficiency
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Self-reported
          </span>
        </div>

        <form onSubmit={handleAddSkill} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label htmlFor="skill-name" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Skill Name
            </label>
            <input
              id="skill-name"
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. TypeScript, Public Speaking"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="skill-category" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Type
            </label>
            <select
              id="skill-category"
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value as 'Technical' | 'Non-Technical')}
              className={inputClass}
            >
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="skill-proficiency" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Proficiency
            </label>
            <select
              id="skill-proficiency"
              value={skillProficiency}
              onChange={(e) => setSkillProficiency(e.target.value as SkillProficiency | '')}
              className={inputClass}
            >
              <option value="">Unspecified</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>
        </form>

        {skills.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No skills added yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Technical ({technicalSkills.length})
              </h4>
              {technicalSkills.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">None added</p>
              ) : (
                <ul className="divide-y divide-[#E5E1D6] dark:divide-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl">
                  {technicalSkills.map((sk) => (
                    <li
                      key={sk.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {sk.name}
                        </span>
                        {sk.proficiency && (
                          <span className="text-slate-500 dark:text-slate-400">
                            {' '}
                            &middot; {sk.proficiency}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove skill ${sk.name}`}
                        onClick={() => handleRemoveSkill(sk.id)}
                        className="text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Non-Technical ({nonTechnicalSkills.length})
              </h4>
              {nonTechnicalSkills.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">None added</p>
              ) : (
                <ul className="divide-y divide-[#E5E1D6] dark:divide-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] rounded-xl">
                  {nonTechnicalSkills.map((sk) => (
                    <li
                      key={sk.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {sk.name}
                        </span>
                        {sk.proficiency && (
                          <span className="text-slate-500 dark:text-slate-400">
                            {' '}
                            &middot; {sk.proficiency}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove skill ${sk.name}`}
                        onClick={() => handleRemoveSkill(sk.id)}
                        className="text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </StudioPanel>

      {/* Projects Section */}
      <StudioPanel className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Projects</h3>
          </div>
          {editingProjectId === null && (
            <button
              type="button"
              onClick={() => openProjectEditor()}
              className="px-3.5 py-1.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Add Project</span>
            </button>
          )}
        </div>

        {editingProjectId !== null && (
          <form
            onSubmit={handleSaveProject}
            className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/70 dark:bg-[#16263D]/60 p-4 space-y-3.5"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label htmlFor="project-title" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Project Title <span className="text-rose-600">*</span>
                </label>
                <input
                  id="project-title"
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Distributed Cache Simulator"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="project-status" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Completion Status
                </label>
                <select
                  id="project-status"
                  value={projectStatus}
                  onChange={(e) =>
                    setProjectStatus(e.target.value as 'Planned' | 'In Progress' | 'Completed')
                  }
                  className={inputClass}
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="project-tech" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Technologies (comma-separated)
                </label>
                <input
                  id="project-tech"
                  type="text"
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  placeholder="e.g. React, TypeScript, PostgreSQL"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="project-url" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Project URL (optional)
                </label>
                <input
                  id="project-url"
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="project-desc" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Description
              </label>
              <textarea
                id="project-desc"
                rows={2}
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Summarize what you built and the problem it solves."
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingProjectId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Project</span>
              </button>
            </div>
          </form>
        )}

        {projects.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">No projects added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-4 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {proj.title}
                    </h4>
                    <StatusIndicator
                      label={proj.status}
                      tone={
                        proj.status === 'Completed'
                          ? 'lime'
                          : proj.status === 'In Progress'
                          ? 'teal'
                          : 'neutral'
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit project ${proj.title}`}
                      onClick={() => openProjectEditor(proj)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete project ${proj.title}`}
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {proj.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proj.description}
                  </p>
                )}
                {proj.technologies.length > 0 && (
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Stack: {proj.technologies.join(' · ')}
                  </p>
                )}
                {proj.projectUrl && (
                  <a
                    href={proj.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline pt-0.5"
                  >
                    <span>View Project</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </StudioPanel>

      {/* Certifications & Internships Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certifications */}
        <StudioPanel className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Certifications
              </h3>
            </div>
            {editingCertId === null && (
              <button
                type="button"
                onClick={() => openCertEditor()}
                className="px-3 py-1.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>Add</span>
              </button>
            )}
          </div>

          {editingCertId !== null && (
            <form
              onSubmit={handleSaveCert}
              className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/70 dark:bg-[#16263D]/60 p-4 space-y-3"
              noValidate
            >
              <div>
                <label htmlFor="cert-name" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Certification Title <span className="text-rose-600">*</span>
                </label>
                <input
                  id="cert-name"
                  type="text"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="e.g. AWS Cloud Practitioner"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cert-org" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Issuing Organization <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="cert-org"
                    type="text"
                    value={certOrg}
                    onChange={(e) => setCertOrg(e.target.value)}
                    placeholder="e.g. Amazon Web Services"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cert-date" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Issue Date (optional)
                  </label>
                  <input
                    id="cert-date"
                    type="date"
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cert-url" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Credential URL (optional)
                </label>
                <input
                  id="cert-url"
                  type="url"
                  value={certUrl}
                  onChange={(e) => setCertUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCertId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {certifications.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No certifications added yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {cert.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {cert.issuingOrganization}
                      {cert.issueDate ? ` · ${cert.issueDate}` : ''}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Self-reported{cert.credentialUrl ? ' · Credential link attached' : ''}
                    </p>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline pt-0.5"
                      >
                        <span>View Credential Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit certification ${cert.name}`}
                      onClick={() => openCertEditor(cert)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete certification ${cert.name}`}
                      onClick={() => handleDeleteCert(cert.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </StudioPanel>

        {/* Internships & Experiences */}
        <StudioPanel className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Internships &amp; Experience
              </h3>
            </div>
            {editingExpId === null && (
              <button
                type="button"
                onClick={() => openExpEditor()}
                className="px-3 py-1.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>Add</span>
              </button>
            )}
          </div>

          {editingExpId !== null && (
            <form
              onSubmit={handleSaveExp}
              className="rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/70 dark:bg-[#16263D]/60 p-4 space-y-3"
              noValidate
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp-role" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Role <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="exp-role"
                    type="text"
                    value={expRole}
                    onChange={(e) => setExpRole(e.target.value)}
                    placeholder="e.g. Software Engineering Intern"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="exp-org" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Organization <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="exp-org"
                    type="text"
                    value={expOrg}
                    onChange={(e) => setExpOrg(e.target.value)}
                    placeholder="e.g. Acme Labs"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="exp-type" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Type
                  </label>
                  <select
                    id="exp-type"
                    value={expType}
                    onChange={(e) =>
                      setExpType(
                        e.target.value as 'Internship' | 'Research' | 'Work' | 'Leadership'
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Research">Research</option>
                    <option value="Work">Work</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="exp-start" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Start Date
                  </label>
                  <input
                    id="exp-start"
                    type="month"
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label htmlFor="exp-end" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    End Date
                  </label>
                  <input
                    id="exp-end"
                    type="month"
                    disabled={expActive}
                    value={expActive ? '' : expEnd}
                    onChange={(e) => setExpEnd(e.target.value)}
                    className={`${inputClass} tabular-nums disabled:opacity-50`}
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expActive}
                  onChange={(e) => setExpActive(e.target.checked)}
                />
                <span>Currently active in this role</span>
              </label>

              <div>
                <label htmlFor="exp-desc" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Summary (optional)
                </label>
                <textarea
                  id="exp-desc"
                  rows={2}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Key responsibilities or outcomes."
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {experiences.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No internship or experience records added yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {exp.role}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {exp.organization} &middot; {exp.type}
                    </p>
                    {(exp.startDate || exp.currentlyActive || exp.endDate) && (
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {exp.startDate || '—'} – {exp.currentlyActive ? 'Present' : exp.endDate || '—'}
                      </p>
                    )}
                    {exp.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-0.5 leading-snug">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit experience ${exp.role}`}
                      onClick={() => openExpEditor(exp)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete experience ${exp.role}`}
                      onClick={() => handleDeleteExp(exp.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </StudioPanel>
      </div>

      {/* Portfolio & Social Links */}
      <StudioPanel className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D6] dark:border-[#1E2F47]">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                GitHub, LinkedIn &amp; Portfolio Links
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Self-reported external profiles
              </p>
            </div>
          </div>
          {!editingLinks && (
            <button
              type="button"
              onClick={() => {
                setSectionError(null);
                setEditingLinks(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Edit Links</span>
            </button>
          )}
        </div>

        {editingLinks ? (
          <form onSubmit={handleSaveLinks} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="link-github" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  GitHub URL
                </label>
                <input
                  id="link-github"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="link-linkedin" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  LinkedIn URL
                </label>
                <input
                  id="link-linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="link-portfolio" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Portfolio Website
                </label>
                <input
                  id="link-portfolio"
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yoursite.dev"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingLinks(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Links</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {[
              { label: 'GitHub', value: socialLinks.github },
              { label: 'LinkedIn', value: socialLinks.linkedin },
              { label: 'Portfolio', value: socialLinks.portfolio },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3.5 rounded-xl border border-[#E5E1D6] dark:border-[#1E2F47] bg-[#F7F5EF]/60 dark:bg-[#16263D]/60 space-y-1"
              >
                <span className="font-mono uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
                  {item.label}
                </span>
                {item.value ? (
                  <a
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400 hover:underline truncate"
                  >
                    <span className="truncate">{item.value}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">Not set</p>
                )}
              </div>
            ))}
          </div>
        )}
      </StudioPanel>
    </div>
  );
};

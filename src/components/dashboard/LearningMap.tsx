import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Network,
  Sparkles,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Layers,
  Eye,
} from 'lucide-react';
import { StudyPlan, SyllabusStructure, TopicMastery } from '../../types';
import { ProgressMeter, StatusIndicator } from '../ui/Common';

interface LearningMapProps {
  activePlan: StudyPlan | null;
  syllabus: SyllabusStructure | null;
  masteries: Record<string, TopicMastery>;
}

interface ConceptNode {
  id: string;
  name: string;
  unitLabel: string;
  mastery: number;
  status: 'mastered' | 'in_progress' | 'needs_practice' | 'not_started';
  dependencies: string[];
  subtopics: {
    name: string;
    completed: boolean;
  }[];
}

const SAMPLE_PREVIEW_NODES: ConceptNode[] = [
  {
    id: 'sample-1',
    name: 'Recursion & Complexity',
    unitLabel: 'Unit 1 · Foundations',
    mastery: 84,
    status: 'mastered',
    dependencies: [],
    subtopics: [
      { name: 'Recurrence Relations', completed: true },
      { name: 'Master Theorem', completed: true },
      { name: 'Call Stack Tracing', completed: true },
    ],
  },
  {
    id: 'sample-2',
    name: 'Dynamic Programming',
    unitLabel: 'Unit 2 · Core Algorithms',
    mastery: 58,
    status: 'in_progress',
    dependencies: ['Recursion & Complexity'],
    subtopics: [
      { name: 'Top-Down Memoization', completed: true },
      { name: 'Bottom-Up Tabulation', completed: false },
      { name: '1D & 2D State Transitions', completed: false },
    ],
  },
  {
    id: 'sample-3',
    name: 'Graph Traversal & Shortest Path',
    unitLabel: 'Unit 3 · Networks',
    mastery: 38,
    status: 'needs_practice',
    dependencies: ['Recursion & Complexity'],
    subtopics: [
      { name: 'BFS & DFS Trees', completed: false },
      { name: 'Dijkstra Priority Queue', completed: false },
      { name: 'Topological Ordering', completed: false },
    ],
  },
  {
    id: 'sample-4',
    name: 'Network Flow & Optimization',
    unitLabel: 'Unit 4 · Synthesis',
    mastery: 0,
    status: 'not_started',
    dependencies: ['Dynamic Programming', 'Graph Traversal & Shortest Path'],
    subtopics: [
      { name: 'Max-Flow Min-Cut', completed: false },
      { name: 'Bipartite Matching', completed: false },
    ],
  },
];

function resolveNodeStatus(
  score: number,
  attempts: number,
  completedTasks: number,
  totalTasks: number
): ConceptNode['status'] {
  if (attempts > 0) {
    if (score >= 75) return 'mastered';
    if (score >= 50) return 'in_progress';
    return 'needs_practice';
  }
  if (completedTasks > 0) {
    return completedTasks >= totalTasks ? 'mastered' : 'in_progress';
  }
  return 'not_started';
}

export const LearningMap: React.FC<LearningMapProps> = ({
  activePlan,
  syllabus,
  masteries,
}) => {
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  const realNodes = useMemo<ConceptNode[]>(() => {
    const masteryList = Object.values(masteries) as TopicMastery[];
    const findMastery = (name: string) =>
      masteryList.find(
        (m) =>
          m.topic.toLowerCase() === name.toLowerCase() ||
          m.topic.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(m.topic.toLowerCase())
      );

    // 1. Prefer structured syllabus if user has parsed/saved one
    if (syllabus && syllabus.units.length > 0) {
      const built: ConceptNode[] = [];
      syllabus.units.forEach((unit) => {
        unit.topics.forEach((topic) => {
          const tm = findMastery(topic.name);
          const matchingTasks =
            activePlan?.tasks.filter((t) =>
              t.topic.toLowerCase().includes(topic.name.toLowerCase())
            ) || [];
          const completedTasks = matchingTasks.filter((t) => t.status === 'completed').length;
          const score = tm ? tm.score : matchingTasks.length > 0 ? Math.round((completedTasks / matchingTasks.length) * 100) : 0;

          built.push({
            id: topic.id,
            name: topic.name,
            unitLabel: `Unit ${unit.unitNumber} · ${unit.title}`,
            mastery: score,
            status: resolveNodeStatus(score, tm?.attemptsCount || 0, completedTasks, matchingTasks.length),
            dependencies: topic.dependencies || [],
            subtopics: topic.subtopics.map((st) => ({
              name: st,
              completed: matchingTasks.some(
                (mt) => mt.subtopic.toLowerCase().includes(st.toLowerCase()) && mt.status === 'completed'
              ),
            })),
          });
        });
      });
      if (built.length > 0) return built.slice(0, 8);
    }

    // 2. Otherwise build from activePlan topics + masteries
    if (activePlan && activePlan.topics.length > 0) {
      return activePlan.topics.slice(0, 8).map((topicName, idx) => {
        const tm = findMastery(topicName);
        const matchingTasks = activePlan.tasks.filter(
          (t) =>
            t.topic.toLowerCase().includes(topicName.toLowerCase()) ||
            topicName.toLowerCase().includes(t.topic.toLowerCase())
        );
        const completedTasks = matchingTasks.filter((t) => t.status === 'completed').length;
        const score = tm
          ? tm.score
          : matchingTasks.length > 0
          ? Math.round((completedTasks / matchingTasks.length) * 100)
          : 0;

        return {
          id: `plan-node-${idx}`,
          name: topicName,
          unitLabel: `${activePlan.subject} · Stage ${idx + 1}`,
          mastery: score,
          status: resolveNodeStatus(score, tm?.attemptsCount || 0, completedTasks, matchingTasks.length),
          dependencies: idx > 0 ? [activePlan.topics[idx - 1]] : [],
          subtopics: matchingTasks.slice(0, 4).map((t) => ({
            name: t.subtopic || t.learningObjective,
            completed: t.status === 'completed',
          })),
        };
      });
    }

    // 3. Otherwise build from assessed masteries alone if any exist
    if (masteryList.length > 0) {
      return masteryList.slice(0, 8).map((m, idx) => ({
        id: `mastery-node-${idx}`,
        name: m.topic,
        unitLabel: m.subject || 'Assessed Topic',
        mastery: m.score,
        status: resolveNodeStatus(m.score, m.attemptsCount, 0, 0),
        dependencies: idx > 0 ? [masteryList[idx - 1].topic] : [],
        subtopics: (Object.values(m.concepts || {}) as Array<{ name: string; score: number }>).map(
          (c) => ({
            name: c.name,
            completed: c.score >= 75,
          })
        ),
      }));
    }

    return [];
  }, [activePlan, syllabus, masteries]);

  const activeNodes = realNodes.length > 0 ? realNodes : showSamplePreview ? SAMPLE_PREVIEW_NODES : [];
  const isShowingSample = realNodes.length === 0 && showSamplePreview;

  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (activeNodes.length > 0 && !activeNodes.some((n) => n.id === selectedId)) {
      setSelectedId(activeNodes[0].id);
    }
  }, [activeNodes, selectedId]);

  const selectedNode = activeNodes.find((n) => n.id === selectedId) || activeNodes[0] || null;

  const statusMeta: Record<
    ConceptNode['status'],
    { label: string; tone: 'lime' | 'teal' | 'amber' | 'neutral'; ring: string }
  > = {
    mastered: {
      label: 'Mastered',
      tone: 'lime',
      ring: 'border-lime-500/60 dark:border-lime-400/50',
    },
    in_progress: {
      label: 'In progress',
      tone: 'teal',
      ring: 'border-teal-500/60 dark:border-teal-400/50',
    },
    needs_practice: {
      label: 'Needs practice',
      tone: 'amber',
      ring: 'border-amber-500/60 dark:border-amber-400/50',
    },
    not_started: {
      label: 'Not started',
      tone: 'neutral',
      ring: 'border-[#E5E1D6] dark:border-[#1E2F47]',
    },
  };

  return (
    <section
      aria-labelledby="learning-map-heading"
      className="bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 id="learning-map-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Interactive Learning Map
            </h2>
            {isShowingSample && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                Sample Preview
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a concept node to inspect prerequisite links, subtopics, and launch explanations or practice.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {realNodes.length === 0 && showSamplePreview && (
            <button
              type="button"
              onClick={() => setShowSamplePreview(false)}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
            >
              Hide sample preview
            </button>
          )}
          <Link
            to="/progress"
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>Mastery Breakdown</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {activeNodes.length === 0 ? (
        <div className="py-10 px-4 text-center space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#EFECE3] dark:bg-[#16263D] text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Your Concept Map Builds Automatically
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate a study plan or parse a syllabus to map out topics, prerequisite connections, and live mastery across your subjects.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              to="/planner"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
            >
              Create Study Plan
            </Link>
            <button
              type="button"
              onClick={() => setShowSamplePreview(true)}
              className="px-4 py-2 rounded-xl bg-[#F7F5EF] dark:bg-[#16263D] hover:bg-[#EFECE3] dark:hover:bg-[#1E2F47] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Preview Sample CS Map</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Connected Concept Node Graph */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
              {activeNodes.map((node, index) => {
                const isSelected = selectedNode?.id === node.id;
                const isPrerequisiteOfSelected = selectedNode?.dependencies.some(
                  (dep) => dep.toLowerCase() === node.name.toLowerCase()
                );
                const meta = statusMeta[node.status];

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    aria-pressed={isSelected}
                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#0A1628] text-white border-teal-500 shadow-md ring-2 ring-teal-500/25'
                        : isPrerequisiteOfSelected
                        ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-400/70 dark:border-teal-600/60'
                        : `bg-[#F7F5EF]/50 dark:bg-[#16263D]/60 hover:bg-[#EFECE3]/70 dark:hover:bg-[#16263D] ${meta.ring}`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider truncate ${
                          isSelected ? 'text-teal-300' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')} · {node.unitLabel}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {node.mastery}%
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold leading-snug mb-2.5 ${
                        isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {node.name}
                    </h3>

                    <div className="flex items-center justify-between gap-2">
                      <StatusIndicator
                        label={meta.label}
                        tone={meta.tone}
                        className={isSelected ? 'text-slate-200' : undefined}
                      />
                      {node.dependencies.length > 0 && (
                        <span
                          className={`text-[10px] font-mono truncate max-w-[120px] ${
                            isSelected ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          ← {node.dependencies[0]}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Concept Inspector */}
          {selectedNode && (
            <div className="lg:col-span-5 rounded-xl bg-[#F7F5EF]/80 dark:bg-[#0A1628] border border-[#E5E1D6] dark:border-[#1E2F47] p-5 space-y-4">
              <div className="space-y-1 border-b border-[#E5E1D6] dark:border-[#1E2F47] pb-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                  Selected Concept
                </span>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedNode.name}
                  </h3>
                  <StatusIndicator
                    label={statusMeta[selectedNode.status].label}
                    tone={statusMeta[selectedNode.status].tone}
                  />
                </div>
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    <span>Concept Readiness</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                      {selectedNode.mastery}%
                    </span>
                  </div>
                  <ProgressMeter
                    value={selectedNode.mastery}
                    tone={
                      selectedNode.status === 'mastered'
                        ? 'lime'
                        : selectedNode.status === 'needs_practice'
                        ? 'amber'
                        : 'teal'
                    }
                  />
                </div>
              </div>

              {/* Prerequisites */}
              {selectedNode.dependencies.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Prerequisite Connections
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.dependencies.map((dep) => {
                      const target = activeNodes.find(
                        (n) => n.name.toLowerCase() === dep.toLowerCase()
                      );
                      return target ? (
                        <button
                          key={dep}
                          type="button"
                          onClick={() => setSelectedId(target.id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] text-teal-700 dark:text-teal-300 hover:border-teal-500 transition-colors cursor-pointer"
                        >
                          &larr; {dep}
                        </button>
                      ) : (
                        <span
                          key={dep}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-600 dark:text-slate-400"
                        >
                          {dep}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subtopics */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Subtopics ({selectedNode.subtopics.length})
                </span>
                {selectedNode.subtopics.length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedNode.subtopics.map((st) => (
                      <li
                        key={st.name}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                      >
                        {st.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        ) : selectedNode.status === 'needs_practice' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{st.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Open AI Explainer or take a quick diagnostic quiz to break down subtopics.
                  </p>
                )}
              </div>

              {/* Direct Learning Actions */}
              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  to={`/explain?topic=${encodeURIComponent(selectedNode.name)}`}
                  className="flex-1 min-w-[130px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explain Concept</span>
                </Link>
                <Link
                  to={`/quiz?topic=${encodeURIComponent(selectedNode.name)}`}
                  className="flex-1 min-w-[130px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1D32] hover:bg-[#EFECE3] dark:hover:bg-[#16263D] border border-[#E5E1D6] dark:border-[#1E2F47] text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Practice Quiz</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

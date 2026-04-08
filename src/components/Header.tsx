import {
  LayoutGrid,
  Plus,
  Search,
  Users,
  ChevronDown,
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { BoardStats, Priority } from '../types';
import { isAfter, parseISO, startOfToday } from 'date-fns';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  labelFilter: string;
  onLabelChange: (v: string) => void;
  onToggleTeamPanel: () => void;
  showTeamPanel: boolean;
  onAddTask: () => void;
}

function computeStats(tasks: ReturnType<typeof useBoard>['tasks']): BoardStats {
  const today = startOfToday();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter(
    (t) =>
      t.due_date &&
      t.status !== 'done' &&
      isAfter(today, parseISO(t.due_date))
  ).length;
  return { total, completed, overdue };
}

const PRIORITIES: { value: Priority | ''; label: string }[] = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export function Header({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  labelFilter,
  onLabelChange,
  onToggleTeamPanel,
  showTeamPanel,
  onAddTask,
}: HeaderProps) {
  const { tasks, labels } = useBoard();
  const stats = computeStats(tasks);

  return (
    <header className="h-14 bg-[#111111] border-b border-[#2a2a2a] flex items-center px-4 gap-3 z-30 relative flex-shrink-0">
      {/* Logo / Title */}
      <div className="flex items-center gap-2 mr-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <LayoutGrid size={15} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white hidden sm:block">Board</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#2a2a2a] flex-shrink-0 hidden sm:block" />

      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]"
        />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[#f5f5f5] placeholder-[#555] focus:outline-none focus:border-indigo-600 transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Priority filter */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="appearance-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 pr-7 text-sm text-[#888] focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer hover:border-[#333]"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none"
          />
        </div>

        {/* Label filter */}
        <div className="relative">
          <select
            value={labelFilter}
            onChange={(e) => onLabelChange(e.target.value)}
            className="appearance-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 pr-7 text-sm text-[#888] focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer hover:border-[#333]"
          >
            <option value="">All Labels</option>
            {labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats */}
      <div className="hidden md:flex items-center gap-1 text-xs text-[#555] flex-shrink-0">
        <span className="text-[#888]">{stats.total} tasks</span>
        <span className="mx-1">·</span>
        <span className="text-[#22c55e]">{stats.completed} done</span>
        {stats.overdue > 0 && (
          <>
            <span className="mx-1">·</span>
            <span className="text-[#ef4444]">{stats.overdue} overdue</span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#2a2a2a] flex-shrink-0 hidden md:block" />

      {/* Guest badge */}
      <span className="text-xs text-[#555] bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 flex-shrink-0 hidden sm:block">
        Guest Session
      </span>

      {/* New Task button */}
      <button
        onClick={onAddTask}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex-shrink-0"
      >
        <Plus size={14} />
        <span className="hidden sm:block">New Task</span>
      </button>

      {/* Team button */}
      <button
        onClick={onToggleTeamPanel}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors flex-shrink-0 ${
          showTeamPanel
            ? 'bg-indigo-600 text-white'
            : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#333]'
        }`}
      >
        <Users size={14} />
        <span className="hidden sm:block">Team</span>
      </button>
    </header>
  );
}

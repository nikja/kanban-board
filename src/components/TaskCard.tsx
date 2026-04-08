import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MessageSquare,
  GripVertical,
  CalendarClock,
  AlertCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import { Task } from '../types';
import { AvatarGroup } from './ui/Avatar';
import { format, isAfter, isBefore, addDays, parseISO, startOfToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick: (taskId: string) => void;
  isDragging?: boolean;
}

function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high':
      return '#ef4444';
    case 'normal':
      return '#6366f1';
    case 'low':
      return '#6b7280';
  }
}

function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  const color = getPriorityColor(priority);
  if (priority === 'high') return <ArrowUp size={12} style={{ color }} />;
  if (priority === 'low') return <ArrowDown size={12} style={{ color }} />;
  return <ArrowRight size={12} style={{ color }} />;
}

function DueDateBadge({ dueDate, isDone }: { dueDate: string; isDone: boolean }) {
  const today = startOfToday();
  const date = parseISO(dueDate);
  const isOverdue = !isDone && isAfter(today, date);
  const isSoon = !isDone && !isOverdue && isBefore(date, addDays(today, 4));

  if (isDone) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-[#555]">
        <CalendarClock size={10} />
        {format(date, 'MMM d')}
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 rounded px-1.5 py-0.5">
        <AlertCircle size={10} />
        {format(date, 'MMM d')}
      </span>
    );
  }

  if (isSoon) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/10 rounded px-1.5 py-0.5">
        <CalendarClock size={10} />
        {format(date, 'MMM d')}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[10px] text-[#888]">
      <CalendarClock size={10} />
      {format(date, 'MMM d')}
    </span>
  );
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.3 : 1,
    borderLeftColor: getPriorityColor(task.priority),
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || isSortDragging) return;
    e.stopPropagation();
    onClick(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative bg-[#222222] border border-[#2a2a2a] border-l-[3px] rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150
        ${isSortDragging ? 'drag-ghost shadow-2xl' : 'hover:bg-[#2a2a2a] hover:border-[#333] hover:shadow-lg'}`}
      onClick={handleClick}
    >
      {/* Drag handle (visual only) */}
      <div
        className="absolute top-2 right-2 text-[#333] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      >
        <GripVertical size={14} />
      </div>

      {/* Priority badge top-right (behind drag handle when visible) */}
      <div className="absolute top-2 right-6 opacity-0 group-hover:opacity-0 flex items-center">
        {/* Shows when not hovered (drag handle hidden) */}
      </div>

      {/* Header row: priority + title area */}
      <div className="flex items-start gap-1.5 mb-2 pr-5">
        <div className="mt-0.5 flex-shrink-0">
          <PriorityIcon priority={task.priority} />
        </div>
        <h3 className="text-sm font-medium text-[#f5f5f5] leading-snug line-clamp-2 flex-1">
          {task.title}
        </h3>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: label.color + '22',
                color: label.color,
                border: `1px solid ${label.color}44`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {/* Due date */}
          {task.due_date && (
            <DueDateBadge dueDate={task.due_date} isDone={task.status === 'done'} />
          )}

          {/* Comment count */}
          {task.comment_count !== undefined && task.comment_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#555]">
              <MessageSquare size={10} />
              {task.comment_count}
            </span>
          )}
        </div>

        {/* Assignee avatars */}
        {task.assignees.length > 0 && (
          <AvatarGroup members={task.assignees} max={3} size="sm" />
        )}
      </div>
    </div>
  );
}

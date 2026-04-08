import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Trash2,
  MessageSquare,
  Activity,
  ChevronDown,
  Send,
  Check,
  Tag,
  Users,
  Calendar,
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { ActivityEntry, Comment, Priority, Status } from '../types';
import { Avatar } from './ui/Avatar';
import { formatDistanceToNow, parseISO, isAfter, startOfToday, isBefore, addDays } from 'date-fns';

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: '#6b7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'in_review', label: 'In Review', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#22c55e' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'normal', label: 'Normal', color: '#6366f1' },
  { value: 'low', label: 'Low', color: '#6b7280' },
];

function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

function formatActionLabel(action: string, oldVal?: string, newVal?: string): string {
  switch (action) {
    case 'created':
      return `Task created`;
    case 'status_changed':
      return `Status changed from "${oldVal}" to "${newVal}"`;
    case 'updated_title':
      return `Title updated to "${newVal}"`;
    case 'updated_description':
      return `Description updated`;
    case 'updated_priority':
      return `Priority changed from "${oldVal}" to "${newVal}"`;
    case 'updated_due_date':
      return newVal ? `Due date set to ${newVal}` : 'Due date removed';
    case 'updated_assignees':
      return `Assignees updated: ${newVal}`;
    case 'updated_labels':
      return `Labels updated: ${newVal}`;
    default:
      return action.replace(/_/g, ' ');
  }
}

export function TaskModal({ taskId, onClose }: TaskModalProps) {
  const { tasks, teamMembers, labels, updateTask, deleteTask, getComments, addComment, getActivityLog, moveTask } =
    useBoard();

  const task = tasks.find((t) => t.id === taskId) || null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('todo');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(false);

  // Sync task data when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date || '');
    setAssigneeIds(task.assignees.map((a) => a.id));
    setLabelIds(task.labels.map((l) => l.id));
    mounted.current = true;
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load comments + activity when task opens
  useEffect(() => {
    if (!taskId) return;
    getComments(taskId).then(setComments);
    getActivityLog(taskId).then(setActivityLog);
  }, [taskId, getComments, getActivityLog]);

  const handleTitleBlur = useCallback(async () => {
    if (!task || title === task.title) return;
    if (!title.trim()) {
      setTitle(task.title);
      return;
    }
    await updateTask(task.id, { title: title.trim() });
  }, [task, title, updateTask]);

  const handleDescBlur = useCallback(async () => {
    if (!task || description === (task.description || '')) return;
    await updateTask(task.id, { description: description || undefined });
  }, [task, description, updateTask]);

  const handleStatusChange = useCallback(
    async (newStatus: Status) => {
      if (!task) return;
      setStatus(newStatus);
      await moveTask(task.id, newStatus);
    },
    [task, moveTask]
  );

  const handlePriorityChange = useCallback(
    async (newPriority: Priority) => {
      if (!task) return;
      setPriority(newPriority);
      await updateTask(task.id, { priority: newPriority });
    },
    [task, updateTask]
  );

  const handleDueDateChange = useCallback(
    async (newDate: string) => {
      if (!task) return;
      setDueDate(newDate);
      await updateTask(task.id, { due_date: newDate || undefined });
    },
    [task, updateTask]
  );

  const toggleAssignee = useCallback(
    async (memberId: string) => {
      if (!task) return;
      const newIds = assigneeIds.includes(memberId)
        ? assigneeIds.filter((id) => id !== memberId)
        : [...assigneeIds, memberId];
      setAssigneeIds(newIds);
      await updateTask(task.id, {}, newIds, undefined);
    },
    [task, assigneeIds, updateTask]
  );

  const toggleLabel = useCallback(
    async (labelId: string) => {
      if (!task) return;
      const newIds = labelIds.includes(labelId)
        ? labelIds.filter((id) => id !== labelId)
        : [...labelIds, labelId];
      setLabelIds(newIds);
      await updateTask(task.id, {}, undefined, newIds);
    },
    [task, labelIds, updateTask]
  );

  const handleSendComment = useCallback(async () => {
    if (!task || !newComment.trim() || sendingComment) return;
    setSendingComment(true);
    await addComment(task.id, newComment.trim());
    const updated = await getComments(task.id);
    setComments(updated);
    const updatedLog = await getActivityLog(task.id);
    setActivityLog(updatedLog);
    setNewComment('');
    setSendingComment(false);
  }, [task, newComment, sendingComment, addComment, getComments, getActivityLog]);

  const handleDelete = useCallback(async () => {
    if (!task) return;
    setDeleting(true);
    await deleteTask(task.id);
    onClose();
  }, [task, deleteTask, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (taskId) {
      // Refresh activity after any update
      getActivityLog(taskId).then(setActivityLog);
    }
  }, [task?.updated_at, taskId, getActivityLog]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!taskId) return null;

  const today = startOfToday();
  const dueDateIsOverdue =
    task?.due_date && task.status !== 'done' && isAfter(today, parseISO(task.due_date));
  const dueDateIsSoon =
    task?.due_date &&
    task.status !== 'done' &&
    !dueDateIsOverdue &&
    isBefore(parseISO(task.due_date), addDays(today, 4));

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status);
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === priority);

  const panel = (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Dropdown dismiss overlay — sits above backdrop but below panel content */}
      {(statusOpen || priorityOpen) && (
        <div
          className="absolute inset-0 z-10"
          onClick={() => { setStatusOpen(false); setPriorityOpen(false); }}
        />
      )}

      {/* Slide-over panel */}
      <div className="relative z-20 w-full max-w-[520px] h-full bg-[#111111] border-l border-[#2a2a2a] flex flex-col animate-slideIn overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Status pill */}
            <div className="relative">
              <button
                onClick={() => { setStatusOpen((v) => !v); setPriorityOpen(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                style={{
                  backgroundColor: (currentStatus?.color || '#6b7280') + '22',
                  color: currentStatus?.color || '#6b7280',
                  borderColor: (currentStatus?.color || '#6b7280') + '55',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: currentStatus?.color }}
                />
                {currentStatus?.label}
                <ChevronDown size={10} />
              </button>
              {/* Status dropdown */}
              {statusOpen && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-20 py-1">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { handleStatusChange(s.value); setStatusOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/5 transition-colors"
                      style={{ color: status === s.value ? s.color : '#888' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                      {status === s.value && <Check size={10} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Delete button */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#888] mr-1">Confirm?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 text-xs text-[#555] hover:text-[#888] rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#555] hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Title */}
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full bg-transparent text-lg font-semibold text-white focus:outline-none border-b border-transparent focus:border-[#333] pb-1 transition-colors"
              placeholder="Task title"
            />

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-[#555] block mb-1.5">Priority</label>
                <div className="relative inline-block w-full">
                  <button
                    onClick={() => { setPriorityOpen((v) => !v); setStatusOpen(false); }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: (currentPriority?.color || '#6366f1') + '22',
                      color: currentPriority?.color || '#6366f1',
                      borderColor: (currentPriority?.color || '#6366f1') + '55',
                    }}
                  >
                    {currentPriority?.label}
                    <ChevronDown size={10} className="ml-auto" />
                  </button>
                  {priorityOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-20 py-1">
                      {PRIORITY_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => { handlePriorityChange(p.value); setPriorityOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-white/5"
                          style={{ color: priority === p.value ? p.color : '#888' }}
                        >
                          {p.label}
                          {priority === p.value && <Check size={10} className="ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-[#555] mb-1.5">
                  <Calendar size={11} />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className={`w-full bg-[#1a1a1a] border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600 transition-colors ${
                    dueDateIsOverdue
                      ? 'border-red-500/50 text-red-400'
                      : dueDateIsSoon
                      ? 'border-yellow-500/50 text-yellow-400'
                      : 'border-[#2a2a2a] text-white'
                  }`}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-[#555] block mb-1.5">Description</label>
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a description..."
                rows={4}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-indigo-600 transition-colors resize-none"
              />
            </div>

            {/* Assignees */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#555] mb-2">
                <Users size={11} />
                Assignees
              </label>
              {teamMembers.length === 0 ? (
                <p className="text-xs text-[#555]">No team members yet. Add some via the Team panel.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((member) => {
                    const isSelected = assigneeIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleAssignee(member.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'border-indigo-600/60 bg-indigo-600/15 text-white'
                            : 'border-[#2a2a2a] text-[#888] hover:border-[#333] hover:text-white'
                        }`}
                      >
                        <Avatar member={member} size="sm" showTooltip={false} />
                        {member.name}
                        {isSelected && <Check size={10} className="text-indigo-400 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Labels */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#555] mb-2">
                <Tag size={11} />
                Labels
              </label>
              {labels.length === 0 ? (
                <p className="text-xs text-[#555]">No labels yet. Add some via the Team panel.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => {
                    const isSelected = labelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          !isSelected && 'opacity-40 hover:opacity-70'
                        }`}
                        style={{
                          backgroundColor: isSelected ? label.color + '25' : 'transparent',
                          color: label.color,
                          borderColor: label.color + (isSelected ? '66' : '33'),
                        }}
                      >
                        {label.name}
                        {isSelected && <Check size={9} className="ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[#2a2a2a]" />

            {/* Tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'bg-white/10 text-white'
                    : 'text-[#555] hover:text-[#888] hover:bg-white/5'
                }`}
              >
                <MessageSquare size={12} />
                Comments
                {comments.length > 0 && (
                  <span className="bg-indigo-600/30 text-indigo-300 rounded-full px-1.5 py-0.5 text-[10px]">
                    {comments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'activity'
                    ? 'bg-white/10 text-white'
                    : 'text-[#555] hover:text-[#888] hover:bg-white/5'
                }`}
              >
                <Activity size={12} />
                Activity
              </button>
            </div>

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-3">
                {/* Comment input */}
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-indigo-600 transition-colors resize-none"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!newComment.trim() || sendingComment}
                    className="self-end w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                    title="Send (Ctrl+Enter)"
                  >
                    {sendingComment ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                  </button>
                </div>

                {/* Comment list */}
                {comments.length === 0 ? (
                  <p className="text-xs text-[#555] py-2">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-[#1a1a1a] rounded-lg px-3 py-2.5 border border-[#2a2a2a]"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[#888]">You</span>
                          <span className="text-[10px] text-[#555]">
                            {formatRelative(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-[#f5f5f5] leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-2">
                {activityLog.length === 0 ? (
                  <p className="text-xs text-[#555] py-2">No activity yet.</p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-[#2a2a2a]" />
                    <div className="space-y-3 pl-7">
                      {activityLog.map((entry) => (
                        <div key={entry.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-[#333] border border-[#555]" />
                          <p className="text-xs text-[#888] leading-relaxed">
                            {formatActionLabel(entry.action, entry.old_value, entry.new_value)}
                          </p>
                          <p className="text-[10px] text-[#555] mt-0.5">
                            {formatRelative(entry.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

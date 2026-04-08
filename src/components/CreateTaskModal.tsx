import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useBoard } from '../context/BoardContext';
import { CreateTaskInput, Priority, Status } from '../types';
import { Avatar } from './ui/Avatar';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultStatus: Status;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'normal', label: 'Normal', color: '#6366f1' },
  { value: 'low', label: 'Low', color: '#6b7280' },
];

export function CreateTaskModal({ open, onClose, defaultStatus }: CreateTaskModalProps) {
  const { createTask, teamMembers, labels } = useBoard();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('normal');
      setDueDate('');
      setSelectedAssignees([]);
      setSelectedLabels([]);
      setError('');
    }
  }, [open, defaultStatus]);

  const toggleAssignee = (id: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    const input: CreateTaskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      due_date: dueDate || undefined,
      assignee_ids: selectedAssignees,
      label_ids: selectedLabels,
    };

    try {
      const success = await createTask(input);
      if (success) {
        onClose();
      } else {
        setError('Failed to create task. Check your Supabase connection and schema.');
      }
    } catch (err) {
      console.error('Unexpected error creating task:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-full max-w-lg"
    >
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-white">Create Task</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#555] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-indigo-600 transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-indigo-600 transition-colors resize-none"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full appearance-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 pr-7 text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Priority</label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                      priority === p.value
                        ? 'border-transparent text-white'
                        : 'border-[#2a2a2a] text-[#555] hover:border-[#333] hover:text-[#888]'
                    }`}
                    style={
                      priority === p.value
                        ? { backgroundColor: p.color + '33', color: p.color, borderColor: p.color + '55' }
                        : {}
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* Assignees */}
          {teamMembers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => {
                  const selected = selectedAssignees.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-all ${
                        selected
                          ? 'border-indigo-600 bg-indigo-600/20 text-white'
                          : 'border-[#2a2a2a] text-[#888] hover:border-[#333] hover:text-white'
                      }`}
                    >
                      <Avatar member={member} size="sm" showTooltip={false} />
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Labels</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => {
                  const selected = selectedLabels.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        selected ? '' : 'opacity-50 hover:opacity-75'
                      }`}
                      style={{
                        backgroundColor: selected ? label.color + '33' : 'transparent',
                        color: label.color,
                        borderColor: label.color + (selected ? '88' : '44'),
                      }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#888] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

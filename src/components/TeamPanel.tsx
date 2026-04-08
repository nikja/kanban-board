import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Check } from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { Avatar } from './ui/Avatar';

interface TeamPanelProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#f97316',
];

const LABEL_PRESET_COLORS = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#f97316',
  '#64748b',
];

export function TeamPanel({ onClose }: TeamPanelProps) {
  const { teamMembers, labels, addTeamMember, removeTeamMember, createLabel, deleteLabel } =
    useBoard();

  const [memberName, setMemberName] = useState('');
  const [memberColor, setMemberColor] = useState(PRESET_COLORS[0]);
  const [addingMember, setAddingMember] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<string | null>(null);

  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_PRESET_COLORS[0]);
  const [addingLabel, setAddingLabel] = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [confirmDeleteLabel, setConfirmDeleteLabel] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    setAddingMember(true);
    await addTeamMember(memberName.trim(), memberColor);
    setMemberName('');
    setMemberColor(PRESET_COLORS[0]);
    setAddingMember(false);
    setShowMemberForm(false);
  };

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelName.trim()) return;
    setAddingLabel(true);
    await createLabel(labelName.trim(), labelColor);
    setLabelName('');
    setLabelColor(LABEL_PRESET_COLORS[0]);
    setAddingLabel(false);
    setShowLabelForm(false);
  };

  // Compute preview initials
  const previewInitials = memberName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="w-[280px] flex-shrink-0 bg-[#111111] border-l border-[#2a2a2a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2a2a2a] flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">Team & Labels</h2>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#555] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Team Members Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider">
              Team Members
            </h3>
            <button
              onClick={() => setShowMemberForm((v) => !v)}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                showMemberForm
                  ? 'bg-indigo-600/30 text-indigo-400'
                  : 'text-[#555] hover:text-[#888] hover:bg-white/5'
              }`}
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Add member form */}
          {showMemberForm && (
            <form
              onSubmit={handleAddMember}
              className="mb-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg space-y-3"
            >
              {/* Preview */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: memberColor }}
                >
                  {previewInitials}
                </div>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Member name"
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#555] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Color picker */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setMemberColor(color)}
                    className="w-5 h-5 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: memberColor === color ? '#fff' : 'transparent',
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!memberName.trim() || addingMember}
                  className="flex-1 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMemberForm(false)}
                  className="px-3 py-1.5 text-xs text-[#555] hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Member list */}
          {teamMembers.length === 0 ? (
            <p className="text-xs text-[#555] py-1">No team members yet.</p>
          ) : (
            <div className="space-y-1">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] group transition-colors"
                >
                  <Avatar member={member} size="md" showTooltip={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-[#555]">{member.initials}</p>
                  </div>

                  {confirmDeleteMember === member.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => removeTeamMember(member.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 bg-red-500/10 rounded"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmDeleteMember(null)}
                        className="text-[10px] text-[#555] hover:text-[#888] px-1.5 py-0.5"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteMember(member.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-[#333] group-hover:text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Labels Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider">Labels</h3>
            <button
              onClick={() => setShowLabelForm((v) => !v)}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                showLabelForm
                  ? 'bg-purple-600/30 text-purple-400'
                  : 'text-[#555] hover:text-[#888] hover:bg-white/5'
              }`}
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Add label form */}
          {showLabelForm && (
            <form
              onSubmit={handleAddLabel}
              className="mb-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg space-y-3"
            >
              {/* Preview */}
              <div className="flex items-center gap-2">
                <Tag size={14} style={{ color: labelColor }} className="flex-shrink-0" />
                <input
                  type="text"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  placeholder="Label name"
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#555] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Color picker */}
              <div className="flex flex-wrap gap-1.5">
                {LABEL_PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setLabelColor(color)}
                    className="w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
                    style={{
                      backgroundColor: color,
                      borderColor: labelColor === color ? '#fff' : 'transparent',
                    }}
                  >
                    {labelColor === color && (
                      <Check size={10} className="text-white" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!labelName.trim() || addingLabel}
                  className="flex-1 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  {addingLabel ? 'Creating...' : 'Create Label'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLabelForm(false)}
                  className="px-3 py-1.5 text-xs text-[#555] hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Label list */}
          {labels.length === 0 ? (
            <p className="text-xs text-[#555] py-1">No labels yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                  style={{
                    backgroundColor: label.color + '1a',
                    color: label.color,
                    borderColor: label.color + '44',
                  }}
                >
                  {label.name}
                  {confirmDeleteLabel === label.id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => deleteLabel(label.id)}
                        className="text-red-400 hover:text-red-300 text-[10px]"
                        title="Confirm delete"
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => setConfirmDeleteLabel(null)}
                        className="text-[#555] hover:text-[#888] text-[10px]"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteLabel(label.id)}
                      className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity ml-0.5"
                      style={{ color: label.color }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

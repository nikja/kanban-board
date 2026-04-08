import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, ColumnDef } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnDef;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

function EmptyState({ color }: { color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed opacity-40"
      style={{ borderColor: color + '44' }}
    >
      <div
        className="w-8 h-8 rounded-full mb-2 opacity-30"
        style={{ backgroundColor: color }}
      />
      <p className="text-xs text-[#555] text-center">No tasks here</p>
    </div>
  );
}

export function Column({ column, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col flex-1 min-w-[220px]">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: column.color }}
        />
        <span className="text-sm font-semibold text-[#f5f5f5]">{column.title}</span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded-md"
          style={{
            backgroundColor: column.color + '22',
            color: column.color,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 rounded-xl p-2 min-h-[200px] transition-all duration-150 ${
          isOver
            ? 'ring-2 ring-inset bg-white/[0.03]'
            : 'bg-[#1a1a1a]'
        }`}
        style={
          isOver
            ? ({ '--ring-color': column.color } as React.CSSProperties)
            : {}
        }
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState color={column.color} />
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import { Task, Status, ColumnDef } from '../types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { useBoard } from '../context/BoardContext';

export const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do', color: '#6b7280', bgColor: '#6b728022' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6', bgColor: '#3b82f622' },
  { id: 'in_review', title: 'In Review', color: '#f59e0b', bgColor: '#f59e0b22' },
  { id: 'done', title: 'Done', color: '#22c55e', bgColor: '#22c55e22' },
];

const COLUMN_IDS: Status[] = COLUMNS.map((c) => c.id);

interface BoardProps {
  searchQuery: string;
  priorityFilter: string;
  labelFilter: string;
  onTaskClick: (taskId: string) => void;
}

export function Board({
  searchQuery,
  priorityFilter,
  labelFilter,
  onTaskClick,
}: BoardProps) {
  const { tasks, moveTask } = useBoard();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    // If the pointer is inside a droppable (e.g. an empty column), use that
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    // Otherwise fall back to closest center (handles dragging near column edges)
    return closestCenter(args);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(q)) return false;
    }
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (labelFilter && !task.labels.some((l) => l.id === labelFilter)) return false;
    return true;
  });

  const getColumnTasks = (status: Status): Task[] =>
    filteredTasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    // Determine target status
    let targetStatus: Status;
    if (COLUMN_IDS.includes(overId as Status)) {
      targetStatus = overId as Status;
    } else {
      // over is another task - find its column
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
    }

    // Determine new position
    const targetColumnTasks = tasks
      .filter((t) => t.status === targetStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    let newPosition = 0;

    if (COLUMN_IDS.includes(overId as Status)) {
      // Dropped onto column directly - put at end
      newPosition =
        targetColumnTasks.length > 0
          ? Math.max(...targetColumnTasks.map((t) => t.position)) + 1
          : 0;
    } else {
      // Dropped onto another task
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newPosition = overTask.position;
      }
    }

    if (draggedTask.status !== targetStatus || draggedTask.position !== newPosition) {
      moveTask(taskId, targetStatus, newPosition);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 p-5 overflow-x-auto flex-1 min-h-0">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={getColumnTasks(column.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask ? (
          <div className="rotate-1 shadow-2xl">
            <TaskCard
              task={activeTask}
              onClick={() => {}}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

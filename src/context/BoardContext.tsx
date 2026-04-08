import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  ActivityEntry,
  Comment,
  CreateTaskInput,
  Label,
  Status,
  Task,
  TeamMember,
} from '../types';

const COLUMN_LABELS: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

interface BoardContextValue {
  tasks: Task[];
  teamMembers: TeamMember[];
  labels: Label[];
  loading: boolean;
  createTask: (input: CreateTaskInput) => Promise<boolean>;
  updateTask: (
    taskId: string,
    updates: Partial<Task>,
    assigneeIds?: string[],
    labelIds?: string[]
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: Status, newPosition?: number) => Promise<void>;
  addTeamMember: (name: string, color: string) => Promise<void>;
  removeTeamMember: (memberId: string) => Promise<void>;
  createLabel: (name: string, color: string) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
  getComments: (taskId: string) => Promise<Comment[]>;
  addComment: (taskId: string, content: string) => Promise<void>;
  getActivityLog: (taskId: string) => Promise<ActivityEntry[]>;
  refreshTasks: () => Promise<void>;
}

const BoardContext = createContext<BoardContextValue | null>(null);

interface BoardProviderProps {
  userId: string;
  children: React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoard must be used within BoardProvider');
  return ctx;
}

export function BoardProvider({ userId, children }: BoardProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        task_assignees(member_id, team_members(*)),
        task_labels(label_id, labels(*))
      `
      )
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    // Count comments per task
    const taskIds = (data || []).map((t: Record<string, unknown>) => t.id as string);
    let commentCounts: Record<string, number> = {};
    if (taskIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('task_id')
        .in('task_id', taskIds);
      if (commentsData) {
        commentCounts = commentsData.reduce(
          (acc: Record<string, number>, c: { task_id: string }) => {
            acc[c.task_id] = (acc[c.task_id] || 0) + 1;
            return acc;
          },
          {}
        );
      }
    }

    const normalized: Task[] = (data || []).map((row: Record<string, unknown>) => {
      const assigneesRaw = (row.task_assignees as Array<{ team_members: TeamMember }>) || [];
      const labelsRaw = (row.task_labels as Array<{ labels: Label }>) || [];

      return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string | undefined,
        status: row.status as Status,
        priority: row.priority as Task['priority'],
        due_date: row.due_date as string | undefined,
        user_id: row.user_id as string,
        position: row.position as number,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        assignees: assigneesRaw.map((a) => a.team_members).filter(Boolean),
        labels: labelsRaw.map((l) => l.labels).filter(Boolean),
        comment_count: commentCounts[row.id as string] || 0,
      };
    });

    setTasks(normalized);
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching team members:', error);
      return;
    }
    setTeamMembers(data || []);
  }, []);

  const fetchLabels = useCallback(async () => {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching labels:', error);
      return;
    }
    setLabels(data || []);
  }, []);

  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchTeamMembers(), fetchLabels()]);
      setLoading(false);
    };
    init();
  }, [fetchTasks, fetchTeamMembers, fetchLabels]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('board-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignees' },
        () => {
          fetchTasks();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_labels' },
        () => {
          fetchTasks();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      // Calculate position: max position in target column + 1
      const colTasks = tasks.filter((t) => t.status === input.status);
      const maxPos = colTasks.length > 0 ? Math.max(...colTasks.map((t) => t.position)) + 1 : 0;

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: input.title,
          description: input.description || null,
          status: input.status,
          priority: input.priority,
          due_date: input.due_date || null,
          user_id: userId,
          position: maxPos,
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating task:', error);
        return false;
      }

      // Insert assignees
      if (input.assignee_ids && input.assignee_ids.length > 0) {
        await supabase.from('task_assignees').insert(
          input.assignee_ids.map((mid) => ({
            task_id: data.id,
            member_id: mid,
          }))
        );
      }

      // Insert labels
      if (input.label_ids && input.label_ids.length > 0) {
        await supabase.from('task_labels').insert(
          input.label_ids.map((lid) => ({
            task_id: data.id,
            label_id: lid,
          }))
        );
      }

      // Log creation activity
      await supabase.from('activity_log').insert({
        task_id: data.id,
        user_id: userId,
        action: 'created',
        new_value: input.title,
      });

      await fetchTasks();
      return true;
    },
    [tasks, userId, fetchTasks]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: Partial<Task>,
      assigneeIds?: string[],
      labelIds?: string[]
    ) => {
      const existing = tasks.find((t) => t.id === taskId);
      if (!existing) return;

      // Build db-safe update object (exclude relational fields)
      const dbUpdates: Record<string, unknown> = {};
      const loggableFields = ['title', 'description', 'priority', 'due_date'] as const;

      for (const key of loggableFields) {
        if (key in updates) {
          dbUpdates[key] = updates[key];
        }
      }

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('tasks')
          .update(dbUpdates)
          .eq('id', taskId);

        if (error) {
          console.error('Error updating task:', error);
          return;
        }

        // Log field changes
        for (const field of loggableFields) {
          if (field in updates && existing[field] !== updates[field]) {
            await supabase.from('activity_log').insert({
              task_id: taskId,
              user_id: userId,
              action: `updated_${field}`,
              old_value: String(existing[field] || ''),
              new_value: String(updates[field] || ''),
            });
          }
        }
      }

      // Handle assignees update
      if (assigneeIds !== undefined) {
        await supabase.from('task_assignees').delete().eq('task_id', taskId);
        if (assigneeIds.length > 0) {
          await supabase.from('task_assignees').insert(
            assigneeIds.map((mid) => ({ task_id: taskId, member_id: mid }))
          );
        }

        // Log assignee changes
        const oldIds = existing.assignees.map((a) => a.id).sort().join(',');
        const newIds = [...assigneeIds].sort().join(',');
        if (oldIds !== newIds) {
          await supabase.from('activity_log').insert({
            task_id: taskId,
            user_id: userId,
            action: 'updated_assignees',
            old_value: existing.assignees.map((a) => a.name).join(', ') || 'None',
            new_value:
              teamMembers
                .filter((m) => assigneeIds.includes(m.id))
                .map((m) => m.name)
                .join(', ') || 'None',
          });
        }
      }

      // Handle labels update
      if (labelIds !== undefined) {
        await supabase.from('task_labels').delete().eq('task_id', taskId);
        if (labelIds.length > 0) {
          await supabase.from('task_labels').insert(
            labelIds.map((lid) => ({ task_id: taskId, label_id: lid }))
          );
        }

        // Log label changes
        const oldIds = existing.labels.map((l) => l.id).sort().join(',');
        const newIds = [...labelIds].sort().join(',');
        if (oldIds !== newIds) {
          await supabase.from('activity_log').insert({
            task_id: taskId,
            user_id: userId,
            action: 'updated_labels',
            old_value: existing.labels.map((l) => l.name).join(', ') || 'None',
            new_value:
              labels
                .filter((l) => labelIds.includes(l.id))
                .map((l) => l.name)
                .join(', ') || 'None',
          });
        }
      }

      await fetchTasks();
    },
    [tasks, userId, teamMembers, labels, fetchTasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        console.error('Error deleting task:', error);
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    []
  );

  const moveTask = useCallback(
    async (taskId: string, newStatus: Status, newPosition?: number) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const oldStatus = task.status;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus, position: newPosition ?? t.position }
            : t
        )
      );

      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, position: newPosition ?? task.position })
        .eq('id', taskId);

      if (error) {
        console.error('Error moving task:', error);
        // Revert
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: oldStatus, position: task.position } : t
          )
        );
        return;
      }

      if (oldStatus !== newStatus) {
        await supabase.from('activity_log').insert({
          task_id: taskId,
          user_id: userId,
          action: 'status_changed',
          old_value: COLUMN_LABELS[oldStatus],
          new_value: COLUMN_LABELS[newStatus],
        });
      }
    },
    [tasks, userId]
  );

  const addTeamMember = useCallback(
    async (name: string, color: string) => {
      const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const { error } = await supabase.from('team_members').insert({
        name,
        color,
        initials,
        user_id: userId,
      });

      if (error) {
        console.error('Error adding team member:', error);
        return;
      }
      await fetchTeamMembers();
    },
    [userId, fetchTeamMembers]
  );

  const removeTeamMember = useCallback(
    async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      if (error) {
        console.error('Error removing team member:', error);
        return;
      }
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      await fetchTasks();
    },
    [fetchTasks]
  );

  const createLabel = useCallback(
    async (name: string, color: string) => {
      const { error } = await supabase.from('labels').insert({
        name,
        color,
        user_id: userId,
      });
      if (error) {
        console.error('Error creating label:', error);
        return;
      }
      await fetchLabels();
    },
    [userId, fetchLabels]
  );

  const deleteLabel = useCallback(
    async (labelId: string) => {
      const { error } = await supabase.from('labels').delete().eq('id', labelId);
      if (error) {
        console.error('Error deleting label:', error);
        return;
      }
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      await fetchTasks();
    },
    [fetchTasks]
  );

  const getComments = useCallback(async (taskId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return data || [];
  }, []);

  const addComment = useCallback(
    async (taskId: string, content: string) => {
      const { error } = await supabase.from('comments').insert({
        task_id: taskId,
        content,
        user_id: userId,
      });
      if (error) {
        console.error('Error adding comment:', error);
      }
      await fetchTasks();
    },
    [userId, fetchTasks]
  );

  const getActivityLog = useCallback(
    async (taskId: string): Promise<ActivityEntry[]> => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity log:', error);
        return [];
      }
      return data || [];
    },
    []
  );

  return (
    <BoardContext.Provider
      value={{
        tasks,
        teamMembers,
        labels,
        loading,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        addTeamMember,
        removeTeamMember,
        createLabel,
        deleteLabel,
        getComments,
        addComment,
        getActivityLog,
        refreshTasks,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

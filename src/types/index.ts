export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';
export type Priority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  due_date?: string;
  user_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  assignees: TeamMember[];
  labels: Label[];
  comment_count?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  initials: string;
  user_id: string;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface ColumnDef {
  id: Status;
  title: string;
  color: string;
  bgColor: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  due_date?: string;
  assignee_ids?: string[];
  label_ids?: string[];
}

export interface BoardStats {
  total: number;
  completed: number;
  overdue: number;
}

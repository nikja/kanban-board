-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    due_date DATE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    initials TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Labels table
CREATE TABLE IF NOT EXISTS public.labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task assignees (many-to-many)
CREATE TABLE IF NOT EXISTS public.task_assignees (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, member_id)
);

-- Task labels (many-to-many)
CREATE TABLE IF NOT EXISTS public.task_labels (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can CRUD own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for team_members
CREATE POLICY "Users can CRUD own team members" ON public.team_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for labels
CREATE POLICY "Users can CRUD own labels" ON public.labels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for task_assignees
CREATE POLICY "Users can manage task assignees" ON public.task_assignees FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_assignees.task_id AND tasks.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_assignees.task_id AND tasks.user_id = auth.uid())
);

-- RLS Policies for task_labels
CREATE POLICY "Users can manage task labels" ON public.task_labels FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid())
);

-- RLS Policies for comments
CREATE POLICY "Users can manage task comments" ON public.comments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = comments.task_id AND tasks.user_id = auth.uid())
) WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = comments.task_id AND tasks.user_id = auth.uid())
);

-- RLS Policies for activity_log
CREATE POLICY "Users can view and create task activity" ON public.activity_log FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = activity_log.task_id AND tasks.user_id = auth.uid())
) WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = activity_log.task_id AND tasks.user_id = auth.uid())
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable anonymous sign-in in your Supabase project settings under Authentication > Providers > Anonymous Sign-in

import { useState } from 'react';
import { LayoutGrid, ExternalLink } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { BoardProvider } from './context/BoardContext';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { CreateTaskModal } from './components/CreateTaskModal';
import { TaskModal } from './components/TaskModal';
import { TeamPanel } from './components/TeamPanel';

// ────────────────────────────────────────────────────────────
// Loading screen
// ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
        <LayoutGrid size={20} className="text-white" />
      </div>
      <div className="w-6 h-6 border-2 border-[#333] border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm text-[#555]">Setting up your board...</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Setup screen (when env vars are missing)
// ────────────────────────────────────────────────────────────
function SetupScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Kanban Board Setup</h1>
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
          <p className="text-sm text-[#888]">
            To get started, you need to configure Supabase environment variables.
          </p>

          <div>
            <h2 className="text-sm font-semibold text-white mb-2">
              1. Create a Supabase project
            </h2>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              supabase.com <ExternalLink size={12} />
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-2">
              2. Enable Anonymous Sign-In
            </h2>
            <p className="text-xs text-[#888]">
              Go to Authentication → Providers → Anonymous Sign-In and enable it.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-2">
              3. Run the database schema
            </h2>
            <p className="text-xs text-[#888]">
              Go to SQL Editor and run the contents of{' '}
              <code className="text-indigo-400 bg-indigo-400/10 px-1 py-0.5 rounded">
                supabase/schema.sql
              </code>
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-2">
              4. Create{' '}
              <code className="text-indigo-400 bg-indigo-400/10 px-1 py-0.5 rounded">
                .env.local
              </code>
            </h2>
            <pre className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-xs text-[#888] overflow-x-auto">
              {`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
            <p className="text-xs text-[#555] mt-2">
              Find these in Supabase → Project Settings → API
            </p>
          </div>

          <div className="pt-2 border-t border-[#2a2a2a]">
            <p className="text-xs text-[#555]">
              After creating the file, restart the dev server with{' '}
              <code className="text-[#888]">npm run dev</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Board Shell (inside BoardProvider)
// ────────────────────────────────────────────────────────────
function BoardShell() {
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');

  const handleTaskClick = (taskId: string) => setSelectedTaskId(taskId);
  const handleCloseTask = () => setSelectedTaskId(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0a]">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        labelFilter={labelFilter}
        onLabelChange={setLabelFilter}
        onToggleTeamPanel={() => setShowTeamPanel((v) => !v)}
        showTeamPanel={showTeamPanel}
        onAddTask={() => setShowCreateTask(true)}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Board */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Board
            searchQuery={searchQuery}
            priorityFilter={priorityFilter}
            labelFilter={labelFilter}
            onTaskClick={handleTaskClick}
          />
        </div>

        {/* Team panel (inline side panel) */}
        {showTeamPanel && (
          <TeamPanel onClose={() => setShowTeamPanel(false)} />
        )}
      </div>

      {/* Create task modal */}
      {showCreateTask && (
        <CreateTaskModal
          open={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          defaultStatus="todo"
        />
      )}

      {/* Task detail modal (slide-over) */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={handleCloseTask}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// App root
// ────────────────────────────────────────────────────────────
function App() {
  const { user, loading } = useAuth();
  const hasEnv = !!import.meta.env.VITE_SUPABASE_URL;

  if (loading) return <LoadingScreen />;
  if (!hasEnv) return <SetupScreen />;
  if (!user) return <LoadingScreen />;

  return (
    <BoardProvider userId={user.id}>
      <BoardShell />
    </BoardProvider>
  );
}

export default App;

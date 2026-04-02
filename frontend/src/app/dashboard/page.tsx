'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { apiFetch, loadTokens, getAccessToken } from '@/lib/api';
import TaskModal from './task-modal';
import ProfileModal from './profile-modal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    loadTokens();
    if (!authLoading && !getAccessToken()) {
      router.push('/login');
    }
  }, [authLoading, router]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '10');
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    try {
      const res = await apiFetch(`/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setMeta(data.meta);
      }
    } catch {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    if (getAccessToken()) fetchTasks();
  }, [fetchTasks]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    const res = await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Task deleted');
      fetchTasks();
    } else {
      toast.error('Failed to delete task');
    }
  };

  const handleToggle = async (id: string) => {
    const res = await apiFetch(`/tasks/${id}/toggle`, { method: 'PATCH' });
    if (res.ok) {
      toast.success('Status toggled');
      fetchTasks();
    } else {
      toast.error('Failed to toggle status');
    }
  };

  const handleSave = async (data: any) => {
    if (editingTask) {
      const res = await apiFetch(`/tasks/${editingTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Task updated');
        setModalOpen(false);
        setEditingTask(null);
        fetchTasks();
      } else {
        toast.error('Failed to update task');
      }
    } else {
      const res = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Task created');
        setModalOpen(false);
        fetchTasks();
      } else {
        toast.error('Failed to create task');
      }
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {(user as any)?.profilePicture ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${(user as any).profilePicture}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-blue-600">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">
                {user?.name || user?.email}
              </span>
            </button>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button
            onClick={() => { setEditingTask(null); setModalOpen(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            + Add Task
          </button>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tasks found. Create one to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  task.status === 'completed' ? 'opacity-70' : ''
                }`}
              >
                {/* Toggle checkbox */}
                <button
                  onClick={() => handleToggle(task.id)}
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    task.status === 'completed'
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {task.status === 'completed' && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Task details */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-medium ${
                      task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 truncate">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setEditingTask(task); setModalOpen(true); }}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
          onSave={handleSave}
        />
      )}

      {/* Profile Modal */}
      {profileModalOpen && (
        <ProfileModal onClose={() => setProfileModalOpen(false)} />
      )}
    </div>
  );
}

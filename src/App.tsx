import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { api } from './services/api';
import type { JobResponse, CreateJobResponse } from './types/job';
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Key, Trash2 } from 'lucide-react';

const queryClient = new QueryClient();

function JobQueueDashboard() {
  const [token, setToken] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Test AI generation request');

  // ১. অ্যাপ লোড হলে LocalStorage থেকে টোকেন নেওয়া
  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // ২. টোকেন চেঞ্জ বা সেভ করা
  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    if (newToken.trim()) {
      localStorage.setItem('jwt_token', newToken.trim());
    } else {
      localStorage.removeItem('jwt_token');
    }
  };

  // ৩. টোকেন ডিলিট করা
  const clearToken = () => {
    setToken('');
    localStorage.removeItem('jwt_token');
  };

  // Job Create করার Mutation
  const createJobMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<CreateJobResponse>('/jobs', {
        type: 'a6-ai',
        payload: { prompt },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setActiveJobId(data.data.jobId);
    },
  });

  // Job Status Polling
  const { data: jobData, isLoading, isError, error } = useQuery({
    queryKey: ['job', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      const res = await api.get<JobResponse>(`/jobs/${activeJobId}`);
      return res.data.data;
    },
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      // Safe polling check
      const currentData = query.state.data;
      if (currentData?.status === 'completed' || currentData?.status === 'failed') {
        return false;
      }
      return 1000;
    },
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-indigo-400">Async Job Queue Manager</h1>
          <p className="text-slate-400 text-sm">Real-time status monitoring & task processing dashboard</p>
        </header>

        {/* Auth Section */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" /> JWT Authorization Token
            </label>
            
            {token && (
              <button
                onClick={clearToken}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear Token
              </button>
            )}
          </div>

          <input
            type="text"
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder="Paste Bearer Token here..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Submit Console */}
        <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Submit New Job</h2>
          
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Prompt / Payload</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => createJobMutation.mutate()}
            disabled={createJobMutation.isPending || !token}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm cursor-pointer"
          >
            {createJobMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Enqueue Job (`a6-ai`)
          </button>

          {createJobMutation.isError && (
            <p className="text-rose-400 text-xs">
              Error: {(createJobMutation.error as any)?.response?.data?.message || 'Failed to submit job'}
            </p>
          )}
        </div>

        {/* Live Status Card */}
        {activeJobId && (
          <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div>
                <span className="text-xs text-slate-400 block">Job ID</span>
                <span className="font-mono text-xs text-indigo-300">{activeJobId}</span>
              </div>

              <div>
                {jobData?.status === 'queued' && (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Queued
                  </span>
                )}
                {jobData?.status === 'processing' && (
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
                  </span>
                )}
                {jobData?.status === 'completed' && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
                {jobData?.status === 'failed' && (
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
              </div>
            </div>

            {isLoading && <p className="text-xs text-slate-400">Checking job status...</p>}
            {isError && (
              <p className="text-xs text-rose-400">
                {(error as any)?.response?.data?.message || 'Error fetching status'}
              </p>
            )}

            {jobData && (
              <div className="space-y-2">
                <span className="text-xs text-slate-400">Response Result:</span>
                <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                  {JSON.stringify(jobData.result || jobData.error || { message: "Waiting for worker processing..." }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JobQueueDashboard />
    </QueryClientProvider>
  );
}
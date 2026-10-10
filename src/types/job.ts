export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobData {
  jobId: string;
  type: string;
  status: JobStatus;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  result?: any;
  error?: any;
}

export interface JobResponse {
  success: boolean;
  data: JobData;
}

export interface CreateJobResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: JobStatus;
  };
}
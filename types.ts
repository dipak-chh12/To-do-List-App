
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  createdAt: number;
  targetDate: string; // YYYY-MM-DD format for easier grouping
  startTime?: string;
  endTime?: string;
  subtasks?: string[];
}

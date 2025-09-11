// types/task.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: "Low" | "Medium" | "High";
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  subject?: string; 
}
import { useState, useEffect, useCallback } from "react";
import type { Task } from "../types/task";


let globalTasks: Task[] = [];
let listeners: Array<() => void> = [];

const loadTasksFromStorage = (): Task[] => {
  try {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.error("Error loading tasks from localStorage:", error);
    return [];
  }
};

const saveTasksToStorage = (tasks: Task[]) => {
  try {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
  }
};

const broadcastChange = () => {
  listeners.forEach(listener => listener());
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(globalTasks);


  useEffect(() => {
    const loadedTasks = loadTasksFromStorage();
    globalTasks = loadedTasks;
    setTasks(loadedTasks);
    broadcastChange();
  }, []);

 
  useEffect(() => {
    saveTasksToStorage(globalTasks);
  }, [tasks]);

  
  useEffect(() => {
    const listener = () => setTasks([...globalTasks]);
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const addTask = useCallback((title: string, dueDate: string, description: string, priority: "High" | "Medium" | "Low", subject: string = "") => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      dueDate: dueDate || "",
      description: description || "",
      priority,
      subject: subject || "",
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    globalTasks = [...globalTasks, newTask];
    setTasks(globalTasks);
    broadcastChange();
  }, []);

  const deleteTask = useCallback((id: string) => {
    globalTasks = globalTasks.filter(task => task.id !== id);
    setTasks(globalTasks);
    broadcastChange();
  }, []);

  const toggleComplete = useCallback((id: string) => {
    globalTasks = globalTasks.map(task =>
      task.id === id ? { 
        ...task, 
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : undefined
      } : task
    );
    setTasks(globalTasks);
    broadcastChange();
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    globalTasks = globalTasks.map(task =>
      task.id === id ? { 
        ...task, 
        ...updates,
        dueDate: updates.dueDate || task.dueDate
      } : task
    );
    setTasks(globalTasks);
    broadcastChange();
  }, []);

  const reorderTasks = (taskIds: string[]) => {
  const newOrder = taskIds.map((id, index) => {
    const task = tasks.find(t => t.id === id);
    return task ? { ...task, order: index } : null;
  }).filter(Boolean) as Task[];
  
  setTasks(newOrder);
  localStorage.setItem('tasks', JSON.stringify(newOrder));
};

  return {
    tasks,
    addTask,
    deleteTask,
    toggleComplete,
    updateTask, 
    reorderTasks
  };
}
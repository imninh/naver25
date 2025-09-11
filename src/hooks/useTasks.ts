// hooks/useTasks.ts - Phiên bản tối ưu
import { useState, useEffect, useCallback } from "react";
import type { Task } from "../types/task";

// Biến toàn cục để đồng bộ state giữa các instances
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

  // Load tasks từ localStorage khi khởi tạo
  useEffect(() => {
    const loadedTasks = loadTasksFromStorage();
    globalTasks = loadedTasks;
    setTasks(loadedTasks);
    broadcastChange();
  }, []);

  // Lưu tasks vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    saveTasksToStorage(globalTasks);
  }, [tasks]);

  // Lắng nghe thay đổi từ các components khác
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

  return {
    tasks,
    addTask,
    deleteTask,
    toggleComplete,
    updateTask
  };
}
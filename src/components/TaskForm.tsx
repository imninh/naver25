import { useState } from "react";
import type { Task } from "../types/task";
import "../index.css";

interface Props {
  onAdd: (title: string, dueDate: string, description: string, priority: "High" | "Medium" | "Low", subject: string) => void;
  editingTask?: Task | null;
  onUpdate?: (task: Task) => void;
  onCancel?: () => void;
}

export default function TaskForm({ onAdd, editingTask, onUpdate, onCancel }: Props) {
  const [title, setTitle] = useState(editingTask?.title || "");
  const [dueDate, setDueDate] = useState(editingTask?.dueDate || "");
  const [description, setDescription] = useState(editingTask?.description || "");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">(editingTask?.priority || "Medium");
  const [subject, setSubject] = useState(editingTask?.subject || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask && onUpdate) {
      onUpdate({
        ...editingTask,
        title,
        dueDate,
        description,
        priority,
        subject
      });
    } else {
      onAdd(title, dueDate, description, priority, subject);
    }

    // Reset form only if not in edit mode
    if (!editingTask) {
      setTitle("");
      setDueDate("");
      setDescription("");
      setPriority("Medium");
      setSubject("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-grid">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="task-input title-input"
          placeholder="Enter task title"
          required
        />
        
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="task-input"
        />
        
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
          className="task-input"
        >
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="task-input"
          placeholder="Subject (optional)"
        />
        
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="task-input"
          placeholder="Description (optional)"
        />
        
        <div className="edit-buttons">
          {editingTask ? (
            <>
              <button type="submit" className="save-btn">
                💾 Save
              </button>
              <button type="button" className="cancel-btn" onClick={onCancel}>
                ❌ Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="add-task-btn">
              <span className="btn-icon">+</span>
              Add Task
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
import type { Task } from "../types/task";
import { parseISO, isPast, format } from "date-fns";
import "../index.css";

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onToggle, onDelete, onEdit }: Props) {
  const overdue = task.dueDate && !task.completed && isPast(parseISO(task.dueDate));

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "High": return "priority-badge high";
      case "Medium": return "priority-badge medium";
      case "Low": return "priority-badge low";
      default: return "priority-badge";
    }
  };

  const getStatusClass = () => {
    if (task.completed) return "status-badge completed";
    if (overdue) return "status-badge overdue";
    return "status-badge in-progress";
  };

  return (
    <div className={`task-item ${task.completed ? "completed" : ""}`}>
      <div className="task-main">
        <div className="task-checkbox">
          <input
            type="checkbox"
            id={`task-${task.id}`}
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />
          <label htmlFor={`task-${task.id}`}></label>
        </div>
        
        <div className="task-content">
          <div className="task-title-row">
            <span className={`task-title ${task.completed ? "completed" : ""}`}>
              {task.title}
            </span>
            <span className={getPriorityClass(task.priority)}>
              {task.priority}
            </span>
            <span className={getStatusClass()}>
              {task.completed ? "Completed" : overdue ? "Overdue" : "In Progress"}
            </span>
          </div>
          
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
          
          <div className="task-meta">
            {task.dueDate && (
              <span className="task-due-date">
                📅 {format(new Date(task.dueDate), "MMM dd, yyyy")}
              </span>
            )}
            {task.subject && (
              <span className="subject-badge">
                📚 {task.subject}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="task-actions">
        {onEdit && (
          <button 
            className="edit-btn"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            ✏️
          </button>
        )}
        <button 
          className="delete-btn"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
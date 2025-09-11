import React, { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../types/task";

export default function ListPage() {
  const { tasks, addTask, deleteTask, toggleComplete, updateTask } = useTasks();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "title">("date");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<"High" | "Medium" | "Low">("Medium");

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    let fullDueDate = "";
    if (dueDate) {
      if (dueTime) {
        const dateObj = new Date(`${dueDate}T${dueTime}:00`);
        fullDueDate = dateObj.toISOString();
      } else {
        const dateObj = new Date(`${dueDate}T23:59:59`);
        fullDueDate = dateObj.toISOString();
      }
    }
    
    addTask(title, fullDueDate, desc, priority, subject);
    setTitle("");
    setSubject("");
    setDueDate("");
    setDueTime("");
    setDesc("");
    setPriority("Medium");
  };

    const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle) return;
    
    let fullDueDate = editDueDate;
    if (editDueDate && editDueTime) {
      fullDueDate = `${editDueDate}T${editDueTime}`;
    } else if (editDueDate) {
      fullDueDate = `${editDueDate}T23:59:59`;
    }
    
    updateTask(editingTask.id, {
      title: editTitle,
      dueDate: fullDueDate,
      description: editDesc,
      priority: editPriority,
      subject: editSubject
    });
    
    setEditingTask(null);
  };

    const startEditing = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditSubject(task.subject || "");
    
    if (task.dueDate) {
      const dateObj = new Date(task.dueDate);
      const dateStr = dateObj.toISOString().split('T')[0];
      const timeStr = dateObj.toTimeString().substring(0, 5);
      
      setEditDueDate(dateStr);
      setEditDueTime(timeStr);
    } else {
      setEditDueDate("");
      setEditDueTime("");
    }
    
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
  };

  const cancelEditing = () => {
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "date") {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === "priority") {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const renderStatusBadge = (task: Task) => {
    if (task.completed) 
      return <span className="status-badge completed">Completed</span>;
    
    if (task.dueDate) {
      try {
        const dueDate = new Date(task.dueDate);
        if (!isNaN(dueDate.getTime()) && dueDate < new Date()) {
          return <span className="status-badge overdue">Overdue</span>;
        }
      } catch (error) {
        console.error("Error parsing due date:", error);
      }
    }
    
    return <span className="status-badge in-progress">In Progress</span>;
  };

  const renderPriorityBadge = (priority: string) => {
    if (priority === "High") 
      return <span className="priority-badge high">High</span>;
    if (priority === "Medium") 
      return <span className="priority-badge medium">Medium</span>;
    return <span className="priority-badge low">Low</span>;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Calculate stats for the header
  const activeTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const studyTasks = tasks.filter(t => 
    t.title.toLowerCase().includes('assignment') ||
    t.title.toLowerCase().includes('exam') ||
    t.title.toLowerCase().includes('homework') ||
    t.title.toLowerCase().includes('study') ||
    t.title.toLowerCase().includes('read') ||
    t.title.toLowerCase().includes('project')
  ).length;

  return (
    <div className="task-app">
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-brand">
              <div className="brand-logo">
                <span>📝</span> 
              </div>
              <div className="brand-text">
                <h1 className="brand-name">Tasks List</h1>
                <p className="brand-tagline">Manage your study tasks and assignments</p>
              </div>
            </div>
          </div>
        </header>

        <div className="controls-section">
          <div className="stats">
            <div className="stat">
              <span className="stat-number">{activeTasks}</span>
              <span className="stat-label">Active Tasks</span>
            </div>
            <div className="stat">
              <span className="stat-number">{completedTasks}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat">
              <span className="stat-number">{studyTasks}</span>
              <span className="stat-label">Study Tasks</span>
            </div>
          </div>
          
          <div className="controls-row">
            <div className="filters">
              <button 
                className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All
              </button>
              <button 
                className={`filter-btn ${activeFilter === "active" ? "active" : ""}`}
                onClick={() => setActiveFilter("active")}
              >
                Active
              </button>
              <button 
                className={`filter-btn ${activeFilter === "completed" ? "active" : ""}`}
                onClick={() => setActiveFilter("completed")}
              >
                Completed
              </button>
            </div>
            
            <div className="sort-control">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as "date" | "priority" | "title")}
                className="sort-select"
              >
                <option value="date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-grid">
          <input
            type="text"
            placeholder="What needs to be done? *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="task-input title-input"
            required
          />
          <input
            type="text"
            placeholder="Subject/Course (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
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
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="task-input"
            placeholder="Due date"
          />
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="task-input"
            placeholder="Time"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="add-task-btn">
            <span className="btn-icon">+</span> Add Task
          </button>
        </div>
      </form>

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="edit-task-modal">
            <div className="edit-task-content">
              <div className="modal-header">
                <h3>Edit Task</h3>
                <button onClick={cancelEditing} className="close-btn">&times;</button>
              </div>
              <form onSubmit={handleEditSubmit} className="task-form">
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Task title *"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="task-input title-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject/Course (optional)"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="task-input"
                  />
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="task-input"
                    placeholder="Due date"
                  />
                  <input
                    type="time"
                    value={editDueTime}
                    onChange={(e) => setEditDueTime(e.target.value)}
                    className="task-input"
                    placeholder="Time"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="task-input"
                  />
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as "High" | "Medium" | "Low")}
                    className="task-input"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <div className="edit-buttons">
                    <button type="submit" className="save-btn">
                      Save Changes
                    </button>
                    <button type="button" onClick={cancelEditing} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="task-list-container">
          <div className="list-header">
            <span>Tasks</span>
            <span>{filteredTasks.length} items</span>
          </div>

          <div className="task-list">
            {sortedTasks.length > 0 ? (
              sortedTasks.map((t) => (
                <div
                  key={t.id}
                  className={`task-item ${t.completed ? "completed" : ""}`}
                >
                  <div className="task-main">
                    <div className="task-checkbox">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleComplete(t.id)}
                        id={`task-${t.id}`}
                      />
                      <label htmlFor={`task-${t.id}`}></label>
                    </div>
                    <div className="task-content">
                      <div className="task-title-row">
                        <span className={`task-title ${t.completed ? "completed" : ""}`}>
                          {t.title}
                        </span>
                        <div className="task-priority">
                          {renderPriorityBadge(t.priority)}
                        </div>
                      </div>
                      {t.subject && (
                        <div className="task-subject">
                          <span className="subject-icon">📚</span>
                          {t.subject}
                        </div>
                      )}
                      {t.description && (
                        <p className="task-description">{t.description}</p>
                      )}
                      <div className="task-meta">
                        {t.dueDate && (
                          <div className="task-due-date">
                            <span className="calendar-icon">⏰</span>
                            {formatDateTime(t.dueDate)}
                          </div>
                        )}
                        <div className="task-status">
                          {renderStatusBadge(t)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="task-actions">
                    <button
                      onClick={() => startEditing(t)}
                      className="edit-btn"
                      title="Edit task"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13M18.4142 5.41421C18.7893 5.03914 19.298 4.82843 19.8284 4.82843C20.3588 4.82843 20.8675 5.03914 21.2426 5.41421C21.6177 5.78929 21.8284 6.298 21.8284 6.82843C21.8284 7.35885 21.6177 7.86757 21.2426 8.24264L12 17.4853L8 18L8.51472 14L18.4142 5.41421Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="delete-btn"
                      title="Delete task"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7L18.1326 19.142C18.0579 20.1891 17.187 21 16.1376 21H7.86244C6.81296 21 5.94208 20.1891 5.86745 19.142L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No tasks found</h3>
                <p>{
                  activeFilter === "completed" 
                    ? "You haven't completed any tasks yet." 
                    : activeFilter === "active"
                    ? "You're all caught up! No active tasks."
                    : "Add your first task to get started."
                }</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .task-app {
          min-height: 100vh;
          background: #F7FAFC;
        }
        
        .app-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .app-header {
          margin-bottom: 24px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #09C65B, #09C65B);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .brand-name {
          margin: 0;
          color: #2D3748;
          font-size: 28px;
          font-weight: 400;
        }
        
        .brand-tagline {
          margin: 4px 0 0 0;
          color: #718096;
          font-size: 14px;
          font-weight: 400;
        }
        
        .controls-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .stats {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
        }
        
        .stat {
          text-align: center;
          padding: 12px;
          background: #F7FAFC;
          border-radius: 8px;
          min-width: 80px;
        }
        
        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #09C65B;
        }
        
        .stat-label {
          font-size: 12px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .filters {
          display: flex;
          background: #F7FAFC;
          border-radius: 8px;
          padding: 4px;
        }
        
        .filter-btn {
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          color: #718096;
        }
        
        .filter-btn.active {
          background: white;
          color: #09C65B;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .sort-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .sort-control label {
          font-size: 14px;
          color: #718096;
        }
        
        .sort-select {
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 6px 12px;
          background: white;
          color: #2D3748;
        }
        
        .task-form {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }
        
        .task-input {
          padding: 10px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        
        .title-input {
          grid-column: 1 / 3;
        }
        
        .add-task-btn {
          background: #09C65B;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        
        .add-task-btn:hover {
          background: #07A84A;
        }
        
        .btn-icon {
          font-size: 18px;
        }
        
        .edit-task-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .edit-task-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #2D3748;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
        }
        
        .edit-buttons {
          grid-column: 1 / -1;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        
        .save-btn {
          background: #09C65B;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .cancel-btn {
          background: #E2E8F0;
          color: #718096;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .task-list-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #E2E8F0;
          background: #F7FAFC;
        }
        
        .list-header span:first-child {
          font-weight: 600;
          color: #2D3748;
        }
        
        .list-header span:last-child {
          font-size: 14px;
          color: #718096;
        }
        
        .task-list {
          max-height: 500px;
          overflow-y: auto;
        }
        
        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #E2E8F0;
          transition: background 0.2s;
        }
        
        .task-item:hover {
          background: #F7FAFC;
        }
        
        .task-item:last-child {
          border-bottom: none;
        }
        
        .task-item.completed {
          opacity: 0.7;
        }
        
        .task-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }
        
        .task-checkbox {
          position: relative;
          margin-top: 2px;
        }
        
        .task-checkbox input {
          opacity: 0;
          position: absolute;
        }
        
        .task-checkbox label {
          display: block;
          width: 20px;
          height: 20px;
          border: 2px solid #E2E8F0;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        
        .task-checkbox input:checked + label {
          background: #09C65B;
          border-color: #09C65B;
        }
        
        .task-checkbox input:checked + label:after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .task-content {
          flex: 1;
        }
        
        .task-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 4px;
        }
        
        .task-title {
          font-weight: 500;
          color: #2D3748;
          line-height: 1.4;
        }
        
        .task-title.completed {
          text-decoration: line-through;
          color: #718096;
        }
        
        .task-subject {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #718096;
          background: #F7FAFC;
          padding: 2px 8px;
          border-radius: 10px;
          margin-bottom: 6px;
        }
        
        .task-description {
          margin: 0 0 8px 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .task-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .task-due-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #718096;
        }
        
        .calendar-icon {
          font-size: 12px;
        }
        
        .priority-badge, .status-badge {
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .priority-badge.high {
          background: rgba(255, 71, 87, 0.15);
          color: #FF4757;
        }
        
        .priority-badge.medium {
          background: rgba(255, 165, 2, 0.15);
          color: #FFA502;
        }
        
        .priority-badge.low {
          background: rgba(9, 198, 91, 0.15);
          color: #09C65B;
        }
        
        .status-badge.completed {
          background: rgba(9, 198, 91, 0.15);
          color: #09C65B;
        }
        
        .status-badge.overdue {
          background: rgba(255, 71, 87, 0.15);
          color: #FF4757;
        }
        
        .status-badge.in-progress {
          background: rgba(45, 135, 255, 0.15);
          color: #09C65B;
        }
        
        .task-actions {
          display: flex;
          gap: 8px;
        }
        
        .edit-btn, .delete-btn {
          background: none;
          border: none;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          color: #718096;
          transition: all 0.2s;
        }
        
        .edit-btn:hover {
          color: #09C65B;
          background: rgba(9, 198, 91, 0.15);
        }
        
        .delete-btn:hover {
          color: #FF4757;
          background: rgba(255, 71, 87, 0.1);
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #718096;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #2D3748;
        }
        
        .empty-state p {
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .app-container {
            padding: 12px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .title-input {
            grid-column: 1;
          }
          
          .stats {
            flex-wrap: wrap;
          }
          
          .controls-row {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .task-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .task-actions {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
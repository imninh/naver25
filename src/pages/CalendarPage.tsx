import React, { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type View, Views } from "react-big-calendar";
import type { Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addWeeks, addMonths, addDays, subWeeks, subMonths, subDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../types/task";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Định nghĩa interface mở rộng cho Event
interface TaskEvent extends Event {
  task?: Task;
}

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Custom styles cho calendar
const calendarStyles = `
  .rbc-calendar {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }

  .rbc-toolbar {
    padding: 20px;
    background: white;
    border-bottom: 1px solid #E2E8F0;
    margin-bottom: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }

  .rbc-toolbar .rbc-toolbar-label {
    flex-grow: 1;
    text-align: center;
    font-weight: 600;
    color: #2D3748;
    font-size: 18px;
    order: 2;
  }

  .rbc-btn-group {
    display: flex;
    gap: 8px;
    order: 1;
  }

  .rbc-btn-group:last-child {
    order: 3;
  }

  .rbc-toolbar button {
    color: #718096;
    border: 1px solid #E2E8F0;
    background: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
    font-size: 14px;
  }

  .rbc-toolbar button:hover,
  .rbc-toolbar button.rbc-active {
    background: #09C65B;
    color: white;
    border-color: #09C65B;
  }

  .rbc-header {
    padding: 12px;
    background: #F7FAFC;
    color: #2D3748;
    font-weight: 600;
    border-bottom: 1px solid #E2E8F0;
    font-size: 14px;
  }

  .rbc-date-cell {
    text-align: center;
    padding: 8px;
    font-weight: 500;
    color: #2D3748;
    font-size: 14px;
  }

  .rbc-today {
    background-color: rgba(45, 135, 255, 0.1);
  }

  .rbc-off-range {
    color: #A0AEC0;
  }

  .rbc-event {
    border: none;
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    line-height: 1;
    min-height: 20px; /* Ensure clickable area */
  }

  .rbc-event-content {
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rbc-show-more {
    color: #09C65B;
    font-weight: 500;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .rbc-toolbar {
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }
    
    .rbc-toolbar .rbc-toolbar-label {
      order: 1;
      font-size: 16px;
    }
    
    .rbc-btn-group {
      order: 2;
    }
    
    .rbc-btn-group:last-child {
      order: 3;
    }
    
    .rbc-toolbar button {
      padding: 6px 12px;
      font-size: 12px;
    }
    
    .rbc-header {
      padding: 8px;
      font-size: 12px;
    }
    
    .rbc-date-cell {
      padding: 4px;
      font-size: 12px;
    }
  }
`;

// Component hiển thị chi tiết task
const TaskDetailModal = ({ task, onClose }: { task: Task; onClose: () => void }) => {
  if (!task) return null;

  const renderPriorityBadge = (priority: string) => {
    if (priority === "High") 
      return <span className="priority-badge high">High</span>;
    if (priority === "Medium") 
      return <span className="priority-badge medium">Medium</span>;
    return <span className="priority-badge low">Low</span>;
  };

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

  return (
    <div className="task-detail-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Task Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="task-info">
          <div className="info-row">
            <label>Title:</label>
            <span className="task-title">{task.title}</span>
          </div>
          
          {task.description && (
            <div className="info-row">
              <label>Description:</label>
              <span className="task-description">{task.description}</span>
            </div>
          )}
          
          {task.dueDate && (
            <div className="info-row">
              <label>Due Date:</label>
              <span className="task-due-date">
                {new Date(task.dueDate).toLocaleDateString()} at{" "}
                {new Date(task.dueDate).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
          
          <div className="info-row">
            <label>Priority:</label>
            {renderPriorityBadge(task.priority)}
          </div>
          
          <div className="info-row">
            <label>Status:</label>
            {renderStatusBadge(task)}
          </div>
          
          {task.createdAt && (
            <div className="info-row">
              <label>Created:</label>
              <span className="task-created">
                {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .task-detail-modal {
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
        
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #2D3748;
          font-size: 20px;
          font-weight: 600;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.2s;
        }
        
        .close-btn:hover {
          background: #F7FAFC;
        }
        
        .task-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-row label {
          font-weight: 600;
          color: #2D3748;
          font-size: 14px;
        }
        
        .task-title {
          color: #2D3748;
          font-weight: 500;
          font-size: 16px;
        }
        
        .task-description {
          color: #718096;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .task-due-date {
          color: #2D3748;
          font-size: 14px;
        }
        
        .task-created {
          color: #718096;
          font-size: 14px;
        }
        
        .priority-badge, .status-badge {
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
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
      `}</style>
    </div>
  );
};

// New component for task list modal
const TaskListModal = ({ category, tasks: modalTasks, onClose }: { category: string; tasks: Task[]; onClose: () => void }) => {
  const { toggleComplete } = useTasks();

  const renderPriorityBadge = (priority: string) => {
    if (priority === "High") 
      return <span className="priority-badge high">High</span>;
    if (priority === "Medium") 
      return <span className="priority-badge medium">Medium</span>;
    return <span className="priority-badge low">Low</span>;
  };

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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "No due date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="task-list-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{category} Tasks</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="task-list">
          {modalTasks.length === 0 ? (
            <div className="empty-state">No tasks in this category.</div>
          ) : (
            modalTasks.map((task) => (
              <div key={task.id} className={`task-item ${task.completed ? "completed" : ""}`}>
                <div className="task-main">
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      id={`modal-task-${task.id}`}
                    />
                    <label htmlFor={`modal-task-${task.id}`}></label>
                  </div>
                  <div className="task-content">
                    <div className="task-title-row">
                      <span className={`task-title ${task.completed ? "completed" : ""}`}>
                        {task.title}
                      </span>
                      <div className="task-priority">
                        {renderPriorityBadge(task.priority)}
                      </div>
                    </div>
                    {task.subject && (
                      <div className="task-subject">
                        <span className="subject-icon">📚</span>
                        {task.subject}
                      </div>
                    )}
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <div className="task-meta">
                      <div className="task-due-date">
                        <span className="calendar-icon">⏰</span>
                        {formatDateTime(task.dueDate)}
                      </div>
                      <div className="task-status">
                        {renderStatusBadge(task)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .task-list-modal {
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
        
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #2D3748;
          font-size: 20px;
          font-weight: 600;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.2s;
        }
        
        .close-btn:hover {
          background: #F7FAFC;
        }
        
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .empty-state {
          text-align: center;
          color: #718096;
          font-size: 14px;
          padding: 20px;
        }
        
        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #F7FAFC;
          transition: background 0.2s;
        }
        
        .task-item:hover {
          background: #E2E8F0;
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
      `}</style>
    </div>
  );
};

export default function CalendarPage() {
  const { tasks, toggleComplete } = useTasks();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'Scheduled' | 'Overdue' | 'Upcoming' | null>(null);

  const events: TaskEvent[] = useMemo(
    () =>
      tasks
        .filter((t: Task) => t.dueDate && !t.completed) // Only show non-completed tasks with due dates
        .map((t: Task) => {
          try {
            const dueDateStr = t.dueDate!;
            const dueDate = new Date(dueDateStr);
            
            if (isNaN(dueDate.getTime())) return null;

            const hasTime = dueDateStr.includes('T') && (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0);
            const endDate = hasTime ? dueDate : new Date(dueDate); // No duration for timed events

            return {
              id: t.id,
              title: t.title,
              start: dueDate,
              end: endDate,
              allDay: !hasTime,
              task: t
            };
          } catch (error) {
            console.error("Error parsing due date:", error);
            return null;
          }
        })
        .filter(Boolean) as TaskEvent[],
    [tasks]
  );

  const eventPropGetter = (event: TaskEvent) => {
    const task = event.task;
    if (!task) {
      return {
        style: {
          backgroundColor: '#718096',
          height: '20px',
          lineHeight: '20px'
        }
      };
    }

    let backgroundColor = '#09C65B'; // Default low

    if (!task.completed && task.dueDate && new Date(task.dueDate) < new Date()) {
      backgroundColor = '#FF4757'; // Overdue
    } else {
      if (task.priority === 'High') backgroundColor = '#FF4757';
      else if (task.priority === 'Medium') backgroundColor = '#FFA502';
      else backgroundColor = '#09C65B';
    }

    const style: React.CSSProperties = { 
      backgroundColor,
      height: '20px',
      lineHeight: '20px'
    };

    if (task.completed) {
      style.opacity = 0.5;
    }

    return { style };
  };

  const handleSelectEvent = (event: TaskEvent) => {
    if (event.task) {
      setSelectedTask(event.task);
    }
  };

  const scheduledTasks = useMemo(() => tasks.filter(t => t.dueDate), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) > new Date()), [tasks]);

  const getCategoryTasks = () => {
    if (selectedCategory === 'Scheduled') return scheduledTasks;
    if (selectedCategory === 'Overdue') return overdueTasks;
    if (selectedCategory === 'Upcoming') return upcomingTasks;
    return [];
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleView = (newView: View) => {
    setView(newView);
  };

  const handleGoToToday = () => {
    setDate(new Date());
  };

  const handleNavigateBack = () => {
    if (view === Views.MONTH) {
      setDate(subMonths(date, 1));
    } else if (view === Views.WEEK) {
      setDate(subWeeks(date, 1));
    } else if (view === Views.DAY) {
      setDate(subDays(date, 1));
    }
  };

  const handleNavigateNext = () => {
    if (view === Views.MONTH) {
      setDate(addMonths(date, 1));
    } else if (view === Views.WEEK) {
      setDate(addWeeks(date, 1));
    } else if (view === Views.DAY) {
      setDate(addDays(date, 1));
    }
  };

  // Custom Toolbar Component
  const CustomToolbar = () => {
    return (
      <div className="custom-toolbar">
        <div className="view-buttons">
          <button
            className={view === Views.MONTH ? "active" : ""}
            onClick={() => handleView(Views.MONTH)}
          >
            Month
          </button>
          <button
            className={view === Views.WEEK ? "active" : ""}
            onClick={() => handleView(Views.WEEK)}
          >
            Week
          </button>
          <button
            className={view === Views.DAY ? "active" : ""}
            onClick={() => handleView(Views.DAY)}
          >
            Day
          </button>
        </div>
        
        <div className="navigation-buttons">
          <button onClick={handleNavigateBack}>
            ←
          </button>
          <button onClick={handleGoToToday} className="today-button">
            Today
          </button>
          <button onClick={handleNavigateNext}>
            →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="task-app">
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-brand">
              <div className="brand-logo">
                <span>📅</span>
              </div>
              <div className="brand-text">
                <h1 className="brand-name">Calendar</h1>
                <p className="brand-tagline">View your tasks schedule</p>
              </div>
            </div>
          </div>
        </header>

        {/* Calendar Content */}
        <div className="calendar-content">
          <style>{calendarStyles}</style>
          
          <div className="calendar-stats">
            <div className="stat clickable" onClick={() => setSelectedCategory('Scheduled')}>
              <span className="stat-number">{scheduledTasks.length}</span>
              <span className="stat-label">Scheduled Tasks</span>
            </div>
            <div className="stat clickable" onClick={() => setSelectedCategory('Overdue')}>
              <span className="stat-number">{overdueTasks.length}</span>
              <span className="stat-label">Overdue Tasks</span>
            </div>
            <div className="stat clickable" onClick={() => setSelectedCategory('Upcoming')}>
              <span className="stat-number">{upcomingTasks.length}</span>
              <span className="stat-label">Upcoming Tasks</span>
            </div>
          </div>

          <div className="calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "65vh" }}
              date={date}
              view={view}
              onNavigate={handleNavigate}
              onView={handleView}
              onSelectEvent={handleSelectEvent}
              popup
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              components={{
                toolbar: CustomToolbar
              }}
              eventPropGetter={eventPropGetter}
            />
          </div>
        </div>

        {/* Modal hiển thị chi tiết task */}
        {selectedTask && (
          <TaskDetailModal 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
          />
        )}

        {/* Modal hiển thị list tasks */}
        {selectedCategory && (
          <TaskListModal
            category={selectedCategory}
            tasks={getCategoryTasks()}
            onClose={() => setSelectedCategory(null)}
          />
        )}

        <style>{`
          .task-app {
            min-height: 100vh;
            background: #F7FAFC;
          }
          
          .app-container {
            max-width: 1200px;
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
            font-weight: normal;
          }
          
          .calendar-content {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .calendar-stats {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
            justify-content: center;
          }
          
          .calendar-stats .stat {
            text-align: center;
            padding: 16px;
            background: #F7FAFC;
            border-radius: 8px;
            min-width: 100px;
            cursor: pointer;
            transition: background 0.2s;
            border: 1px solid #E2E8F0;
          }
          
          .calendar-stats .stat:hover {
            background: #E2E8F0;
            transform: translateY(-2px);
          }
          
          .calendar-stats .stat-number {
            display: block;
            font-size: 24px;
            font-weight: bold;
            color: #09C65B;
          }
          
          .calendar-stats .stat-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .calendar-container {
            margin-top: 20px;
          }
          
          .custom-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
            gap: 12px;
          }
          
          .view-buttons, .navigation-buttons {
            display: flex;
            gap: 8px;
          }
          
          .custom-toolbar button {
            padding: 8px 16px;
            border: 1px solid #E2E8F0;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #718096;
            transition: all 0.2s;
          }
          
          .custom-toolbar button:hover,
          .custom-toolbar button.active {
            background: #09C65B;
            color: white;
            border-color: #09C65B;
          }
          
          .today-button {
            background: #09C65B !important;
            color: white !important;
            border-color: #09C65B !important;
          }
          
          @media (max-width: 768px) {
            .app-container {
              padding: 12px;
            }
            
            .calendar-stats {
              flex-direction: column;
              align-items: center;
            }
            
            .calendar-stats .stat {
              width: 100%;
              max-width: 200px;
            }
            
            .custom-toolbar {
              flex-direction: column;
              align-items: stretch;
            }
            
            .view-buttons, .navigation-buttons {
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
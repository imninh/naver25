import { useState, useEffect } from 'react';
import { Pie, Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
} from "chart.js";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../types/task";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
);

export default function AnalyticsPage() {
  const { tasks } = useTasks();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [currentPage, setCurrentPage] = useState(0);
  const tasksPerPage = 10;

  // Filter tasks based on completion
  const completed = tasks.filter((t: Task) => t.completed).length;
  const pending = tasks.length - completed;

  // Priority analysis
  const highPriority = tasks.filter((t: Task) => t.priority === "High").length;
  const mediumPriority = tasks.filter((t: Task) => t.priority === "Medium").length;
  const lowPriority = tasks.filter((t: Task) => t.priority === "Low").length;

  // Due date analysis
  const tasksWithValidDueDate = tasks.filter((t: Task) => {
    if (!t.dueDate) return false;
    try {
      const date = new Date(t.dueDate);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }).length;

  const tasksWithoutDueDate = tasks.length - tasksWithValidDueDate;

  // Overdue tasks analysis
  const overdueTasks = tasks.filter((t: Task) => {
    if (!t.dueDate || t.completed) return false;
    try {
      const dueDate = new Date(t.dueDate);
      return !isNaN(dueDate.getTime()) && dueDate < new Date();
    } catch {
      return false;
    }
  }).length;

  // Study-related tasks analysis (for students)
  const studyTasks = tasks.filter((t: Task) => 
    t.title.toLowerCase().includes('assignment') ||
    t.title.toLowerCase().includes('exam') ||
    t.title.toLowerCase().includes('homework') ||
    t.title.toLowerCase().includes('study') ||
    t.title.toLowerCase().includes('read') ||
    t.title.toLowerCase().includes('project')
  ).length;

  // Calculate average completion time for completed tasks
  const completedTasksWithDueDate = tasks.filter((t: Task) => t.completed && t.dueDate);
  const avgCompletionTime = completedTasksWithDueDate.length > 0 
    ? completedTasksWithDueDate.reduce((acc, task) => {
        const dueDate = new Date(task.dueDate!);
        const completedDate = new Date(task.completedAt || new Date());
        const diffTime = Math.abs(completedDate.getTime() - dueDate.getTime());
        return acc + diffTime;
      }, 0) / completedTasksWithDueDate.length
    : 0;

  const avgCompletionDays = Math.round(avgCompletionTime / (1000 * 60 * 60 * 24));

  // Weekly/Monthly completion trend
  const getCompletionTrend = () => {
    const result = [];
    const now = new Date();
    const range = timeRange === 'week' ? 7 : 30;
    
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      const completedOnDate = tasks.filter((t: Task) => {
        if (!t.completed || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate.toDateString() === date.toDateString();
      }).length;
      
      result.push(completedOnDate);
    }
    
    return result;
  };
  const getStudyTasksBreakdown = () => {
    const studyTasks = tasks.filter(t => 
      t.subject && t.subject.trim() !== "" ||
      t.title.toLowerCase().includes('assignment') ||
      t.title.toLowerCase().includes('exam') ||
      t.title.toLowerCase().includes('homework') ||
      t.title.toLowerCase().includes('study') ||
      t.title.toLowerCase().includes('read') ||
      t.title.toLowerCase().includes('project')
    );

    // Phân loại theo subject
    const bySubject: Record<string, number> = {};
    studyTasks.forEach(task => {
      const subject = task.subject || "Other Study Tasks";
      bySubject[subject] = (bySubject[subject] || 0) + 1;
    });

    // Phân loại theo completion
    const completedStudyTasks = studyTasks.filter(t => t.completed).length;
    const pendingStudyTasks = studyTasks.length - completedStudyTasks;

    return {
      total: studyTasks.length,
      bySubject,
      completed: completedStudyTasks,
      pending: pendingStudyTasks
    };
  };

  const studyBreakdown = getStudyTasksBreakdown();
  const completionTrend = getCompletionTrend();

  // Completion Ratio Chart
  const pieData = {
    labels: ["Completed", "Pending"],
    datasets: [
      {
        data: [completed, pending],
        backgroundColor: ["#09C65B", "#FF4757"],
        borderColor: ["#09C65B", "#FF4757"],
        borderWidth: 1,
      },
    ],
  };

  // Priority Distribution Chart
  const priorityData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        data: [highPriority, mediumPriority, lowPriority],
        backgroundColor: ["#FF4757", "#FFA502", "#09C65B"],
        borderColor: ["#FF4757", "#FFA502", "#09C65B"],
        borderWidth: 1,
      },
    ],
  };

  // Due Date Analysis Chart
  const dueDateData = {
    labels: ["With Due Date", "Without Due Date"],
    datasets: [
      {
        data: [tasksWithValidDueDate, tasksWithoutDueDate],
        backgroundColor: ["#09C65B", "#9B59B6"],
        borderColor: ["#09C65B", "#9B59B6"],
        borderWidth: 1,
      },
    ],
  };

  // Study vs Personal Tasks
  const studyPersonalData = {
    labels: ["Study Tasks", "Personal Tasks"],
    datasets: [
      {
        data: [studyTasks, tasks.length - studyTasks],
        backgroundColor: ["#09C65B", "#E74C3C"],
        borderColor: ["#09C65B", "#E74C3C"],
        borderWidth: 1,
      },
    ],
  };

  // Completion Trend Chart
  const trendLabels = timeRange === 'week' 
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : Array.from({length: 30}, (_, i) => `Day ${i+1}`);

  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Tasks Completed',
        data: completionTrend,
        fill: true,
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: '#09C65B',
        tension: 0.4,
        pointBackgroundColor: '#09C65B',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#09C65B'
      },
    ],
  };

  // Tasks Overview Bar Chart with pagination
  const currentTasks = tasks.slice(
    currentPage * tasksPerPage,
    (currentPage + 1) * tasksPerPage
  );

  const barData = {
    labels: currentTasks.map((t: Task) => 
      t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title
    ),
    datasets: [
      {
        label: "Completion Status",
        data: currentTasks.map((t: Task) => (t.completed ? 1 : 0)),
        backgroundColor: currentTasks.map((t: Task) => 
          t.completed ? '#09C65B' : '#FF4757'
        ),
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          }
        }
      },
      title: {
        display: false,
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: function(value: string | number) {
            return value === 1 ? 'Done' : 'Pending';
          },
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          }
        }
      }
    },
  };

  const trendOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tasks Completed',
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          }
        },
        ticks: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          }
        }
      },
      x: {
        title: {
          display: true,
          text: timeRange === 'week' ? 'Days of Week' : 'Days',
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          }
        },
        ticks: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12
          }
        }
      }
    }
  };

  // Productivity score calculation
  const productivityScore = tasks.length > 0 
    ? Math.min(100, Math.round((completed / tasks.length) * 100 + (tasks.filter(t => t.priority === "High" && t.completed).length * 10)))
    : 0;

  return (
    <div className="task-app">
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-brand">
              <div className="brand-logo">
                <span>📊</span>
              </div>
              <div className="brand-text">
                <h1 className="brand-name">Analytics Dashboard</h1>
                <p className="brand-tagline">Track your study progress and productivity</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Analytics Content */}
        <div className="analytics-content">
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(9, 198, 91, 0.15)', color: '#09C65B' }}>
                <span>✓</span>
              </div>
              <div className="stat-info">
                <div className="stat-number">{completed}</div>
                <div className="stat-label">Completed Tasks</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(255, 71, 87, 0.15)', color: '#FF4757' }}>
                <span>⏰</span>
              </div>
              <div className="stat-info">
                <div className="stat-number">{pending}</div>
                <div className="stat-label">Pending Tasks</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(255, 165, 2, 0.15)', color: '#FFA502' }}>
                <span>⚠️</span>
              </div>
              <div className="stat-info">
                <div className="stat-number">{overdueTasks}</div>
                <div className="stat-label">Overdue Tasks</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(45, 135, 255, 0.15)', color: '#2D87FF' }}>
                <span>📅</span>
              </div>
              <div className="stat-info">
                <div className="stat-number">{tasksWithValidDueDate}</div>
                <div className="stat-label">Tasks with Due Date</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(52, 152, 219, 0.15)', color: '#3498DB' }}>
                <span>📚</span>
              </div>
              <div className="stat-info">
                <div className="stat-number">{studyTasks}</div>
                <div className="stat-label">Study Tasks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(155, 89, 182, 0.15)', color: '#9B59B6' }}>
                <span>⏱️</span>
              </div>
              <div className="stat-info">
                <div className="stat-number">{avgCompletionDays}</div>
                <div className="stat-label">Avg. Completion Days</div>
              </div>
            </div>
          </div>

          {/* Productivity Score and Study Tasks Breakdown */}
          <div className="summary-cards">
            <div className="productivity-card">
              <h3>Your Productivity Score</h3>
              <div className="score-container">
                <div className="score-circle">
                  <span className="score-value">{productivityScore}</span>
                  <span className="score-label">out of 100</span>
                </div>
                <div className="score-description">
                  {productivityScore >= 80 ? "Excellent! You're doing great!" :
                   productivityScore >= 60 ? "Good job! Keep it up!" :
                   productivityScore >= 40 ? "Not bad! Room for improvement." :
                   "Let's work on getting more tasks done!"}
                </div>
              </div>
            </div>

            <div className="chart-card study-breakdown-card">
              <div className="chart-header">
                <h3>Study Tasks Breakdown</h3>
              </div>
              <div className="study-details">
                <div className="study-stats">
                  <div className="study-stat">
                    <span className="stat-number">{studyBreakdown.total}</span>
                    <span className="stat-label">Total Study Tasks</span>
                  </div>
                  <div className="study-stat">
                    <span className="stat-number">{studyBreakdown.completed}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                  <div className="study-stat">
                    <span className="stat-number">{studyBreakdown.pending}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                </div>
                
                {Object.keys(studyBreakdown.bySubject).length > 0 && (
                  <div className="subject-breakdown">
                    <h4>By Subject</h4>
                    {Object.entries(studyBreakdown.bySubject).map(([subject, count]) => (
                      <div key={subject} className="subject-item">
                        <span className="subject-name">{subject}</span>
                        <span className="subject-count">{count} tasks</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Completion Ratio</h3>
                <div className="completion-rate">
                  {tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%
                </div>
              </div>
              <div className="chart-container">
                <Doughnut data={pieData} options={chartOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Priority Distribution</h3>
              </div>
              <div className="chart-container">
                <Pie data={priorityData} options={chartOptions} />
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3>Due Date Analysis</h3>
              </div>
              <div className="chart-container">
                <Doughnut data={dueDateData} options={chartOptions} />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Study vs Personal</h3>
              </div>
              <div className="chart-container">
                <Doughnut data={studyPersonalData} options={chartOptions} />
              </div>
            </div>
            
            <div className="chart-card full-width">
              <div className="chart-header with-tabs">
                <h3>Completion Trend</h3>
                <div className="time-range-tabs">
                  <button 
                    className={timeRange === 'week' ? 'active' : ''}
                    onClick={() => setTimeRange('week')}
                  >
                    Weekly
                  </button>
                  <button 
                    className={timeRange === 'month' ? 'active' : ''}
                    onClick={() => setTimeRange('month')}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <div className="chart-container">
                <Line data={trendData} options={trendOptions} />
              </div>
            </div>
            
            <div className="chart-card full-width">
              <div className="chart-header">
                <h3>Tasks Overview</h3>
                <div className="tasks-count">{tasks.length} tasks total</div>
              </div>
              <div className="chart-container">
                <Bar data={barData} options={barOptions} />
              </div>
              {tasks.length > tasksPerPage && (
                <div className="chart-pagination">
                  <button 
                    className="pagination-btn"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button 
                    className="pagination-btn"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .task-app {
          min-height: 100vh;
          background: #F7FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
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
        
        .analytics-content {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s;
          border: 1px solid #E2E8F0;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          margin-right: 16px;
          font-size: 20px;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #2D3748;
        }
        
        .stat-label {
          font-size: 14px;
          color: #718096;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .productivity-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
          border: 1px solid #E2E8F0;
        }
        
        .study-breakdown-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #E2E8F0;
        }
        
        .productivity-card h3,
        .study-breakdown-card .chart-header h3 {
          margin: 0 0 20px 0;
          color: #2D3748;
          font-size: 18px;
          font-weight: 600;
        }
        
        .score-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #09C65B, #09C65B);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          margin-bottom: 16px;
        }
        
        .score-value {
          font-size: 32px;
          font-weight: bold;
        }
        
        .score-label {
          font-size: 12px;
          opacity: 0.9;
        }
        
        .score-description {
          font-size: 16px;
          color: #4A5568;
          max-width: 300px;
        }
        
        .study-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .study-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .study-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #F7FAFC;
          border-radius: 8px;
          padding: 12px;
        }
        
        .study-stat .stat-number {
          font-size: 20px;
          margin-bottom: 4px;
        }
        
        .study-stat .stat-label {
          font-size: 12px;
          color: #718096;
        }
        
        .subject-breakdown h4 {
          margin: 0 0 12px 0;
          color: #2D3748;
          font-size: 16px;
          font-weight: 600;
        }
        
        .subject-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .subject-item:last-child {
          border-bottom: none;
        }
        
        .subject-name {
          color: #4A5568;
        }
        
        .subject-count {
          color: #718096;
          font-weight: 500;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #E2E8F0;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .chart-header.with-tabs {
          margin-bottom: 0;
        }
        
        .chart-header h3 {
          margin: 0;
          font-size: 18px;
          color: #2D3748;
          font-weight: 600;
        }
        
        .completion-rate, .tasks-count {
          font-weight: bold;
          color: #09C65B;
          background: rgba(9, 198, 91, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .time-range-tabs {
          display: flex;
          background: #F7FAFC;
          border-radius: 8px;
          padding: 4px;
        }
        
        .time-range-tabs button {
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          color: #718096;
          font-family: inherit;
        }
        
        .time-range-tabs button.active {
          background: white;
          color: #09C65B;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .chart-container {
          height: 250px;
          position: relative;
        }
        
        .chart-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 16px;
          gap: 16px;
        }
        
        .pagination-btn {
          background: #09C65B;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
        }
        
        .pagination-btn:disabled {
          background: #CBD5E0;
          cursor: not-allowed;
        }
        
        .pagination-info {
          font-size: 14px;
          color: #718096;
        }
        
        @media (max-width: 768px) {
          .app-container {
            padding: 12px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .summary-cards {
            grid-template-columns: 1fr;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .time-range-tabs {
            align-self: flex-end;
          }
          
          .study-stats {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
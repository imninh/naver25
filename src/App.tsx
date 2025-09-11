import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ListPage from "./pages/ListPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Header from "./components/Header";
import { useState } from "react";
import GeminiAssistant from "./components/GeminiAssistant";
import { useTasks } from "./hooks/useTasks";
import "./App.css";

export default function App() {
  const [showAssistant, setShowAssistant] = useState(false);
  const { addTask } = useTasks();

  const handleAddTask = (taskData: any) => {
    const { title, dueDate, description, priority, subject } = taskData;
    addTask(title, dueDate, description, priority, subject);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
        
        {/* Nút mở Gemini Assistant */}
        <button
          onClick={() => setShowAssistant(!showAssistant)}
          className="minibot-toggle"
          aria-label="Open AI Assistant"
        >
          <span className="ai-icon">✨</span>
        </button>
        
        {/* Gemini Assistant */}
        {showAssistant && (
          <div className="minibot-container">
            <GeminiAssistant 
              onClose={() => setShowAssistant(false)}
              onAddTask={handleAddTask}
            />
          </div>
        )}
      </Router>
    </div>
  );
}
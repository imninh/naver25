export type AISuggestion = {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority?: "low" | "medium" | "high";
  suggestedSlot?: string | null;
};

export type AIAction = "create_task" | "analyze_tasks" | "summarize" | "suggest_schedule" | "unknown";

export type AIResponse = {
  action: AIAction;
  message: string;
  suggestions?: AISuggestion[];
  analysis?: any;
};

// Phân tích intent của người dùng
function analyzeIntent(prompt: string): AIAction {
  const lowerPrompt = prompt.toLowerCase();
  
  // Các từ khóa cho phân tích và tổng hợp
  const analyzeKeywords = ["phân tích", "analyze", "thống kê", "statistic", "bao nhiêu", "how many", "tổng hợp", "summary", "report"];
  const scheduleKeywords = ["lịch trình", "schedule", "sắp xếp", "arrange", "thời gian", "time"];
  const taskKeywords = ["tạo", "create", "thêm", "add", "mới", "new", "task", "công việc"];
  
  if (analyzeKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return "analyze_tasks";
  }
  
  if (scheduleKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return "suggest_schedule";
  }
  
  if (taskKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return "create_task";
  }
  
  return "unknown";
}

// Phân tích tasks hiện có
function analyzeTasks(tasks: any[], prompt: string) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  
  const highPriorityTasks = tasks.filter(t => t.priority === "High").length;
  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
  ).length;
  
  const recentTasks = tasks.filter(t => 
    t.createdAt && new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    highPriorityTasks,
    overdueTasks,
    recentTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
}

// Gợi ý lịch trình thông minh
function suggestSmartSchedule(tasks: any[]) {
  const pendingTasks = tasks.filter(t => !t.completed);
  const highPriorityPending = pendingTasks.filter(t => t.priority === "High");
  const mediumPriorityPending = pendingTasks.filter(t => t.priority === "Medium");
  
  // Ưu tiên tasks quan trọng và sắp hết hạn
  const suggestions: AISuggestion[] = [];
  
  if (highPriorityPending.length > 0) {
    suggestions.push({
      title: "Ưu tiên hoàn thành tasks quan trọng",
      description: `Bạn có ${highPriorityPending.length} task quan trọng cần hoàn thành`,
      estimatedMinutes: highPriorityPending.length * 45,
      priority: "high",
      suggestedSlot: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 giờ nữa
    });
  }
  
  if (mediumPriorityPending.length > 0) {
    suggestions.push({
      title: "Lên kế hoạch cho tasks trung bình",
      description: `Bạn có ${mediumPriorityPending.length} task cần quan tâm`,
      estimatedMinutes: mediumPriorityPending.length * 30,
      priority: "medium",
      suggestedSlot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Ngày mai
    });
  }
  
  // Gợi ý nghỉ ngơi nếu có nhiều task completed
  const completedToday = tasks.filter(t => 
    t.completed && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;
  
  if (completedToday >= 3) {
    suggestions.push({
      title: "Nghỉ ngơi và thư giãn",
      description: "Bạn đã hoàn thành nhiều task hôm nay! Hãy dành thời gian nghỉ ngơi",
      estimatedMinutes: 30,
      priority: "low",
      suggestedSlot: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 giờ nữa
    });
  }
  
  return suggestions;
}

export async function generateAIResponse(prompt: string, existingTasks: any[] = [], mood = "neutral"): Promise<AIResponse> {
  const intent = analyzeIntent(prompt);
  
  try {
    // Nếu có backend AI, gửi request
    const res = await fetch("http://localhost:5000/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt, 
        mood,
        taskCount: existingTasks.length,
        hasPendingTasks: existingTasks.filter(t => !t.completed).length > 0
      })
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (error) {
    console.error("AI request failed:", error);
    // Fallback to local logic
  }

  // Fallback logic based on intent
  switch (intent) {
    case "analyze_tasks":
      const analysis = analyzeTasks(existingTasks, prompt);
      return {
        action: "analyze_tasks",
        message: `📊 Phân tích tasks của bạn:\n\n• Tổng số task: ${analysis.totalTasks}\n• Đã hoàn thành: ${analysis.completedTasks}\n• Chưa hoàn thành: ${analysis.pendingTasks}\n• Task quan trọng: ${analysis.highPriorityTasks}\n• Task trễ hạn: ${analysis.overdueTasks}\n• Tỷ lệ hoàn thành: ${analysis.completionRate}%`,
        analysis
      };

    case "suggest_schedule":
      const scheduleSuggestions = suggestSmartSchedule(existingTasks);
      return {
        action: "suggest_schedule",
        message: scheduleSuggestions.length > 0 
          ? "📅 Dựa trên tasks hiện tại, tôi đề xuất lịch trình sau:" 
          : "🎉 Bạn không có task nào cần sắp xếp! Mọi thứ đã được tổ chức tốt.",
        suggestions: scheduleSuggestions
      };

    case "create_task":
      // Fallback task creation
      const taskSuggestions = await generateSuggestions(prompt, mood);
      return {
        action: "create_task",
        message: `✅ Đã tạo ${taskSuggestions.length} task đề xuất cho bạn!`,
        suggestions: taskSuggestions
      };

    default:
      return {
        action: "unknown",
        message: "🤔 Tôi không chắc bạn muốn gì. Bạn có thể:\n• 'Tạo task học toán' - để thêm task mới\n• 'Phân tích tasks' - để xem thống kê\n• 'Gợi ý lịch trình' - để sắp xếp thời gian",
        suggestions: []
      };
  }
}

// Giữ nguyên hàm generateSuggestions cũ cho compatibility
export async function generateSuggestions(prompt: string, mood = "neutral"): Promise<AISuggestion[]> {
  const response = await generateAIResponse(prompt, [], mood);
  return response.suggestions || [];
}
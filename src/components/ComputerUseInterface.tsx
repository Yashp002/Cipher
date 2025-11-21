import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function ComputerUseInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<Id<"computerUseTasks"> | null>(null);

  const createTask = useMutation(api.computerUse.createTask);
  const currentTask = useQuery(
    api.computerUse.getTask,
    currentTaskId ? { taskId: currentTaskId } : "skip"
  );
  const recentTasks = useQuery(api.computerUse.getUserTasks, { limit: 5 });

  const handleStartTask = async () => {
    if (!goal.trim()) {
      toast.error("Please enter a goal");
      return;
    }

    setIsSubmitting(true);
    try {
      const taskId = await createTask({ goal, description });
      setCurrentTaskId(taskId);
      
      // Notify the agent service
      const response = await fetch('/api/computer-use/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, goal }),
      });

      if (!response.ok) {
        throw new Error('Failed to start computer use agent');
      }

      toast.success("Computer Use Agent started!");
      setGoal("");
      setDescription("");
    } catch (error) {
      console.error("Failed to start task:", error);
      toast.error("Failed to start task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopTask = async () => {
    try {
      await fetch('/api/computer-use/stop', { method: 'POST' });
      toast.info("Stopping agent...");
    } catch (error) {
      console.error("Failed to stop task:", error);
      toast.error("Failed to stop task");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "running":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "cancelled":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "running":
        return "🔄";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "cancelled":
        return "⏸️";
      default:
        return "⏳";
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-2xl flex items-center justify-center transition-all hover:scale-110"
          title="Computer Use Agent"
        >
          <span className="text-3xl">🤖</span>
        </button>
      )}

      {/* Main Panel */}
      {isOpen && (
        <div className="w-96 bg-black/95 backdrop-blur-sm rounded-xl border border-purple-900/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-white font-bold">Computer Use Agent</h3>
                <p className="text-purple-200 text-xs">AI-Powered Task Automation</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-purple-200 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Current Task Status */}
            {currentTask && currentTask.status === "running" && (
              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🎯</span>
                      <span className="text-white font-semibold">Active Task</span>
                    </div>
                    <p className="text-gray-300 text-sm">{currentTask.goal}</p>
                  </div>
                  <button
                    onClick={handleStopTask}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  >
                    Stop
                  </button>
                </div>
                
                {currentTask.steps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-700/30">
                    <p className="text-purple-300 text-xs mb-2">
                      Steps completed: {currentTask.steps.length}
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {currentTask.steps.slice(-3).map((step, i) => (
                        <div
                          key={i}
                          className="bg-black/30 rounded p-2 text-xs"
                        >
                          <span className="text-purple-400">
                            {step.action.type}
                          </span>
                          {step.result && (
                            <p className="text-gray-400 mt-1">{step.result}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* New Task Form */}
            {(!currentTask || currentTask.status !== "running") && (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">
                    Task Goal *
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Open Notepad and write a poem"
                    className="w-full px-3 py-2 bg-gray-900 border border-purple-900/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional context or requirements..."
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-900 border border-purple-900/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm resize-none"
                  />
                </div>

                <button
                  onClick={handleStartTask}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all shadow-lg disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Starting..." : "🚀 Start Agent"}
                </button>
              </div>
            )}

            {/* Recent Tasks */}
            {recentTasks && recentTasks.length > 0 && (
              <div className="border-t border-purple-900/30 pt-4 mt-4">
                <h4 className="text-gray-300 text-sm font-semibold mb-2">
                  Recent Tasks
                </h4>
                <div className="space-y-2">
                  {recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-gray-900/50 rounded-lg p-3 border border-purple-900/20 hover:border-purple-700/30 transition-colors cursor-pointer"
                      onClick={() => setCurrentTaskId(task._id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-2">
                          <p className="text-white text-sm line-clamp-1">
                            {task.goal}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(task.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-lg ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                        </span>
                      </div>
                      {task.status === "completed" && task.steps.length > 0 && (
                        <p className="text-purple-400 text-xs mt-2">
                          {task.steps.length} steps completed
                        </p>
                      )}
                      {task.status === "failed" && task.error && (
                        <p className="text-red-400 text-xs mt-2 line-clamp-1">
                          {task.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-700/30">
              <h4 className="text-purple-300 text-xs font-semibold mb-2">
                ⚡ What can the agent do?
              </h4>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• Control mouse and keyboard</li>
                <li>• See and analyze your screen</li>
                <li>• Open and interact with applications</li>
                <li>• Complete complex multi-step tasks</li>
                <li>• Automatically retry on failures</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

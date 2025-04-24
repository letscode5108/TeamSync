import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Calendar, Clock, Filter, Plus, Trash, Edit, ChevronDown, ChevronUp, } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NOT_STARTED' | 'READY_TO_START' | 'IN_PROGRESS' | 'ALMOST_DONE' | 'COMPLETED';
  deadline: string;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string };
  subtasks?: Task[];
}

interface TeamAnalysis {
  tasks: Task[];
  tasksByStatus: {
    NOT_STARTED: Task[];
    READY_TO_START: Task[];
    IN_PROGRESS: Task[];
    ALMOST_DONE: Task[];
    COMPLETED: Task[];
  };
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const STATUS_LABELS: { [key: string]: string } = {
  NOT_STARTED: 'Not Started',
  READY_TO_START: 'Ready to Start',
  IN_PROGRESS: 'In Progress',
  ALMOST_DONE: 'Almost Done',
  COMPLETED: 'Completed'
};

const PRIORITY_COLORS: { [key: string]: string } = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500'
};

export default function TaskByManager() {
  const [teamId, setTeamId] = useState<string | null>(null);

  console.log('Team ID:', teamId);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
  
  // Filter states
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterMember, setFilterMember] = useState<string>('');
  const [filterDeadline, setFilterDeadline] = useState<string>('');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [teamName, setTeamName] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    deadline: '',
    assigneeId: ''
  });
  useEffect(() => {
    const getMyTeams = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams`, {
          withCredentials: true,
        });
        const myTeams = res.data.teams;
  
        if (myTeams.length > 0) {
         
          setTeamId(myTeams[0].id); 
          setTeams(myTeams);// Or let user select from multiple teams
        } else {
          setError("You are not managing any teams.");
        }
      } catch (err) {
        setError("Failed to fetch your teams.");
      }
    };

    getMyTeams();
  }, []);
  
  useEffect(() => {
    if (teamId) {
    fetchTeamAnalysis();
    fetchTeamMembers();
    fetchTeamDetails();
  }
  }, [teamId]);

  const fetchTeamAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/tasks/${teamId}`,{withCredentials: true});
      setAnalysis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch team analysis');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Assuming an API endpoint to fetch team members
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}/members`,{withCredentials: true});
     // setTeamMembers(response.data);
     setTeamMembers(response.data.members || []);
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const fetchTeamDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}`,{withCredentials: true});
      setTeamName(response.data.name);
    } catch (err: any) {
      console.error('Failed to fetch team details:', err);
    }
  };

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/tasks/details/${taskId}`,{withCredentials: true});
      setCurrentTask(response.data.task);
      return response.data.task;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch task details');
      return null;
    }
  };

  const createTask = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/tasks/${teamId}/`, formData,{withCredentials: true});
      setTaskModalOpen(false);
      resetForm();
      fetchTeamAnalysis();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const editTask = async () => {
    if (!currentTask) return;
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/tasks/${currentTask.id}`, formData,{withCredentials: true});
      setTaskDetailsOpen(null);
      setEditMode(false);
      resetForm();
      fetchTeamAnalysis();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/tasks/${taskId}`,{withCredentials: true});
      setTaskDetailsOpen(null);
      fetchTeamAnalysis();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const createSubtask = async () => {
    if (!currentTask) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/tasks/${currentTask.id}/subtasks`, formData,{withCredentials: true});
      setSubtaskModalOpen(false);
      resetForm();
      
      // Refetch task details to get updated subtasks
      if (taskDetailsOpen) {
        fetchTaskDetails(taskDetailsOpen);
      }
      
      fetchTeamAnalysis();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create subtask');
    }
  };

  const fetchSubtasks = async (taskId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/tasks/${taskId}/subtasks`,{withCredentials: true});
      return response.data.subtasks;
    } catch (err: any) {
      console.error('Failed to fetch subtasks:', err);
      return [];
    }
  };

  const handleTaskClick = async (taskId: string) => {
    const task = await fetchTaskDetails(taskId);
    if (task) {
      setTaskDetailsOpen(taskId);
      
      // Also fetch subtasks if task is expanded
      if (expandedTasks[taskId]) {
        const subtasks = await fetchSubtasks(taskId);
        setCurrentTask({...task, subtasks});
      }
    }
  };

  const toggleTaskExpand = async (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setExpandedTasks(prev => {
      const isExpanded = !prev[taskId];
      
      // If expanding, fetch subtasks
      if (isExpanded) {
        fetchSubtasks(taskId).then(subtasks => {
          if (currentTask && currentTask.id === taskId) {
            setCurrentTask({...currentTask, subtasks});
          }
        });
      }
      
      return {...prev, [taskId]: isExpanded};
    });
  };

  const handleEditClick = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      assigneeId: task.assignee?.id || ''
    });
    setEditMode(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      deadline: '',
      assigneeId: ''
    });
  };

  const openNewTaskModal = () => {
    resetForm();
    setTaskModalOpen(true);
  };

  const openNewSubtaskModal = () => {
    resetForm();
    setSubtaskModalOpen(true);
  };

  // Filter functions
  const filterTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      // Priority filter
      if (filterPriority && task.priority !== filterPriority) {
        return false;
      }
      
      // Member filter
      if (filterMember && (!task.assignee || task.assignee.id !== filterMember)) {
        return false;
      }
      
      // Deadline filter
      if (filterDeadline) {
        if (!task.deadline) return false;
        
        const today = new Date();
        const deadline = new Date(task.deadline);
        
        switch (filterDeadline) {
          case 'today':
            return deadline.toDateString() === today.toDateString();
          case 'tomorrow':
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            return deadline.toDateString() === tomorrow.toDateString();
          case 'thisWeek':
            const endOfWeek = new Date();
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
            return deadline >= today && deadline <= endOfWeek;
          case 'overdue':
            return deadline < today;
          default:
            return true;
        }
      }
      
      return true;
    });
  };

  // Data for pie chart
  const getChartData = () => {
    if (!analysis) return [];
    
    return [
      { name: 'Not Started', value: analysis.summary.notStarted, color: '#FF8042' },
      { name: 'In Progress', value: analysis.summary.inProgress, color: '#FFBB28' },
      { name: 'Completed', value: analysis.summary.completed, color: '#00C49F' }
    ];
  };

  if (loading && !analysis) {
    return <div className="flex justify-center items-center h-64">Loading team analysis...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-300 rounded">{error}</div>;
  }

  const filteredTasks = analysis ? filterTasks(analysis.tasks) : [];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Manager Dashboard</h1>
        {teams.length > 1 && (
          <label className="mb-2 block text-sm font-medium text-gray-700">
      <select

      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

        value={teamId || ''}
        onChange={(e) => setTeamId(e.target.value)}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
           
          </option>
        ))}
      </select>
      </label>
    )}
  
        
        
        <button 
          onClick={openNewTaskModal}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={16} /> Create Task
        </button>
      </div>

      {/* Team Analysis Section */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-4">Team Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <p className="text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold">{analysis.summary.total}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <p className="text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{analysis.summary.completed}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <p className="text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold">{analysis.summary.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Task Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Task Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Filter size={18} className="mr-2" /> Filter Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Members</option>
              {teamMembers.map(member => (
                <option key={member.userId} value={member.userId}>{member.name} ({member.email})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <select
              value={filterDeadline}
              onChange={(e) => setFilterDeadline(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Deadlines</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="thisWeek">Due This Week</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Tasks ({filteredTasks.length})</h2>
        </div>
        
        {filteredTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No tasks found matching your filters.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTasks.map(task => (
              <li 
                key={task.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTaskClick(task.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className={`${PRIORITY_COLORS[task.priority]} w-3 h-3 rounded-full mt-1.5`}></div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                            {task.subtasks.length} subtasks
                          </span>
                        )}
                        <button 
                          className="ml-2 text-gray-500 hover:text-gray-700"
                          onClick={(e) => toggleTaskExpand(task.id, e)}
                        >
                          {expandedTasks[task.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}</p>
                      <div className="mt-2 flex items-center text-xs text-gray-500 flex-wrap gap-2">
                        <span className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                        </span>
                        <span className="flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${PRIORITY_COLORS[task.priority]}`}></span>
                          {task.priority}
                        </span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {STATUS_LABELS[task.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {task.assignee ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          {task.assignee.name.charAt(0)}
                        </div>
                        <span>{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span>Unassigned</span>
                    )}
                  </div>
                </div>
                
                {/* Subtasks (when expanded) */}
                {expandedTasks[task.id] && task.subtasks && task.subtasks.length > 0 && (
                  <div className="mt-4 pl-6 border-l-2 border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Subtasks</h4>
                    <ul className="space-y-2">
                      {task.subtasks.map(subtask => (
                        <li key={subtask.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className={`${PRIORITY_COLORS[subtask.priority]} w-2 h-2 rounded-full mr-2`}></div>
                            <span className="text-sm">{subtask.title}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-0.5 rounded mr-2">
                              {STATUS_LABELS[subtask.status]}
                            </span>
                            {subtask.assignee && <span>{subtask.assignee.name}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Task Creation Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); createTask(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Assignee</option>
                  {teamMembers.map(member => (
                    <option key={member.userId} value={member.userId}>{member.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {taskDetailsOpen && currentTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {editMode ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
                <form onSubmit={(e) => { e.preventDefault(); editTask(); }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                    <select
                      value={formData.assigneeId}
                      onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Assignee</option>
                      {teamMembers.map(member => (
                        <option key={member.userId} value={member.userId}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Update Task
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">{currentTask.title}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(currentTask)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteTask(currentTask.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash size={18} />
                    </button>
                    <button
                      onClick={() => setTaskDetailsOpen(null)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium">{STATUS_LABELS[currentTask.status]}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-500">Priority</p>
                    <p className="font-medium flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${PRIORITY_COLORS[currentTask.priority]}`}></span>
                      {currentTask.priority}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-500">Deadline</p>
                    <p className="font-medium flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {currentTask.deadline ? new Date(currentTask.deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-gray-500">Assignee</p>
                    <p className="font-medium">
                      {currentTask.assignee ? currentTask.assignee.name : 'Unassigned'}
                      {currentTask.assignee && <span className="text-gray-500 text-xs ml-1">({currentTask.assignee.email})</span>}
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                    {currentTask.description || 'No description provided.'}
                  </div>
                </div>
                
                {/* Subtasks Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-medium">Subtasks</h3>
                    <button 
                      onClick={openNewSubtaskModal}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Subtask
                    </button>
                  </div>
                  
                  {currentTask.subtasks && currentTask.subtasks.length > 0 ? (
                    <ul className="space-y-2 bg-gray-50 p-3 rounded">
                      {currentTask.subtasks.map(subtask => (
                        <li key={subtask.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                          <div className="flex items-center">
                            <div className={`${PRIORITY_COLORS[subtask.priority]} w-2 h-2 rounded-full mr-2`}></div>
                            <div>
                              <p className="font-medium">{subtask.title}</p>
                              <p className="text-xs text-gray-500">
                                {subtask.assignee?.name || 'Unassigned'} • {STATUS_LABELS[subtask.status]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            {subtask.deadline && (
                              <span className="flex items-center mr-3">
                                <Clock size={12} className="mr-1" />
                                {new Date(subtask.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded">No subtasks created yet.</p>
                  )}
                </div>
                
                {/* Task History */}
                {currentTask.history && currentTask.history.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium mb-2">Task History</h3>
                    <ul className="space-y-2 bg-gray-50 p-3 rounded text-sm">
                      {currentTask.history.map((event, index) => (
                        <li key={index} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                          <span>Status changed to <span className="font-medium">{STATUS_LABELS[event.status]}</span></span>
                          <span className="text-gray-500">{new Date(event.changedAt).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Comments Section */}
                {currentTask.comments && currentTask.comments.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-2">Comments</h3>
                    <ul className="space-y-3">
                      {currentTask.comments.map((comment, index) => (
                        <li key={index} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{comment.author?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtask Creation Modal */}
      {subtaskModalOpen && currentTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Subtask for "{currentTask.title}"</h2>
            <form onSubmit={(e) => { e.preventDefault(); createSubtask(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Assignee</option>
                  {teamMembers.map(member => (
                    <option key={member.userId} value={member.userId}>{member.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSubtaskModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Subtask
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


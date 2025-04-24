import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Flag, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  Pause,
  AlertCircle,
  XCircle,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Plus,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

// Types
interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'NOT_STARTED' | 'READY_TO_START' | 'IN_PROGRESS' | 'ALMOST_DONE' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: string;
  createdAt: string;
  updatedAt: string;
  team: Team;
  creator: User;
  assignee?: User;
  subtasks: Task[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  user: User;
}

interface TaskCommentsProps {
  taskId: string;
  currentUser: {
    userId: string;
    name: string;
  };
  isTeamManager?: boolean;
  isTaskCreator?: boolean;
}




interface TaskFilters {
  deadline: string | null;
  priority: string | null;
  status: string | null;
  search: string;
}

const TaskDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    deadline: null,
    priority: null,
    status: null,
    search: ''
  });
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusComment, setStatusComment] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/my-tasks`, {withCredentials: true});
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyTasks();
    if (selectedTask) {
      await fetchTaskDetails(selectedTask.id);
    }
    setTimeout(() => setRefreshing(false), 800); // Show spinner for at least 800ms
  };

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/my-tasks/details/${taskId}`, {withCredentials: true});
      setSelectedTask(response.data.task);
      fetchSubtasks(taskId);
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    }
  };

  const fetchSubtasks = async (taskId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/my-tasks/${taskId}/subtasks`, {withCredentials: true});
      setSubtasks(response.data.subtasks);
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    }
  };

  const updateTaskStatus = async () => {
    if (!selectedTask || !newStatus) return;
    
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/my-tasks/${selectedTask.id}/status`, {
        status: newStatus,
        comment: statusComment,
      }, { withCredentials: true });
      
      // Refresh data
      await fetchMyTasks();
      await fetchTaskDetails(selectedTask.id);
      
      // Reset form
      setNewStatus('');
      setStatusComment('');
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    fetchTaskDetails(task.id);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({...filters, search: e.target.value});
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (filters.search && 
        !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filter by deadline
    if (filters.deadline && new Date(task.deadline).toDateString() !== new Date(filters.deadline).toDateString()) {
      return false;
    }
    
    // Filter by priority
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    
    // Filter by status
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Pause className="text-gray-500" />;
      case 'READY_TO_START':
        return <Clock className="text-blue-500" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="text-yellow-500" />;
      case 'ALMOST_DONE':
        return <AlertCircle className="text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircle className="text-green-500" />;
      default:
        return <Clock className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const style = {
      'NOT_STARTED': 'bg-gray-100 text-gray-700',
      'READY_TO_START': 'bg-blue-100 text-blue-700',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-700',
      'ALMOST_DONE': 'bg-orange-100 text-orange-700',
      'COMPLETED': 'bg-green-100 text-green-700',
    }[status] || 'bg-gray-100 text-gray-700';
    
    return (
      <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{status.replace(/_/g, ' ')}</span>
      </span>
    );
  }
 
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Flag className="w-3 h-3 mr-1" />High
        </span>;
      case 'MEDIUM': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Flag className="w-3 h-3 mr-1" />Medium
        </span>;
      case 'LOW': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Flag className="w-3 h-3 mr-1" />Low
        </span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Flag className="w-3 h-3 mr-1" />None
        </span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && selectedTask?.status !== 'COMPLETED';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <div className="flex space-x-2">
            <button 
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Task List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              {/* Search & Filter */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                
                <div className="mt-3">
                  <button 
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                    <ChevronDown className={`h-4 w-4 ml-1 transform ${filterOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {filterOpen && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                        <input
                          type="date"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={filters.deadline || ''}
                          onChange={(e) => setFilters({...filters, deadline: e.target.value || null})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={filters.priority || ''}
                          onChange={(e) => setFilters({...filters, priority: e.target.value || null})}
                        >
                          <option value="">All Priorities</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={filters.status || ''}
                          onChange={(e) => setFilters({...filters, status: e.target.value || null})}
                        >
                          <option value="">All Statuses</option>
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="READY_TO_START">Ready to Start</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="ALMOST_DONE">Almost Done</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-end">
                        <button 
                          className="text-sm text-gray-600 hover:text-gray-900 mr-3"
                          onClick={() => setFilters({deadline: null, priority: null, status: null, search: ''})}
                        >
                          Clear all
                        </button>
                        <button 
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          onClick={() => setFilterOpen(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Task List */}
              <div className="overflow-y-auto max-h-screen">
                {loading ? (
                  <div className="flex justify-center items-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-6 text-center">
                    <XCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <li 
                        key={task.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition ${selectedTask?.id === task.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                            </div>
                            {task.subtasks.length > 0 && (
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full flex items-center">
                                {task.subtasks.length}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {getStatusBadge(task.status)}
                            {getPriorityLabel(task.priority)}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className={`flex items-center ${isOverdue(task.deadline) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {formatDate(task.deadline)}
                              {isOverdue(task.deadline) && ' (Overdue)'}
                            </span>
                            
                            <span className="inline-flex items-center text-gray-500">
                              <span className="truncate max-w-[100px]">{task.team.name}</span>
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - Task Details & Subtasks */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTask ? (
              <>
                {/* Task Details */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {getStatusIcon(selectedTask.status)}
                        <h2 className="text-lg font-medium text-gray-900 ml-2">{selectedTask.title}</h2>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-500">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Description */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                      <p className="text-gray-700 whitespace-pre-line">{selectedTask.description}</p>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</h4>
                        <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Priority</h4>
                        <div className="mt-1">{getPriorityLabel(selectedTask.priority)}</div>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Deadline</h4>
                        <p className={`text-sm flex items-center ${isOverdue(selectedTask.deadline) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                          <Calendar className="h-4 w-4 mr-1.5" />
                          {formatDate(selectedTask.deadline)}
                          {isOverdue(selectedTask.deadline) && ' (Overdue)'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Team</h4>
                        <p className="text-sm text-gray-700">{selectedTask.team.name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created By</h4>
                        <p className="text-sm text-gray-700">{selectedTask.creator.name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assigned To</h4>
                        <p className="text-sm text-gray-700">{selectedTask.assignee?.name || 'Unassigned'}</p>
                      </div>
                    </div>
                    
                    {/* Update Status Form */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Update Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                        >
                          <option value="">Select new status</option>
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="READY_TO_START">Ready to Start</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="ALMOST_DONE">Almost Done</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        
                        <textarea
                          placeholder="Add a comment (optional)"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={statusComment}
                          onChange={(e) => setStatusComment(e.target.value)}
                          rows={1}
                        ></textarea>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          className={`px-4 py-2 rounded-md text-white ${newStatus ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                          onClick={updateTaskStatus}
                          disabled={!newStatus}
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Subtasks */}
                {subtasks.length > 0 ? (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Subtasks ({subtasks.length})</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          Add Subtask
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Assignee
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Deadline
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Priority
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subtasks.map((subtask) => (
                            <tr key={subtask.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{subtask.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{subtask.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(subtask.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {subtask.assignee?.name || 'Unassigned'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm ${isOverdue(subtask.deadline) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                  {formatDate(subtask.deadline)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getPriorityLabel(subtask.priority)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : selectedTask.subtasks.length > 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading subtasks...</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No task selected</h3>
                <p className="mt-2 text-gray-500">Select a task from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;
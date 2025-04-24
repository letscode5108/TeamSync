import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {   
    try {
      await logout();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex space-x-3">
            {user?.role === 'MANAGER' && (
              <>
              <Link 
                to="/p/team-management" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Manage Team
               </Link>
               <Link 
                to="/p/tasks" 
                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                Task Management
                </Link>
              </>
              
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
            <Link 
           to="/p/chat" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
                Chat

               </Link>
               <Link 
 to="/p/meet" 
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
   Meet

     </Link>
                  {user?.role === 'MEMBER' && (
              <Link 
                to="/p/tasks/member" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                My Tasks
               </Link>
           )}
           
           
           
           
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium mb-2">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">
            {user?.role === 'MANAGER' 
              ? 'You have manager access. You can invite team members and manage your team.'
              : 'You are a team member. You can view and participate in team activities.'
            }
          </p>
        </div>
 

        </div>
      </div>
  
  );
};

export default Dashboard;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';





// Public Pages
import HomePage from './pages/Open/HomePage'
import LoginPage from './pages/Open/LoginPage';
import Registration from './pages/Open/Registration';
import InvitationRegistration from './pages/Open/InvitationRegistration';


// Protected Pages
import Dashboard from './pages/Protected/Dashboard';
import TeamManagement from './pages/Protected/TeamManagement';
import TaskByManager from './pages/Protected/TaskByManager';
import TaskByMember from './pages/Protected/TaskByMember';
import Chat from './pages/Protected/Chat';
import Meeting from './pages/Protected/Meeting';

// Components
import ProtectedRoute from './ProtectedRoute'

const App = () => {
  return (
    <AuthProvider>
      <Router>
     
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/signin" element={<LoginPage />} />
            <Route path="/auth/signup" element={<Registration />} />
            <Route path="/auth/invitation" element={<InvitationRegistration />} />
            

            {/* Protected Routes */}
            <Route path="/p" element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="team-management" element={<TeamManagement />} />
              <Route path="tasks" element={<TaskByManager />} />
              <Route path="tasks/member" element={<TaskByMember />} />
              <Route path="chat" element={<Chat />} />
              <Route path="meet" element={<Meeting />} />


          
             
              
              {/* Manager-only routes */}
           
           
              </Route>
         
          </Routes>


      </Router>
    </AuthProvider>
  );
};

export default App;
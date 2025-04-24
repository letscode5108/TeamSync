// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role?: string;
// }

// interface TeamMember {
//   id: string;
//   userId: string;
//   name: string;
//   email: string;
//   role?: string;
//   joinedAt: string;
// }

// interface Team {
//   id: string;
//   name: string;
//   description: string;
//   managerId: string;
//   manager: User;
//   members: { user: User }[];
//   tasks?: any[];
//   meetings?: any[];
// }

// interface Invitation {
//   id: string;
//   email: string;
//   status: string;
//   createdAt: string;
//   expiresAt: string;
// }

// const TeamManagement = () => {
//   const [teams, setTeams] = useState<Team[]>([]);
//   const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
//   const [members, setMembers] = useState<TeamMember[]>([]);
//   const [invitations, setInvitations] = useState<Invitation[]>([]);
//   const [activeTab, setActiveTab] = useState('teams');
  
//   // Form states
//   const [newTeamName, setNewTeamName] = useState('');
//   const [newTeamDescription, setNewTeamDescription] = useState('');
//   const [inviteEmail, setInviteEmail] = useState('');
//   const [showNewTeamForm, setShowNewTeamForm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   // Fetch teams
//   const fetchTeams = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams`, {
//         //headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
//         withCredentials: true

//       });
//       setTeams(response.data.teams);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch teams');
//       setLoading(false);
//     }
//   };

//   // Fetch team details
//   const fetchTeamDetails = async (teamId: string) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}`, {
//       //  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
//       withCredentials: true
//       });
//       setSelectedTeam(response.data.team);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch team details');
//       setLoading(false);
//     }
//   };

//   // Fetch team members
//   const fetchTeamMembers = async (teamId: string) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}/members`, {
//         //headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
//         withCredentials: true
//       });
//       setMembers(response.data.members);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch team members');
//       setLoading(false);
//     }
//   };

//   // Fetch team invitations
//   const fetchTeamInvitations = async (teamId: string) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}/invitations`, {
//         //headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
//         withCredentials: true
//       });
//       setInvitations(response.data.invitations);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch invitations');
//       setLoading(false);
//     }
//   };

//   // Create new team
//   const handleCreateTeam = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/teams`, 
//         { name: newTeamName, description: newTeamDescription },
//         { withCredentials: true}
//       );
//       setSuccess('Team created successfully');
//       setNewTeamName('');
//       setNewTeamDescription('');
//       setShowNewTeamForm(false);
//       fetchTeams();
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to create team');
//       setLoading(false);
//     }
//   };

//   // Update team
//   const handleUpdateTeam = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedTeam) return;
    
//     try {
//       setLoading(true);
//       const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/teams/${selectedTeam.id}`, 
//         { name: selectedTeam.name, description: selectedTeam.description },
//         { withCredentials: true}
//       );
//       setSuccess('Team updated successfully');
//       fetchTeams();
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to update team');
//       setLoading(false);
//     }
//   };

//   // Delete team
//   const handleDeleteTeam = async (teamId: string) => {
//     if (!window.confirm('Are you sure you want to delete this team?')) return;
    
//     try {
//       setLoading(true);
//       await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}`, {
//         withCredentials: true
//       });
//       setSuccess('Team deleted successfully');
//       setSelectedTeam(null);
//       fetchTeams();
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to delete team');
//       setLoading(false);
//     }
//   };

//   // Send invitation
//   const handleSendInvitation = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedTeam) return;
    
//     try {
//       setLoading(true);
//       await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/teams/${selectedTeam.id}/invitations`, 
//         { email: inviteEmail },
//         { withCredentials: true}
//       );
//       setSuccess('Invitation sent successfully');
//       setInviteEmail('');
//       fetchTeamInvitations(selectedTeam.id);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to send invitation');
//       setLoading(false);
//     }
//   };

//   // Remove member
//   const handleRemoveMember = async (memberId: string) => {
//     if (!selectedTeam || !window.confirm('Are you sure you want to remove this member?')) return;
    
//     try {
//       setLoading(true);
//       await axios.delete(`${import.meta.env.VITE_API_URL}/api/teams/${selectedTeam.id}/members/${memberId}`, {
//         withCredentials: true
//       });
//       setSuccess('Member removed successfully');
//       fetchTeamMembers(selectedTeam.id);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to remove member');
//       setLoading(false);
//     }
//   };

//   // Handle team selection
//   const handleTeamSelect = (team: Team) => {
//     setSelectedTeam(team);
//     setActiveTab('details');
//     fetchTeamDetails(team.id);
//     fetchTeamMembers(team.id);
//     fetchTeamInvitations(team.id);
//   };

//   useEffect(() => {
//     fetchTeams();
//     // Clear messages after 5 seconds
//     const timer = setTimeout(() => {
//       setError('');
//       setSuccess('');
//     }, 5000);
//     return () => clearTimeout(timer);
//   }, [error, success]);

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       <div className="w-64 bg-white shadow-md">
//         <div className="p-4 border-b">
//           <h2 className="text-xl font-semibold">Teams</h2>
//           <button 
//             onClick={() => setShowNewTeamForm(true)}
//             className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
//           >
//             Create New Team
//           </button>
//         </div>
//         <div className="p-2">
//           {loading && teams.length === 0 ? (
//             <p className="text-center text-gray-500">Loading teams...</p>
//           ) : teams.length > 0 ? (
//             <ul>
//               {teams.map(team => (
//                 <li 
//                   key={team.id} 
//                   className={`p-2 cursor-pointer rounded ${selectedTeam?.id === team.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
//                   onClick={() => handleTeamSelect(team)}
//                 >
//                   {team.name}
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-center text-gray-500">No teams found</p>
//           )}
//         </div>
//       </div>
      
//       {/* Main Content */}
//       <div className="flex-1 p-8 overflow-auto">
//         {/* Alerts */}
//         {error && (
//           <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
//             <p>{error}</p>
//           </div>
//         )}
//         {success && (
//           <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
//             <p>{success}</p>
//           </div>
//         )}
        
//         {/* New Team Form */}
//         {showNewTeamForm && (
//           <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//             <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
//             <form onSubmit={handleCreateTeam}>
//               <div className="mb-4">
//                 <label className="block text-gray-700">Team Name</label>
//                 <input
//                   type="text"
//                   value={newTeamName}
//                   onChange={(e) => setNewTeamName(e.target.value)}
//                   className="w-full p-2 border rounded mt-1"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-gray-700">Description</label>
//                 <textarea
//                   value={newTeamDescription}
//                   onChange={(e) => setNewTeamDescription(e.target.value)}
//                   className="w-full p-2 border rounded mt-1"
//                   rows={3}
//                 />
//               </div>
//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowNewTeamForm(false)}
//                   className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
//                   disabled={loading}
//                 >
//                   {loading ? 'Creating...' : 'Create Team'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         )}
        
//         {/* Selected Team Details */}
//         {selectedTeam && (
//           <>
//             <div className="flex justify-between items-center mb-6">
//               <h1 className="text-3xl font-bold">{selectedTeam.name}</h1>
//               <button
//                 onClick={() => handleDeleteTeam(selectedTeam.id)}
//                 className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
//               >
//                 Delete Team
//               </button>
//             </div>
            
//             {/* Tabs */}
//             <div className="mb-6 border-b">
//               <nav className="flex">
//                 <button
//                   onClick={() => setActiveTab('details')}
//                   className={`py-4 px-6 font-medium ${activeTab === 'details' ? 'text-blue-500 border-b-2 border-blue-500' : 'hover:text-blue-500'}`}
//                 >
//                   Details
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('members')}
//                   className={`py-4 px-6 font-medium ${activeTab === 'members' ? 'text-blue-500 border-b-2 border-blue-500' : 'hover:text-blue-500'}`}
//                 >
//                   Members
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('invitations')}
//                   className={`py-4 px-6 font-medium ${activeTab === 'invitations' ? 'text-blue-500 border-b-2 border-blue-500' : 'hover:text-blue-500'}`}
//                 >
//                   Invitations
//                 </button>
//               </nav>
//             </div>
            
//             {/* Tab Content */}
//             {activeTab === 'details' && (
//               <div className="bg-white p-6 rounded-lg shadow-md">
//                 <h2 className="text-2xl font-bold mb-4">Team Details</h2>
//                 <form onSubmit={handleUpdateTeam}>
//                   <div className="mb-4">
//                     <label className="block text-gray-700">Team Name</label>
//                     <input
//                       type="text"
//                       value={selectedTeam.name}
//                       onChange={(e) => setSelectedTeam({...selectedTeam, name: e.target.value})}
//                       className="w-full p-2 border rounded mt-1"
//                       required
//                     />
//                   </div>
//                   <div className="mb-4">
//                     <label className="block text-gray-700">Description</label>
//                     <textarea
//                       value={selectedTeam.description}
//                       onChange={(e) => setSelectedTeam({...selectedTeam, description: e.target.value})}
//                       className="w-full p-2 border rounded mt-1"
//                       rows={3}
//                     />
//                   </div>
//                   <div className="mb-4">
//                     <label className="block text-gray-700">Manager</label>
//                     <p className="mt-1">{selectedTeam.manager?.name || 'Unknown'}</p>
//                   </div>
//                   <div className="flex justify-end">
//                     <button
//                       type="submit"
//                       className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
//                       disabled={loading}
//                     >
//                       {loading ? 'Updating...' : 'Update Team'}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             )}
            
//             {activeTab === 'members' && (
//               <div className="bg-white p-6 rounded-lg shadow-md">
//                 <h2 className="text-2xl font-bold mb-4">Team Members</h2>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white">
//                     <thead>
//                       <tr>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {loading ? (
//                         <tr>
//                           <td colSpan={4} className="py-4 text-center text-gray-500">
//                             Loading members...
//                           </td>
//                         </tr>
//                       ) : members.length > 0 ? (
//                         members.map(member => (
//                           <tr key={member.id} className="hover:bg-gray-50">
//                             <td className="py-4 px-4 border-b border-gray-200">{member.name}</td>
//                             <td className="py-4 px-4 border-b border-gray-200">{member.email}</td>
//                             <td className="py-4 px-4 border-b border-gray-200">{member.role || 'Member'}</td>
//                             <td className="py-4 px-4 border-b border-gray-200">
//                               {selectedTeam.managerId !== member.userId && (
//                                 <button
//                                   onClick={() => handleRemoveMember(member.id)}
//                                   className="text-red-500 hover:text-red-700"
//                                 >
//                                   Remove
//                                 </button>
//                               )}
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan={4} className="py-4 text-center text-gray-500">
//                             No members found
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
            
//             {activeTab === 'invitations' && (
//               <div className="bg-white p-6 rounded-lg shadow-md">
//                 <h2 className="text-2xl font-bold mb-4">Team Invitations</h2>
//                 <form onSubmit={handleSendInvitation} className="mb-6">
//                   <div className="flex items-center space-x-2">
//                     <input
//                       type="email"
//                       placeholder="Enter email address"
//                       value={inviteEmail}
//                       onChange={(e) => setInviteEmail(e.target.value)}
//                       className="flex-1 p-2 border rounded"
//                       required
//                     />
//                     <button
//                       type="submit"
//                       className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
//                       disabled={loading}
//                     >
//                       {loading ? 'Sending...' : 'Send Invitation'}
//                     </button>
//                   </div>
//                 </form>
                
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-white">
//                     <thead>
//                       <tr>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
//                         <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {loading ? (
//                         <tr>
//                           <td colSpan={4} className="py-4 text-center text-gray-500">
//                             Loading invitations...
//                           </td>
//                         </tr>
//                       ) : invitations.length > 0 ? (
//                         invitations.map(invitation => (
//                           <tr key={invitation.id} className="hover:bg-gray-50">
//                             <td className="py-4 px-4 border-b border-gray-200">{invitation.email}</td>
//                             <td className="py-4 px-4 border-b border-gray-200">
//                               <span className={`px-2 py-1 rounded text-xs ${
//                                 invitation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
//                                 invitation.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
//                                 'bg-red-100 text-red-800'
//                               }`}>
//                                 {invitation.status}
//                               </span>
//                             </td>
//                             <td className="py-4 px-4 border-b border-gray-200">
//                               {new Date(invitation.createdAt).toLocaleDateString()}
//                             </td>
//                             <td className="py-4 px-4 border-b border-gray-200">
//                               {new Date(invitation.expiresAt).toLocaleDateString()}
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan={4} className="py-4 text-center text-gray-500">
//                             No pending invitations
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
        
//         {!selectedTeam && !showNewTeamForm && (
//           <div className="text-center py-10">
//             <h2 className="text-2xl font-semibold text-gray-600">Select a team or create a new one</h2>
//             <p className="text-gray-500 mt-2">Manage your teams, members and invitations</p>
//             <button
//               onClick={() => setShowNewTeamForm(true)}
//               className="mt-4 bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
//             >
//               Create New Team
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TeamManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, Plus, UserPlus, Trash2, Users, Mail, Calendar, X, Edit, Check, AlertCircle } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  managerId: string;
  members: TeamMember[];
}

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);  // New state for team members
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamDesc, setNewTeamDesc] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  
  // UI states
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  // Fetch all teams
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams`,{
        withCredentials: true
      });
      setTeams(response.data.teams);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch teams');
      setLoading(false);
    }
  };

  // Fetch single team details
  const fetchTeamDetails = async (teamId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}`,{
        withCredentials: true});
      setCurrentTeam(response.data.team);
      setEditName(response.data.team.name);
      setEditDesc(response.data.team.description);
      setLoading(false);
      
      // After fetching team, get members and invitations
      fetchTeamMembers(teamId);
      fetchInvitations(teamId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch team details');
      setLoading(false);
    }
  };
  
  // Fetch team members - New function
  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}/members`, {
        withCredentials: true
      });
      setMembers(response.data.members);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch team members');
    }
  };

  // Fetch team invitations
  const fetchInvitations = async (teamId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/teams/${teamId}/invitations`,{
        withCredentials: true
      });
      setInvitations(response.data.invitations);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invitations');
    }
  };

  // Create new team
  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/teams`, {
        name: newTeamName,
        description: newTeamDesc
      },  { withCredentials: true});
      setNewTeamName('');
      setNewTeamDesc('');
      setShowCreateForm(false);
      fetchTeams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create team');
      setLoading(false);
    }
  };

  // Update team
  const updateTeam = async () => {
    if (!currentTeam) return;
    
    try {
      setLoading(true);
      await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/teams/${currentTeam.id}`, { 
        name: editName, 
        description: editDesc 
      },
      { withCredentials: true });
      setIsEditing(false);
      fetchTeamDetails(currentTeam.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update team');
      setLoading(false);
    }
  };

  // Delete team
  const deleteTeam = async () => {
    if (!currentTeam) return;
    
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/teams/${currentTeam.id}`, {
        withCredentials: true
      });
      setCurrentTeam(null);
      setIsConfirmingDelete(false);
      fetchTeams();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete team');
      setLoading(false);
    }
  };

  // Send invitation
  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/teams/${currentTeam.id}/invitations`, {
        email: inviteEmail
      },
      { withCredentials: true });
      setInviteEmail('');
      setShowInviteForm(false);
      fetchInvitations(currentTeam.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    if (!currentTeam || !window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/teams/${currentTeam.id}/members/${memberId}`,{
        withCredentials: true});
      fetchTeamMembers(currentTeam.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status badge color based on invitation status
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Load teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);

  // Select a team
  const handleTeamSelect = (team: Team) => {
    setIsEditing(false);
    setIsConfirmingDelete(false);
    fetchTeamDetails(team.id);
  };

  // Clear any error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Cancel edit mode
  const cancelEdit = () => {
    if (currentTeam) {
      setEditName(currentTeam.name);
      setEditDesc(currentTeam.description);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Team Management</h1>
        
        {/* Error Toast */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md flex items-start max-w-md z-50">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Teams Sidebar */}
          <div className="w-full lg:w-1/3 xl:w-1/4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">My Teams</h2>
                <button 
                  onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    if (showCreateForm) {
                      setNewTeamName('');
                      setNewTeamDesc('');
                    }
                  }}
                  className={`flex items-center ${showCreateForm ? 'text-gray-600 hover:text-gray-800' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-md transition-colors px-3 py-2 text-sm`}
                >
                  {showCreateForm ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      New Team
                    </>
                  )}
                </button>
              </div>
              
              {/* Create Team Form */}
              {showCreateForm && (
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <form onSubmit={createTeam} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter team name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newTeamDesc}
                        onChange={(e) => setNewTeamDesc(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your team's purpose"
                        rows={3}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Team'}
                    </button>
                  </form>
                </div>
              )}
              
              {/* Teams List */}
              <div className="overflow-y-auto max-h-96">
                {loading && !teams.length ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="animate-pulse text-gray-400">Loading teams...</div>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {teams.length === 0 ? (
                      <li className="py-8 px-4 text-center text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="mb-1">No teams found</p>
                        <p className="text-sm">Create a team to get started</p>
                      </li>
                    ) : (
                      teams.map((team) => (
                        <li 
                          key={team.id}
                          onClick={() => handleTeamSelect(team)}
                          className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${currentTeam?.id === team.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Users className="h-4 w-4 mr-1" />
                              {team.members?.length || 0} members
                            </div>
                          </div>
                          {currentTeam?.id === team.id && (
                            <ChevronRight className="h-5 w-5 text-blue-500" />
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          {/* Team Details */}
          <div className="w-full lg:w-2/3 xl:w-3/4 space-y-6">
            {currentTeam ? (
              <>
                {/* Team Header */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={cancelEdit}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={updateTeam}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentTeam.name}</h2>
                          <p className="text-gray-600">{currentTeam.description || "No description provided"}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center text-sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          {isConfirmingDelete ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-red-600">Confirm?</span>
                              <button 
                                onClick={deleteTeam}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                              >
                                Yes
                              </button>
                              <button 
                                onClick={() => setIsConfirmingDelete(false)}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors text-sm"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setIsConfirmingDelete(true)}
                              className="px-3 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center text-sm"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Team Members */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      Team Members
                    </h3>
                    <button 
                      onClick={() => setShowInviteForm(!showInviteForm)}
                      className={`flex items-center ${showInviteForm ? 'text-gray-600 hover:text-gray-800' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-md transition-colors px-3 py-2 text-sm`}
                    >
                      {showInviteForm ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Invite Member
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Invite Form */}
                  {showInviteForm && (
                    <div className="p-4 bg-blue-50 border-b border-blue-100">
                      <form onSubmit={inviteMember} className="flex items-center">
                        <div className="flex-grow">
                          <label className="sr-only">Email address</label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-md transition-colors flex items-center"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Send Invite
                        </button>
                      </form>
                    </div>
                  )}
                  
                  {/* Members Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {members && members.length > 0 ? (
                          members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{member.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.userId === currentTeam.managerId ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {member.userId === currentTeam.managerId ? 'Admin' : member.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                                {formatDate(member.joinedAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {member.userId !== currentTeam.managerId && (
                                  <button
                                    onClick={() => removeMember(member.id)}
                                    className="text-red-600 hover:text-red-900 transition-colors text-sm flex items-center"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                              <p>No members found</p>
                              <p className="text-sm mt-1">Start by inviting team members</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Pending Invitations */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-blue-500" />
                      Invitations
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {invitations.length > 0 ? (
                          invitations.map((invite) => (
                            <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{invite.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invite.status)}`}>
                                  {invite.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                {formatDate(invite.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                {formatDate(invite.expiresAt)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                              <Mail className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                              <p>No invitations</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              // Empty state
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Users className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No team selected</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Select a team from the sidebar or create a new one to manage your team members and invitations.
                </p>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create a New Team
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;




































































































































































































































































































































































































































































































































































































































































































































































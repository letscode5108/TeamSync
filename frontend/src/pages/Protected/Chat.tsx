// import React, { useEffect, useState, useRef } from 'react';
// import axios from 'axios';
// import { Send, Paperclip, Check } from 'lucide-react';
// import { useParams } from 'react-router-dom';

// // Types
// interface User {
//   id: string;
//   name: string;
// }

// interface MessageRead {
//   userId: string;
// }

// interface ChatAttachment {
//   id: string;
//   fileName: string;
//   fileType: string;
//   fileSize: number;
//   cloudinaryUrl: string;
// }

// interface ChatMessage {
//   id: string;
//   content: string;
//   senderId: string;
//   createdAt: string;
//   sender: {
//     id: string;
//     name: string;
//   };
//   attachments: ChatAttachment[];
//   readBy: MessageRead[];
// }

// interface ChatParticipant {
//   userId: string;
//   user: User;
// }

// interface Chat {
//   id: string;
//   name: string;
//   type: 'TEAM' | 'DIRECT';
//   teamId?: string;
//   team?: { name: string };
//   updatedAt: string;
//   participants: ChatParticipant[];
//   messages: ChatMessage[];
//   _count?: {
//     messages: number;
//   };
// }

// interface ChatUIProps {
//   userId: string;
//   teamId?: string;
// }

// const Chat: React.FC = () => {
//   const { userId, teamId } = useParams<{ userId: string; teamId?: string }>(); 
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [currentChat, setCurrentChat] = useState<Chat | null>(null);
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // Fetch user chats
//   useEffect(() => {
//     fetchChats();
//     fetchUnreadCounts();

//     // Set up polling for unread counts
//     const interval = setInterval(fetchUnreadCounts, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [currentChat?.messages]);

//   const fetchChats = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats`, { withCredentials: true });
//       setChats(response.data);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching chats:', error);
//       setLoading(false);
//     }
//   };

//   const fetchUnreadCounts = async () => {
//     try {
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats/unread/count`, { withCredentials: true });
//       const countsObj: Record<string, number> = {};
//       response.data.forEach((item: { chatId: string; unreadCount: number }) => {
//         countsObj[item.chatId] = item.unreadCount;
//       });
//       setUnreadCounts(countsObj);
//     } catch (error) {
//       console.error('Error fetching unread counts:', error);
//     }
//   };

//   const selectChat = async (chatId: string) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats/${chatId}`, { withCredentials: true });
//       setCurrentChat(response.data);
//       markMessagesAsRead(response.data);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching chat:', error);
//       setLoading(false);
//     }
//   };

//   const markMessagesAsRead = async (chat: Chat) => {
//     if (!chat || chat.messages.length === 0) return;

//     // Get unread message IDs
//     const unreadMessageIds = chat.messages
//       .filter(message => message.senderId !== userId && !message.readBy?.length)
//       .map(message => message.id);

//     if (unreadMessageIds.length === 0) return;

//     try {
//       await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chats/${chat.id}/read`, { messageIds: unreadMessageIds }, { withCredentials: true });
//       fetchUnreadCounts(); // Update unread counts
//     } catch (error) {
//       console.error('Error marking messages as read:', error);
//     }
//   };

//   const sendMessage = async () => {
//     if ((!message.trim() && !file) || !currentChat) return;

//     try {
//       if (file) {
//         await sendAttachment();
//       } else {
//         await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chats/${currentChat.id}/messages`, { content: message }, { withCredentials: true });
//       }
      
//       setMessage('');
//       setFile(null);
      
//       // Refresh the current chat to show the new message
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats/${currentChat.id}`, { withCredentials: true });
//       setCurrentChat(response.data);
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   };

//   const sendAttachment = async () => {
//     if (!file || !currentChat) return;

//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chats/${currentChat.id}/attachments`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         },
//         withCredentials: true
//       });
//     } catch (error) {
//       console.error('Error uploading file:', error);
//     }
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setFile(e.target.files[0]);
//     }
//   };

//   const triggerFileInput = () => {
//     fileInputRef.current?.click();
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const formatDateTime = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const createTeamChat = async () => {
//     if (!teamId) return;
    
//     try {
//       await axios.post(`${import.meta.env.VITE_API_URL}/api/chats/team`, { teamId, name: `${teamId} Team Chat` }, { withCredentials: true });
//       fetchChats();
//     } catch (error) {
//       console.error('Error creating team chat:', error);
//     }
//   };

//   const renderAttachment = (attachment: ChatAttachment) => {
//     const isImage = attachment.fileType.startsWith('image/');
    
//     return (
//       <div key={attachment.id} className="flex flex-col border rounded p-2 mt-2 bg-gray-50">
//         {isImage ? (
//           <img 
//             src={attachment.cloudinaryUrl} 
//             alt={attachment.fileName} 
//             className="max-h-40 object-contain mb-2" 
//           />
//         ) : null}
//         <div className="flex justify-between items-center">
         
//           <a 
//             href={attachment.cloudinaryUrl} 
//             target="_blank" 
//             rel="noopener noreferrer" 
//             className="text-blue-500 text-sm"
//           >
//             Download
//           </a>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Chat List Sidebar */}
//       <div className="w-1/4 bg-white border-r border-gray-200 p-4 overflow-y-auto">
//         <h2 className="text-xl font-semibold mb-4">Conversations</h2>
        
//         {teamId && (
//           <button 
//             onClick={createTeamChat}
//             className="w-full bg-blue-500 text-white py-2 rounded mb-4 font-medium"
//           >
//             Create Team Chat
//           </button>
//         )}
        
//         {chats.length === 0 && !loading ? (
//           <p className="text-gray-500 text-center mt-8">No chats available</p>
//         ) : (
//           <ul>
//             {chats.map(chat => (
//               <li 
//                 key={chat.id} 
//                 className={`p-2 mb-2 rounded cursor-pointer hover:bg-gray-100 ${
//                   currentChat?.id === chat.id ? 'bg-blue-100' : ''
//                 }`}
//                 onClick={() => selectChat(chat.id)}
//               >
//                 <div className="flex justify-between items-center">
//                   <span className="font-medium">{chat.name || chat.team?.name}</span>
//                   {unreadCounts[chat.id] > 0 && (
//                     <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
//                       {unreadCounts[chat.id]}
//                     </span>
//                   )}
//                 </div>
//                 {chat.messages && chat.messages[0] && (
//                   <p className="text-sm text-gray-500 truncate">
//                     {chat.messages[0].sender.name}: {chat.messages[0].content}
//                   </p>
//                 )}
//                 <p className="text-xs text-gray-400 mt-1">
//                   {chat.updatedAt && formatDateTime(chat.updatedAt)}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
      
//       {/* Chat Area */}
//       <div className="w-3/4 flex flex-col">
//         {currentChat ? (
//           <>
//             {/* Chat Header */}
//             <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-lg font-semibold">{currentChat.name || currentChat.team?.name}</h3>
//                 <p className="text-sm text-gray-500">
//                   {currentChat.participants.length} participants
//                 </p>
//               </div>
//             </div>
            
//             {/* Messages */}
//             <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
//               {currentChat.messages.length === 0 ? (
//                 <div className="flex items-center justify-center h-full">
//                   <p className="text-gray-500">No messages yet. Start the conversation!</p>
//                 </div>
//               ) : (
//                 currentChat.messages.map(msg => (
//                   <div 
//                     key={msg.id} 
//                     className={`mb-4 max-w-3/4 ${
//                       msg.senderId === userId ? 'ml-auto' : 'mr-auto'
//                     }`}
//                   >
//                     <div className={`p-3 rounded-lg ${
//                       msg.senderId === userId ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'
//                     }`}>
//                       <div className="flex justify-between items-center mb-1">
//                         <span className={`font-medium ${
//                           msg.senderId === userId ? 'text-blue-100' : 'text-gray-700'
//                         }`}>
//                           {msg.sender.name}
//                         </span>
//                         <span className={`text-xs ${
//                           msg.senderId === userId ? 'text-blue-100' : 'text-gray-500'
//                         }`}>
//                           {formatDateTime(msg.createdAt)}
//                         </span>
//                       </div>
//                       <p className="break-words">{msg.content}</p>
                      
//                       {/* Attachments */}
//                       {msg.attachments && msg.attachments.map(attachment => 
//                         renderAttachment(attachment)
//                       )}
                      
//                       {/* Read indicators */}
//                       {msg.senderId === userId && msg.readBy && msg.readBy.length > 0 && (
//                         <div className="flex justify-end mt-1">
//                           <Check size={16} className="text-blue-100" />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))
//               )}
//               <div ref={messagesEndRef} />
//             </div>
            
//             {/* Message Input */}
//             <div className="p-4 bg-white border-t border-gray-200">
//               {file && (
//                 <div className="mb-2 p-2 bg-gray-100 rounded flex justify-between items-center">
//                   <span className="text-sm truncate">{file.name}</span>
//                   <button 
//                     onClick={() => setFile(null)}
//                     className="text-red-500 text-sm ml-2"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               )}
//               <div className="flex gap-2">
//                 <button 
//                   onClick={triggerFileInput}
//                   className="p-2 rounded-full hover:bg-gray-100"
//                 >
//                   <Paperclip size={20} />
//                 </button>
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleFileChange}
//                   className="hidden"
//                 />
//                 <input
//                   type="text"
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Type a message..."
//                   className="flex-1 p-2 border border-gray-300 rounded-l"
//                   onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
//                 />
//                 <button
//                   onClick={sendMessage}
//                   disabled={!message.trim() && !file}
//                   className="bg-blue-500 text-white p-2 rounded-r flex items-center"
//                 >
//                   <Send size={20} />
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex items-center justify-center h-full text-gray-500">
//             Select a chat to start messaging
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Chat;


import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Send, Paperclip, Check, CheckCheck, Download, FileText, Image } from 'lucide-react';
import { useParams } from 'react-router-dom';

// Types
interface User {
  id: string;
  name: string;
}

interface MessageRead {
  userId: string;
}

interface ChatAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
  attachments: ChatAttachment[];
  readBy: MessageRead[];
}

interface ChatParticipant {
  userId: string;
  user: User;
}

interface Chat {
  id: string;
  name: string;
  type: 'TEAM' | 'DIRECT';
  teamId?: string;
  team?: { name: string };
  updatedAt: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  _count?: {
    messages: number;
  };
}





const Chat: React.FC = () => {
  const { userId, teamId } = useParams<{ userId: string; teamId?: string }>(); 
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user chats
  useEffect(() => {
    fetchChats();
    fetchUnreadCounts();

    // Set up polling for unread counts
    const interval = setInterval(fetchUnreadCounts, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats`, { withCredentials: true });
      setChats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats/unread/count`, { withCredentials: true });
      const countsObj: Record<string, number> = {};
      response.data.forEach((item: { chatId: string; unreadCount: number }) => {
        countsObj[item.chatId] = item.unreadCount;
      });
      setUnreadCounts(countsObj);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats/${chatId}`, { withCredentials: true });
      setCurrentChat(response.data);
      markMessagesAsRead(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chat:', error);
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (chat: Chat) => {
    if (!chat || chat.messages.length === 0) return;

    // Get unread message IDs
    const unreadMessageIds = chat.messages
      .filter(message => message.senderId !== userId && !message.readBy.some(read => read.userId === userId))
      .map(message => message.id);

    if (unreadMessageIds.length === 0) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chats/${chat.id}/read`, { messageIds: unreadMessageIds }, { withCredentials: true });
      fetchUnreadCounts(); // Update unread counts
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if ((!message.trim() && !file) || !currentChat) return;

    try {
      if (file) {
        await sendAttachment();
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chats/${currentChat.id}/messages`, { content: message }, { withCredentials: true });
      }
      
      setMessage('');
      setFile(null);
      
      // Refresh the current chat to show the new message
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/chats/${currentChat.id}`, { withCredentials: true });
      setCurrentChat(response.data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendAttachment = async () => {
    if (!file || !currentChat) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chats/${currentChat.id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const createTeamChat = async () => {
    if (!teamId) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/chats/team`, { teamId, name: `${teamId} Team Chat` }, { withCredentials: true });
      fetchChats();
    } catch (error) {
      console.error('Error creating team chat:', error);
    }
  };

  const renderAttachment = (attachment: ChatAttachment) => {
    const isImage = attachment.fileType.startsWith('image/');
    
    return (
      <div key={attachment.id} className="flex flex-col border rounded p-3 mt-2 bg-gray-50 shadow-sm">
        {isImage ? (
          <div className="mb-2">
            <img 
              src={attachment.cloudinaryUrl} 
              alt={attachment.fileName} 
              className="max-h-48 object-contain rounded" 
            />
          </div>
        ) : (
          <div className="flex items-center mb-2">
            <FileText size={24} className="text-blue-600 mr-2" />
            <span className="font-medium text-lg truncate">{attachment.fileName}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">{formatFileSize(attachment.fileSize)}</span>
          <a 
            href={attachment.cloudinaryUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-blue-600 font-medium text-sm hover:underline"
          >
            <Download size={16} className="mr-1" />
            Download
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Chat List Sidebar */}
      <div className="w-1/4 bg-gradient-to-b from-indigo-800 to-blue-900 border-r border-indigo-900 p-4 overflow-y-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-white">Conversations</h2>
        
        {teamId && (
          <button 
            onClick={createTeamChat}
            className="w-full bg-white-500 hover:bg-blue-600 text-white py-3 rounded-lg mb-6 font-medium transition-colors duration-200 shadow-md"
          >
            Create Team Chat
          </button>
        )}
        
        {chats.length === 0 && !loading ? (
          <p className="text-indigo-200 text-center mt-8 text-lg">No chats available</p>
        ) : (
          <ul className="space-y-3">
            {chats.map(chat => (
              <li 
                key={chat.id} 
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-indigo-700 ${
                  currentChat?.id === chat.id ? 'bg-indigo-600 shadow-md' : 'bg-indigo-800/70'
                }`}
                onClick={() => selectChat(chat.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg text-white">{chat.name || chat.team?.name}</span>
                  {unreadCounts[chat.id] > 0 && (
                    <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full font-bold shadow-sm">
                      {unreadCounts[chat.id]}
                    </span>
                  )}
                </div>
                {chat.messages && chat.messages[0] && (
                  <div className="mt-1">
                    <p className="text-indigo-200 text-sm truncate">
                      <span className="font-medium">{chat.messages[0].sender.name}:</span> {chat.messages[0].content}
                    </p>
                    <p className="text-xs text-indigo-300 mt-1">
                      {chat.updatedAt && formatDateTime(chat.updatedAt)}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Chat Area */}
      <div className="w-3/4 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{currentChat.name || currentChat.team?.name}</h3>
                <p className="text-sm text-gray-600">
                  {currentChat.participants.length} participants
                  
                </p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              {currentChat.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-lg font-medium">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                currentChat.messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`mb-6 max-w-3/4 ${
                      msg.senderId === userId ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div className={`p-4 rounded-2xl shadow-md ${
                      msg.senderId === userId 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
                        : 'bg-white border border-gray-100'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold text-lg ${
                          msg.senderId === userId ? 'text-blue-100' : 'text-gray-800'
                        }`}>
                          {msg.sender.name}
                        </span>
                        <span className={`text-sm ${
                          msg.senderId === userId ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="break-words text-lg leading-relaxed">{msg.content}</p>
                      
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3">
                          {msg.attachments.map(attachment => renderAttachment(attachment))}
                        </div>
                      )}
                      
                      {/* Read indicators - improved visibility */}
                    
                      {msg.senderId === userId && (
                     <div className="flex justify-end mt-2">
                     {Array.isArray(msg.readBy) && msg.readBy.length > 0 && msg.readBy.some(read => read.userId !== userId) ? (
                       <div className="flex items-center tooltip" title="Read by others">
                         <CheckCheck size={18} className="text-blue-200" />
                         <span className="ml-1 text-xs text-blue-200">Read</span>
                       </div>
                     ) : (
                       <div className="flex items-center">
                         <Check size={18} className="text-blue-300 opacity-70" />
                         <span className="ml-1 text-xs text-blue-300 opacity-70">Sent</span>
                              </div>
                            )}
                          </div>
                        )}
                    











                    
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
              {file && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg flex justify-between items-center border border-blue-200">
                  <div className="flex items-center">
                    {file.type.startsWith('image/') ? (
                      <Image size={20} className="text-blue-600 mr-2" />
                    ) : (
                      <FileText size={20} className="text-blue-600 mr-2" />
                    )}
                    <span className="text-gray-800 font-medium truncate">{file.name}</span>
                    <span className="ml-2 text-sm text-gray-500">({formatFileSize(file.size)})</span>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-red-500 font-medium text-sm ml-2 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={triggerFileInput}
                  className="p-3 rounded-full hover:bg-gray-100 text-blue-600 transition-colors"
                  title="Attach a file"
                >
                  <Paperclip size={24} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-300 rounded-l-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() && !file}
                  className={`bg-blue-600 text-white p-3 rounded-r-lg flex items-center justify-center transition-colors ${
                    message.trim() || file ? 'hover:bg-blue-700' : 'opacity-70 cursor-not-allowed'
                  }`}
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Chat</h3>
              <p className="text-gray-600 text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;




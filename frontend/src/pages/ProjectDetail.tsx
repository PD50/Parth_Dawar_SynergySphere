import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { projectApi, taskApi, messageApi } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const projectSocket = useSocket({ namespace: 'project' });
  const messageSocket = useSocket({ namespace: 'message' });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  
  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        
        // Fetch project details
        const projectData = await projectApi.getProject(id);
        setProject(projectData);
        
        // Fetch tasks for this project
        const tasksData = await taskApi.getTasks(id);
        setTasks(tasksData);
        
        // Fetch messages for this project
        const messagesData = await messageApi.getMessages(id);
        setMessages(messagesData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id]);
  
  // Socket.IO event listeners
  useEffect(() => {
    if (!id || !project) return;
    
    // Join project room
    projectSocket.emit('join-project', id);
    messageSocket.emit('join-chat', id);
    
    // Listen for task updates
    projectSocket.on('task-updated', (updatedTask) => {
      setTasks((prevTasks) => {
        const taskIndex = prevTasks.findIndex((task) => task._id === updatedTask._id);
        
        if (taskIndex !== -1) {
          const newTasks = [...prevTasks];
          newTasks[taskIndex] = updatedTask;
          return newTasks;
        }
        
        return [...prevTasks, updatedTask];
      });
    });
    
    // Listen for new messages
    messageSocket.on('new-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    
    // Cleanup: leave rooms when component unmounts
    return () => {
      projectSocket.emit('leave-project', id);
      messageSocket.emit('leave-chat', id);
      projectSocket.off('task-updated');
      messageSocket.off('new-message');
    };
  }, [id, project, projectSocket, messageSocket]);
  
  // Send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !id || !user) return;
    
    try {
      const messageData = {
        content: newMessage,
        project: id,
      };
      
      // Send message to API
      const createdMessage = await messageApi.sendMessage(messageData);
      
      // Emit socket event
      messageSocket.emit('send-message', {
        ...createdMessage,
        projectId: id,
      });
      
      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Not Found</h2>
              <p className="text-gray-600 mb-4">The project you are looking for does not exist or you don't have access to it.</p>
              <button
                onClick={() => navigate('/projects')}
                className="btn btn-primary"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 p-4 md:p-6">
          {/* Project header */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description}</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${project.status === 'planning' && 'bg-blue-100 text-blue-800'}
                  ${project.status === 'in-progress' && 'bg-yellow-100 text-yellow-800'}
                  ${project.status === 'completed' && 'bg-green-100 text-green-800'}
                  ${project.status === 'archived' && 'bg-gray-100 text-gray-800'}
                `}>
                  {project.status.replace('-', ' ')}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Owner:</span>
              <div className="flex items-center">
                <img 
                  src={project.owner?.avatar || `https://ui-avatars.com/api/?name=${project.owner?.name}&background=0EA5E9&color=fff`} 
                  alt={project.owner?.name} 
                  className="w-6 h-6 rounded-full"
                />
                <span className="ml-2 text-sm font-medium">{project.owner?.name}</span>
              </div>
              
              <span className="ml-4 text-sm text-gray-600">Members:</span>
              <div className="flex -space-x-2">
                {project.members.map((member: any) => (
                  <img 
                    key={member.user._id}
                    src={member.user?.avatar || `https://ui-avatars.com/api/?name=${member.user?.name}&background=0EA5E9&color=fff`} 
                    alt={member.user?.name} 
                    className="w-6 h-6 rounded-full border border-white"
                    title={`${member.user?.name} (${member.role})`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'tasks'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('tasks')}
                >
                  Tasks
                </button>
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'chat'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('chat')}
                >
                  Chat
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            <div className="p-4">
              {activeTab === 'tasks' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Project Tasks</h2>
                    <button className="btn btn-primary">Add Task</button>
                  </div>
                  
                  {tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No tasks yet. Create one to get started!</p>
                  ) : (
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div key={task._id} className="border border-gray-200 rounded-md p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{task.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            </div>
                            <div className="flex items-center">
                              <span className={`
                                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${task.status === 'todo' && 'bg-gray-100 text-gray-800'}
                                ${task.status === 'in-progress' && 'bg-yellow-100 text-yellow-800'}
                                ${task.status === 'review' && 'bg-purple-100 text-purple-800'}
                                ${task.status === 'completed' && 'bg-green-100 text-green-800'}
                              `}>
                                {task.status.replace('-', ' ')}
                              </span>
                              <span className={`
                                ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${task.priority === 'low' && 'bg-blue-100 text-blue-800'}
                                ${task.priority === 'medium' && 'bg-yellow-100 text-yellow-800'}
                                ${task.priority === 'high' && 'bg-orange-100 text-orange-800'}
                                ${task.priority === 'urgent' && 'bg-red-100 text-red-800'}
                              `}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 text-sm">
                            <div className="flex items-center">
                              <span className="text-gray-500">Assigned to:</span>
                              {task.assignedTo ? (
                                <div className="flex items-center ml-2">
                                  <img 
                                    src={task.assignedTo?.avatar || `https://ui-avatars.com/api/?name=${task.assignedTo?.name}&background=0EA5E9&color=fff`} 
                                    alt={task.assignedTo?.name} 
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="ml-1">{task.assignedTo?.name}</span>
                                </div>
                              ) : (
                                <span className="ml-2 text-gray-500">Unassigned</span>
                              )}
                            </div>
                            
                            {task.dueDate && (
                              <div className="text-gray-500">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'chat' && (
                <div className="h-[calc(100vh-24rem)]">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Chat</h2>
                  
                  {/* Messages container */}
                  <div className="h-[calc(100%-8rem)] overflow-y-auto mb-4 space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
                    ) : (
                      messages.map((message) => (
                        <div 
                          key={message._id} 
                          className={`flex ${message.sender._id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`
                            max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2
                            ${message.sender._id === user?.id 
                              ? 'bg-primary-100 text-primary-900 rounded-br-none' 
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'}
                          `}>
                            {message.sender._id !== user?.id && (
                              <div className="flex items-center mb-1">
                                <img 
                                  src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${message.sender?.name}&background=0EA5E9&color=fff`} 
                                  alt={message.sender?.name} 
                                  className="w-4 h-4 rounded-full"
                                />
                                <span className="ml-1 text-xs font-medium">{message.sender?.name}</span>
                              </div>
                            )}
                            <p>{message.content}</p>
                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Message input */}
                  <form onSubmit={sendMessage} className="mt-4">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input flex-1"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="ml-2 btn btn-primary"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

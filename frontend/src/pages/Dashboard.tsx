import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { projectApi, taskApi } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent projects
        const projectsData = await projectApi.getProjects();
        setRecentProjects(projectsData.slice(0, 3)); // Get 3 most recent projects
        
        // Fetch assigned tasks
        const tasksData = await taskApi.getTasks();
        setAssignedTasks(tasksData.filter((task: any) => 
          task.assignedTo?._id === user?.id && task.status !== 'completed'
        ).slice(0, 5)); // Get 5 most recent incomplete tasks
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 p-4 md:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Welcome Card */}
              <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900">Welcome back, {user?.name}!</h2>
                <p className="text-gray-600 mt-2">
                  This is your dashboard where you can see an overview of your projects and tasks.
                </p>
              </div>
              
              {/* Recent Projects */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                  <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm">
                    View All
                  </Link>
                </div>
                
                {recentProjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No projects yet. Create one to get started!</p>
                ) : (
                  <div className="space-y-4">
                    {recentProjects.map(project => (
                      <Link key={project._id} to={`/projects/${project._id}`}>
                        <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900">{project.name}</h3>
                            <span className={`
                              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${project.status === 'planning' && 'bg-blue-100 text-blue-800'}
                              ${project.status === 'in-progress' && 'bg-yellow-100 text-yellow-800'}
                              ${project.status === 'completed' && 'bg-green-100 text-green-800'}
                              ${project.status === 'archived' && 'bg-gray-100 text-gray-800'}
                            `}>
                              {project.status.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                        </div>
                      </Link>
                    ))}
                    
                    <Link 
                      to="/projects" 
                      className="block text-center py-2 border border-dashed border-gray-300 rounded-md text-primary-600 hover:text-primary-700 hover:border-primary-300 transition-colors"
                    >
                      View all projects
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Assigned Tasks */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
                </div>
                
                {assignedTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks assigned to you.</p>
                ) : (
                  <div className="space-y-4">
                    {assignedTasks.map(task => (
                      <Link key={task._id} to={`/projects/${task.project._id}`}>
                        <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                            <div className="flex space-x-2">
                              <span className={`
                                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${task.status === 'todo' && 'bg-gray-100 text-gray-800'}
                                ${task.status === 'in-progress' && 'bg-yellow-100 text-yellow-800'}
                                ${task.status === 'review' && 'bg-purple-100 text-purple-800'}
                              `}>
                                {task.status.replace('-', ' ')}
                              </span>
                              <span className={`
                                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${task.priority === 'low' && 'bg-blue-100 text-blue-800'}
                                ${task.priority === 'medium' && 'bg-yellow-100 text-yellow-800'}
                                ${task.priority === 'high' && 'bg-orange-100 text-orange-800'}
                                ${task.priority === 'urgent' && 'bg-red-100 text-red-800'}
                              `}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>Project: {task.project.name}</span>
                            {task.dueDate && (
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/projects" className="btn btn-primary text-center">
                    View All Projects
                  </Link>
                  <Link to="/projects" className="btn btn-primary text-center">
                    Create New Project
                  </Link>
                  <a 
                    href="https://github.com/yourusername/motion-gpt" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline text-center"
                  >
                    View Documentation
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

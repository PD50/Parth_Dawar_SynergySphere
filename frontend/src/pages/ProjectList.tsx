import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { projectApi } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const ProjectList: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planning',
  });
  
  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projectsData = await projectApi.getProjects();
        setProjects(projectsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };
  
  // Create new project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const createdProject = await projectApi.createProject(newProject);
      setProjects([createdProject, ...projects]);
      setShowModal(false);
      setNewProject({
        name: '',
        description: '',
        status: 'planning',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error creating project:', error);
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 md:mt-0 btn btn-primary"
            >
              Create Project
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Projects Yet</h2>
              <p className="text-gray-600 mb-4">Create your first project to get started.</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link 
                  key={project._id} 
                  to={`/projects/${project._id}`}
                  className="block"
                >
                  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
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
                    
                    <p className="text-gray-600 mt-2 line-clamp-2">{project.description}</p>
                    
                    <div className="mt-4">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">Owner:</span>
                        <div className="flex items-center ml-2">
                          <img 
                            src={project.owner?.avatar || `https://ui-avatars.com/api/?name=${project.owner?.name}&background=0EA5E9&color=fff`} 
                            alt={project.owner?.name} 
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="ml-1 text-xs">{project.owner?.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500">Members:</span>
                          <div className="flex -space-x-1 ml-2">
                            {project.members.slice(0, 3).map((member: any) => (
                              <img 
                                key={member.user._id}
                                src={member.user?.avatar || `https://ui-avatars.com/api/?name=${member.user?.name}&background=0EA5E9&color=fff`} 
                                alt={member.user?.name} 
                                className="w-4 h-4 rounded-full border border-white"
                              />
                            ))}
                            {project.members.length > 3 && (
                              <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 border border-white">
                                +{project.members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <span className="text-xs text-gray-500">
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newProject.name}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Enter project name"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newProject.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="input"
                  placeholder="Enter project description"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={newProject.status}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" color="white" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;

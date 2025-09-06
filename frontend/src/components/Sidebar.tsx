import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-md z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-0
      `}>
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="20" fill="#0EA5E9"/>
              <path d="M30 30L70 70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
              <path d="M30 70L70 30" stroke="white" strokeWidth="8" strokeLinecap="round"/>
              <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="5" fill="none"/>
            </svg>
            <span className="text-lg font-bold text-gray-900">Motion-GPT</span>
          </div>
          
          {/* Close button for mobile */}
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* User info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0EA5E9&color=fff`} 
                alt={user.name} 
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation links */}
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `
                  flex items-center px-4 py-2 rounded-md
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/projects" 
                className={({ isActive }) => `
                  flex items-center px-4 py-2 rounded-md
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `
                  flex items-center px-4 py-2 rounded-md
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and app name */}
        <Link to="/" className="flex items-center space-x-2">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="20" fill="#0EA5E9"/>
            <path d="M30 30L70 70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
            <path d="M30 70L70 30" stroke="white" strokeWidth="8" strokeLinecap="round"/>
            <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="5" fill="none"/>
          </svg>
          <span className="text-xl font-bold text-gray-900">Motion-GPT</span>
        </Link>
        
        {/* Navigation */}
        {user && (
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
              Dashboard
            </Link>
            <Link to="/projects" className="text-gray-700 hover:text-primary-600 transition-colors">
              Projects
            </Link>
          </nav>
        )}
        
        {/* User menu */}
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <button className="flex items-center space-x-2">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0EA5E9&color=fff`} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:inline text-sm font-medium text-gray-700">{user.name}</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Your Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;

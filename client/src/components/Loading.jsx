import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const Loading = ({ fullScreen = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get the 'next' parameter from the URL
    const params = new URLSearchParams(location.search);
    const nextPath = params.get('next');
    
    if (nextPath) {
      // Wait for 2 seconds before redirecting to allow the webhook to process
      const timer = setTimeout(() => {
        navigate(`/${nextPath}`);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [navigate, location]);

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center min-h-screen bg-white/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center h-full min-h-[70vh]';

  return (
    <div className={containerClasses}>
      <div className="relative">
        <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent'></div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-gray-600">
          Laddar...
        </div>
      </div>
    </div>
  )
}

export default Loading

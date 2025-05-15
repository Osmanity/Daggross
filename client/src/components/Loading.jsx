import React from 'react'

const Loading = ({ fullScreen = false }) => {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex justify-center items-center'
    : 'flex justify-center items-center h-full';

  return (
    <div className={containerClasses}>
      <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent'></div>
    </div>
  )
}

export default Loading

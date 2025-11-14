import React from 'react';

const LoadingScreen = ({ message = 'Preparing your dashboard…' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" aria-hidden />
      <p>{message}</p>
    </div>
  );
};

export default LoadingScreen;

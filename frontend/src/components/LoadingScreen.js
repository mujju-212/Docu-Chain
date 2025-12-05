import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Initializing secure connection..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Logo with Spinning Ring */}
        <div className="loading-logo">
          <div className="loading-ring"></div>
          <div className="loading-icon">
            <i className="ri-shield-check-line"></i>
          </div>
        </div>

        {/* Brand Name */}
        <div className="loading-brand">
          <h1>Docu<span>Chain</span></h1>
          <p>Blockchain Document Management</p>
        </div>

        {/* Progress Bar */}
        <div className="loading-progress">
          <div className="loading-progress-bar"></div>
        </div>

        {/* Blockchain Chain Animation */}
        <div className="loading-chain">
          <div className="chain-block"></div>
          <div className="chain-link"></div>
          <div className="chain-block"></div>
          <div className="chain-link"></div>
          <div className="chain-block"></div>
          <div className="chain-link"></div>
          <div className="chain-block"></div>
          <div className="chain-link"></div>
          <div className="chain-block"></div>
        </div>

        {/* Status Text */}
        <div className="loading-status">{message}</div>
      </div>
    </div>
  );
};

export default LoadingScreen;

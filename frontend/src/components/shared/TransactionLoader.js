import React from 'react';
import './TransactionLoader.css';

/**
 * TransactionLoader - A modern blockchain transaction/loading animation component
 * with step-by-step timeline feedback
 * 
 * Usage:
 * <TransactionLoader 
 *   isVisible={true}
 *   variant="blockchain" 
 *   title="Processing Transaction"
 *   message="Please wait..."
 *   progress={50}
 *   currentStep={2}
 *   steps={['Preparing', 'Blockchain', 'Database', 'Complete']}
 * />
 */

const TransactionLoader = ({ 
  isVisible = false, 
  variant = 'blockchain', 
  title = 'Processing...', 
  message = '',
  progress = 0,
  showProgress = true,
  overlay = true,
  currentStep = 0,
  steps = [],
  onCancel = null
}) => {
  if (!isVisible) return null;

  // Default steps based on variant if not provided
  const getDefaultSteps = () => {
    switch (variant) {
      case 'blockchain':
        return [
          { label: 'Preparing', icon: 'ri-file-list-3-line' },
          { label: 'Wallet Confirmation', icon: 'ri-wallet-3-line' },
          { label: 'Processing', icon: 'ri-loader-4-line' },
          { label: 'Complete', icon: 'ri-checkbox-circle-line' }
        ];
      case 'upload':
        return [
          { label: 'Preparing', icon: 'ri-file-add-line' },
          { label: 'Uploading to IPFS', icon: 'ri-cloud-line' },
          { label: 'Recording on Chain', icon: 'ri-links-line' },
          { label: 'Finalizing', icon: 'ri-save-line' },
          { label: 'Complete', icon: 'ri-checkbox-circle-line' }
        ];
      case 'approval':
        return [
          { label: 'Preparing', icon: 'ri-draft-line' },
          { label: 'Wallet Confirmation', icon: 'ri-wallet-3-line' },
          { label: 'Generating Stamp', icon: 'ri-stamp-line' },
          { label: 'Recording', icon: 'ri-database-2-line' },
          { label: 'Complete', icon: 'ri-checkbox-circle-line' }
        ];
      case 'download':
        return [
          { label: 'Fetching', icon: 'ri-download-cloud-line' },
          { label: 'Decrypting', icon: 'ri-lock-unlock-line' },
          { label: 'Complete', icon: 'ri-checkbox-circle-line' }
        ];
      default:
        return [
          { label: 'Starting', icon: 'ri-play-circle-line' },
          { label: 'Processing', icon: 'ri-loader-4-line' },
          { label: 'Complete', icon: 'ri-checkbox-circle-line' }
        ];
    }
  };

  // Use provided steps or default ones
  const displaySteps = steps.length > 0 
    ? steps.map(s => typeof s === 'string' ? { label: s, icon: 'ri-circle-line' } : s)
    : getDefaultSteps();

  // Calculate current step from progress if not explicitly provided
  const calculateCurrentStep = () => {
    if (currentStep > 0) return currentStep;
    const stepSize = 100 / displaySteps.length;
    return Math.min(Math.floor(progress / stepSize), displaySteps.length - 1);
  };

  const activeStep = calculateCurrentStep();

  const getIcon = () => {
    switch (variant) {
      case 'blockchain':
        return (
          <div className="tx-blockchain-anim">
            <div className="tx-chain-ring ring-1"></div>
            <div className="tx-chain-ring ring-2"></div>
            <div className="tx-chain-ring ring-3"></div>
            <div className="tx-chain-core">
              <i className="ri-links-line"></i>
            </div>
          </div>
        );
      case 'upload':
        return (
          <div className="tx-upload-anim">
            <div className="tx-cloud">
              <i className="ri-cloud-line"></i>
            </div>
            <div className="tx-upload-arrow">
              <i className="ri-arrow-up-line"></i>
            </div>
            <div className="tx-upload-particles">
              <span></span><span></span><span></span>
            </div>
          </div>
        );
      case 'approval':
        return (
          <div className="tx-approval-anim">
            <div className="tx-stamp">
              <i className="ri-checkbox-circle-line"></i>
            </div>
            <div className="tx-stamp-effect"></div>
          </div>
        );
      case 'download':
        return (
          <div className="tx-download-anim">
            <div className="tx-download-icon">
              <i className="ri-download-2-line"></i>
            </div>
            <div className="tx-download-bar"></div>
          </div>
        );
      default:
        return (
          <div className="tx-default-anim">
            <div className="tx-spinner"></div>
          </div>
        );
    }
  };

  return (
    <div className={`tx-loader-overlay ${overlay ? 'tx-fullscreen' : 'tx-inline'}`}>
      <div className="tx-loader-card">
        {/* Main Animation */}
        <div className={`tx-anim-container tx-${variant}`}>
          {getIcon()}
        </div>
        
        {/* Title and Message */}
        <div className="tx-text-content">
          <h3 className="tx-title">{title}</h3>
          <p className="tx-message">{message}</p>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="tx-progress-container">
            <div className="tx-progress-bar">
              <div 
                className="tx-progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              >
                <div className="tx-progress-glow"></div>
              </div>
            </div>
            <div className="tx-progress-info">
              <span className="tx-progress-percent">{Math.round(progress)}%</span>
              <span className="tx-progress-status">
                {progress < 100 ? 'In Progress' : 'Complete'}
              </span>
            </div>
          </div>
        )}

        {/* Step Timeline */}
        <div className="tx-timeline">
          {displaySteps.map((step, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            const isPending = index > activeStep;
            
            return (
              <React.Fragment key={index}>
                <div className={`tx-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}>
                  <div className="tx-step-icon">
                    {isCompleted ? (
                      <i className="ri-check-line"></i>
                    ) : (
                      <i className={step.icon || 'ri-circle-line'}></i>
                    )}
                  </div>
                  <span className="tx-step-label">{step.label}</span>
                  {isActive && <div className="tx-step-pulse"></div>}
                </div>
                {index < displaySteps.length - 1 && (
                  <div className={`tx-step-connector ${isCompleted ? 'completed' : ''}`}>
                    <div className="tx-connector-line"></div>
                    {isCompleted && <div className="tx-connector-fill"></div>}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Action Indicator */}
        <div className="tx-current-action">
          <div className="tx-action-dot"></div>
          <span>{displaySteps[activeStep]?.label || 'Processing'}...</span>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button className="tx-cancel-btn" onClick={onCancel}>
            <i className="ri-close-line"></i> Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionLoader;

import React, { useState } from 'react';

const DisconnectButton = ({ 
  isConnected, 
  onConnect, 
  onDisconnect, 
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    
    try {
      if (isConnected) {
        await onDisconnect();
      } else {
        await onConnect();
      }
    } catch (error) {
      console.error('Button action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return isConnected ? 'DISCONNECTING...' : 'CONNECTING...';
    return isConnected ? 'DISCONNECT' : 'CONNECT';
  };

  const getButtonClass = () => {
    let baseClass = 'disconnect-button';
    if (isLoading) baseClass += ' pulse';
    if (!isConnected && !isLoading) baseClass += ' connect-mode';
    return baseClass;
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={isConnected ? 'Disconnect from server' : 'Connect to server'}
    >
      {getButtonText()}
    </button>
  );
};

export default DisconnectButton;


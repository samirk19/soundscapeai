import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div 
      className="error-message" 
      role="alert" 
      aria-live="assertive"
    >
      <svg 
        className="error-icon" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" />
      </svg>
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
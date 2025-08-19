// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="idd-error-boundary">
          <p>Sorry, something went wrong while rendering the lesson plan.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

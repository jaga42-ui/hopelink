import React from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("System Crash Detected:", error, errorInfo);
  }

  resetSystem = () => {
    this.setState({ hasError: false });
    window.location.href = '/dashboard'; // Force a hard reboot to the dashboard
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans selection:bg-teal-500 selection:text-white">
          <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-red-900/20 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center text-4xl text-red-500 mx-auto mb-6 shadow-inner">
                <FaExclamationTriangle className="animate-pulse" />
              </div>
              
              <h1 className="text-2xl font-black tracking-tight mb-2 text-white">System Malfunction</h1>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                A critical error occurred while rendering this interface. The transmission has been interrupted.
              </p>

              {/* Developer Error Output (Hidden on small screens, useful for debugging) */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-[10px] text-red-400 font-mono text-left overflow-x-auto mb-8 hidden md:block opacity-70">
                {this.state.errorMessage}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.resetSystem}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
                >
                  <FaRedo className="text-lg" /> Reboot System
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-slate-700 active:scale-95"
                >
                  <FaHome className="text-lg" /> Return to Base
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
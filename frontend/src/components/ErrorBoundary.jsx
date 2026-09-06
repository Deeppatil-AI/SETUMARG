import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[calc(100vh-100px)] min-h-[500px] flex items-center justify-center p-6 bg-[#1C2B22] text-[#F1EDE2]">
          <div className="max-w-lg w-full bg-[#F1EDE2] text-[#1C2B22] rounded-lg shadow-2xl border-2 border-[#A63A32] p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[#3E5C63]/25 pb-3">
              <div className="p-2 rounded bg-[#A63A32]/15 text-[#A63A32]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#A63A32]">
                  {this.props.title || 'Map Rendering Suspended'}
                </h3>
                <p className="text-xs text-[#3E5C63]">
                  A component error occurred while rendering the spatial visualization layer.
                </p>
              </div>
            </div>

            <div className="bg-[#E5DEC9]/70 rounded p-3 text-xs font-mono text-[#1C2B22] overflow-x-auto border border-[#3E5C63]/20">
              <div className="font-bold text-[#A63A32] mb-1">
                {this.state.error?.toString() || 'Unknown runtime error'}
              </div>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-[#3E5C63] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#3E5C63]">
                Try reloading this view or resetting local state.
              </span>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#1C2B22] text-[#F1EDE2] rounded font-sans text-xs font-semibold hover:bg-[#3E5C63] transition flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload View</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

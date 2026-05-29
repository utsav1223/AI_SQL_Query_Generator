import { Component } from "react";
import { AlertTriangle } from "lucide-react";

class ClerkFeatureBoundaryBase extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ClerkFeatureFallback />;
    }

    return this.props.children;
  }
}

export default function ClerkFeatureBoundary(props) {
  return <ClerkFeatureBoundaryBase {...props} />;
}

function ClerkFeatureFallback() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
        <p>This Clerk feature is not enabled for this application yet.</p>
      </div>
    </div>
  );
}

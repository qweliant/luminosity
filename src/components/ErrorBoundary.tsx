import React from "react";

interface Props {
  /** Short label naming the region — surfaced in the fallback copy. */
  region: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  info: React.ErrorInfo | null;
  copied: boolean;
}

/**
 * Catches render errors in a subtree and shows a small editorial fallback in
 * the same visual register as the rest of the app. Resets when the user
 * clicks "try again" — the child remounts. Includes a copy-diagnostic
 * button so the user can paste an error report when reaching out — there's
 * no telemetry, so this is the only channel back.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null, info: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info });
    if (import.meta.env.DEV) {
      console.error(`[${this.props.region}] render error`, error, info);
    }
  }

  reset = () => this.setState({ error: null, info: null, copied: false });

  copyDiagnostic = async () => {
    const { error, info } = this.state;
    if (!error) return;
    const report = [
      `Luminosity diagnostic`,
      `region: ${this.props.region}`,
      `time: ${new Date().toISOString()}`,
      `url: ${typeof location !== "undefined" ? location.href : "n/a"}`,
      `ua: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
      ``,
      `${error.name}: ${error.message}`,
      ``,
      `stack:`,
      error.stack ?? "(no stack)",
      ``,
      `component stack:`,
      info?.componentStack ?? "(no component stack)",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(report);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard API can fail under file:// or permission-denied. Fall back
      // to a printable textarea selection.
      const ta = document.createElement("textarea");
      ta.value = report;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-5 bg-white border border-[#3A1E2A]/15 rounded-[16px] text-[#3A1E2A] my-3">
        <div className="font-mono text-[9px] text-[#C24E6E] tracking-[0.18em] uppercase">
          {this.props.region} · hiccup
        </div>
        <p className="font-serif italic text-sm text-[#5A3645] mt-2 mb-3">
          Something in this section misrendered. Your data is safe — it's still
          in local storage. Try reloading, or click below to remount this
          section.
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={this.reset}
            className="text-xs text-[#C24E6E] underline underline-offset-2 hover:no-underline"
          >
            try again
          </button>
          <button
            type="button"
            onClick={this.copyDiagnostic}
            className="text-xs text-[#B391A0] underline underline-offset-2 hover:no-underline hover:text-[#C24E6E]"
          >
            {this.state.copied ? "copied ✿" : "copy diagnostic"}
          </button>
        </div>
      </div>
    );
  }
}

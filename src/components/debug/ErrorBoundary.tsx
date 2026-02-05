import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white p-10 font-mono">
                    <h1 className="text-2xl text-red-500 font-bold mb-4">Something went wrong.</h1>
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-xl mb-2">{this.state.error?.toString()}</h2>
                        <details className="whitespace-pre-wrap text-sm text-gray-400">
                            {this.state.errorInfo?.componentStack}
                        </details>
                    </div>
                    <button
                        className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                        onClick={() => window.location.reload()}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GeminiAssistant from '../../features/ai/GeminiAssistant';
import { useState } from 'react';

export default function Layout() {
    const [isGeminiOpen, setIsGeminiOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden relative">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onToggleGemini={() => setIsGeminiOpen(prev => !prev)} />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
            <GeminiAssistant isOpen={isGeminiOpen} onClose={() => setIsGeminiOpen(false)} />
        </div>
    );
}

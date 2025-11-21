import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { CipherInterface } from "./components/CipherInterface";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm h-16 flex justify-between items-center border-b border-red-900/30 shadow-lg px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">C</span>
          </div>
          <h2 className="text-xl font-semibold text-white">Cipher AI Assistant</h2>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md mx-auto">
          <Content />
        </div>
      </main>
      
      {/* Cipher Interface - only show when authenticated */}
      <Authenticated>
        <CipherInterface />
      </Authenticated>
      
      <Toaster theme="dark" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-5xl font-bold text-white">C</span>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">Cipher Voice Assistant</h1>
        <Authenticated>
          <div className="space-y-4">
            <p className="text-xl text-gray-300">
              Welcome back, {loggedInUser?.email ?? "friend"}!
            </p>
            <div className="bg-gray-900/50 rounded-lg p-6 shadow-lg border border-red-900/30">
              <h3 className="text-lg font-semibold mb-3 text-white">Getting Started</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Click <strong className="text-red-400">"Start Listening"</strong> in the floating interface</p>
                <p>• Try: "Play Riptide on YouTube"</p>
                <p>• Try: "What time is it?"</p>
                <p>• Try: "Search for weather forecast"</p>
                <p>• Try: "Calculate 25 times 4"</p>
                <p>• Try: "Open YouTube and Google"</p>
              </div>
              <div className="mt-4 p-3 bg-green-900/20 rounded border border-green-700/30">
                <p className="text-xs text-green-400">✨ Powered by Google Gemini AI</p>
                <p className="text-xs text-gray-400 mt-1">Natural language understanding for smart command processing</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Look for the draggable interface - you can move it around!
            </div>
          </div>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-gray-300">Sign in to start using Cipher</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </div>
  );
}

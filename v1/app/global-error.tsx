"use client";

import { useEffect } from "react";

export default function GlobalError({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
            <p className="mb-6">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button 
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
            >
              Try again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Go to homepage
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
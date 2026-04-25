import { useEffect, useState } from 'react';
import authService from '../../services/auth.service';

export default function GoogleCallback() {
    const [error, setError] = useState<string | null>(null);

  // In your frontend GoogleCallback component
useEffect(() => {
    const handleCallback = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                setError('Google login did not return a token.');
                return;
            }

            await authService.handleGoogleCallback(token);
            window.location.replace('/');
        } catch (err) {
            console.error('Google login callback failed:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to process Google login: ${message}`);
        }
    };

    handleCallback();
}, []);

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Processing your login...</p>
            </div>
        </div>
    );
} 

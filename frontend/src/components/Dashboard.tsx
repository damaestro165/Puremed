import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

export default function Dashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="max-w-4xl mx-auto mt-8 p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                    Logout
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-4 mb-4">
                    {user?.picture && (
                        <img
                            src={user.picture}
                            alt="Profile"
                            className="w-12 h-12 rounded-full"
                        />
                    )}
                    <div>
                        <p className="text-gray-600">Email: {user?.email}</p>
                        <p className="text-gray-600">Account type: {user?.provider || 'local'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 
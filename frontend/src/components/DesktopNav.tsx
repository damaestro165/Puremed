import { Link, useNavigate } from "react-router-dom"
import { MessageCircle, ShoppingCart, User } from 'lucide-react';
import ChatModal from "./ChatModal";
import authService from '../services/auth.service';

const DesktopNav = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  const handleProtectedAction = (action: string) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/${action}`);
    }
  };

  const handleChatClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault(); // Prevent the dialog from opening
      navigate('/login');
    }
    // If authenticated, let the dialog open naturally
  };

  return (
    <div className="hidden w-full lg:flex justify-between items-center">
      <Link to="/"> <img src="/logo.svg" alt="Logo" className="w-40 " /></Link>
      <div className="flex items-center justify-between gap-10 ml-auto">  
        {isAuthenticated ? (
          <div className="flex items-center space-x-2">
            <img
              src={user?.picture || 'https://ui-avatars.com/api/?name=' + user?.name}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-700 hover:text-[#3182CE]"
            >
              {user?.name}
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2"
          >
            <User/> 
            <span>Sign In</span>
          </button>
        )}
        <button
          onClick={() => handleProtectedAction('cart')}
          className="flex items-center gap-2"
        >
          <ShoppingCart/>
          <span>Cart</span>
        </button>
        <ChatModal>
          <button
            onClick={handleChatClick}
            className="flex items-center gap-2"
          >
            <MessageCircle/> 
            <span>Chat</span>
          </button>
        </ChatModal>
      </div>
    </div>
  )
}

export default DesktopNav
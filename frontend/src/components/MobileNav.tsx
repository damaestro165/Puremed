import { Link, useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AlignJustify, MessageCircle, ShoppingCart, User } from 'lucide-react'
import authService from '../services/auth.service';

const MobileNav = () => {
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

  return (
    <div className='flex lg:hidden justify-between items-center w-full'>
      <Link to="/"> <img src="/logo.svg" alt="Logo" className="w-36" /></Link>
      <Sheet>
        <SheetTrigger><AlignJustify/></SheetTrigger>
        <SheetContent className='flex flex-col gap-8 justify-center items-center'>
          {isAuthenticated ? (
            <div className="flex flex-col items-center space-y-2 w-3/4">
              <img
                src={user?.picture || 'https://ui-avatars.com/api/?name=' + user?.name}
                alt="Profile"
                className="w-12 h-12 rounded-full"
              />
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-full rounded-md"
              >
                <User/> 
                <span>{user?.name}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-3/4 rounded-md"
            >
              <User/> 
              <span>Sign In</span>
            </button>
          )}
          <button
            onClick={() => handleProtectedAction('cart')}
            className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-3/4 rounded-md"
          >
            <ShoppingCart/>
            <span>Cart</span>
          </button>
          <button 
            onClick={() => handleProtectedAction('chat')}
            className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-3/4 rounded-md"
          >
            <MessageCircle/> 
            <span>Chat</span>
          </button>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default MobileNav
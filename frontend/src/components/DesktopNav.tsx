import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from './ui/button'
import { MessageCircle, ShoppingCart, User, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import authService from '../services/auth.service'
import { useCartStore } from '../stores/cartStore'

const DesktopNav = () => {
  const navigate = useNavigate()
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUser()

  // Cart state
  const { cart, getCartItemsCount, initializeCart } = useCartStore()
  const itemsCount = getCartItemsCount()

  // Initialize cart when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && !cart) {
      initializeCart()
    }
  }, [isAuthenticated, cart, initializeCart])

  const handleProtectedAction = (action: string) => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      navigate(`/${action}`)
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/')
    window.location.reload() // Refresh to clear any cached state
  }

  return (
    <div className="hidden lg:flex justify-between items-center w-full">
      {/* Logo */}
      <Link to="/" className="flex-shrink-0">
        <img src="/logo.svg" alt="Logo" className="w-40" />
      </Link>

      {/* Navigation Items */}
      <div className="flex items-center gap-4">
        {/* Chat Button */}
        <Button
          onClick={() => handleProtectedAction('chat')}
          variant="ghost"
          className="flex items-center gap-2 text-gray-700 hover:text-[#3182CE] hover:bg-blue-50"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat</span>
        </Button>

        {/* Cart Button with Counter */}
        <Button
          onClick={() => handleProtectedAction('cart')}
          variant="ghost"
          className="flex items-center gap-2 text-gray-700 hover:text-[#3182CE] hover:bg-blue-50 relative"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {isAuthenticated && itemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse min-w-[20px]">
                {itemsCount > 99 ? '99+' : itemsCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Button>

        {/* User Authentication */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-[#3182CE] hover:bg-blue-50">
                <img
                  src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=3182CE&color=fff`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                />
                <span className="hidden xl:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-3">
                <img
                  src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=3182CE&color=fff`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                Dashboard
            </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              className="text-gray-700 hover:text-[#3182CE] hover:bg-blue-50"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-[#3182CE] hover:bg-[#2C5282] text-white"
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DesktopNav
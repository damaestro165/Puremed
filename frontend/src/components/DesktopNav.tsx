import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from './ui/button'
import { MessageCircle, ShoppingCart, User, LogOut, Bell } from 'lucide-react'
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
    window.location.reload()
  }

  return (
    <div className="hidden lg:flex justify-between items-center w-full">
      {/* Logo */}
      <Link to="/" className="flex-shrink-0 group">
        <img 
          src="/logo.svg" 
          alt="Logo" 
          className="w-40 group-hover:scale-105 transition-transform duration-200" 
        />
      </Link>

      {/* Navigation Items */}
      <div className="flex items-center gap-2">
        {/* Chat Button */}
        <Button
          onClick={() => handleProtectedAction('chat')}
          variant="ghost"
          className="flex items-center gap-3 text-gray-700 hover:text-[#3182CE] hover:bg-blue-50 px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105"
        >
          <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <MessageCircle className="w-4 h-4" />
          </div>
          <span>Chat</span>
        </Button>

        {/* Cart Button with Enhanced Counter */}
        <Button
          onClick={() => handleProtectedAction('cart')}
          variant="ghost"
          className="flex items-center gap-3 text-gray-700 hover:text-[#3182CE] hover:bg-blue-50 px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 relative"
        >
          <div className="relative p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <ShoppingCart className="w-4 h-4" />
            {isAuthenticated && itemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse min-w-[24px] border-2 border-white">
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
              <Button 
                variant="ghost" 
                className="flex items-center gap-3 text-gray-700 hover:text-[#3182CE] hover:bg-blue-50 px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105"
              >
                <div className="relative">
                  <img
                    src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=3182CE&color=fff`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-blue-200 shadow-sm"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <span className="hidden xl:inline font-medium">{user?.name?.split(' ')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white border border-gray-200 shadow-xl rounded-2xl p-2">
              <DropdownMenuLabel className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                <img
                  src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=3182CE&color=fff`}
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-blue-200 shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-[#2D3748]">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <User className="w-4 h-4 text-[#3182CE]" />
                </div>
                <span className="font-medium">Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-red-50 text-red-600 focus:text-red-600 transition-colors"
              >
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              className="text-gray-700 hover:text-[#3182CE] hover:bg-blue-50 px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5282] hover:to-blue-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
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
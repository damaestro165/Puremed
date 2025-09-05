import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AlignJustify, MessageCircle, ShoppingCart, User, LogOut, Home, Grid3X3 } from 'lucide-react'
import authService from '../services/auth.service'
import { useCartStore } from '../stores/cartStore'

const MobileNav = () => {
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

  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Home",
      action: () => navigate('/'),
      show: true
    },
    {
      icon: <Grid3X3 className="w-5 h-5" />,
      label: "Categories",
      action: () => navigate('/categories'),
      show: true
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Chat with Doctor",
      action: () => handleProtectedAction('chat'),
      show: true
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      label: "Cart",
      action: () => handleProtectedAction('cart'),
      show: true,
      badge: isAuthenticated && itemsCount > 0 ? (itemsCount > 99 ? '99+' : itemsCount.toString()) : null
    }
  ]

  return (
    <div className='flex lg:hidden justify-between items-center w-full'>
      <Link to="/" className="group"> 
        <img 
          src="/logo.svg" 
          alt="Logo" 
          className="w-36 group-hover:scale-105 transition-transform duration-200" 
        />
      </Link>
      
      <Sheet>
        <SheetTrigger asChild>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <AlignJustify className="w-6 h-6 text-gray-700" />
          </button>
        </SheetTrigger>
        <SheetContent className='w-80 bg-white p-0'>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#3182CE] to-blue-600 text-white">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <img
                    src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=fff&color=3182CE`}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                  />
                  <div>
                    <div className="font-bold text-lg">{user?.name}</div>
                    <div className="text-blue-100 text-sm">{user?.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-white/20 p-3 rounded-full w-fit mx-auto mb-3">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="font-bold text-lg">Welcome!</div>
                  <div className="text-blue-100 text-sm">Sign in to access all features</div>
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 p-6 space-y-2">
              {/* Menu Items */}
              {menuItems.map((item, index) => (
                item.show && (
                  <button
                    key={index}
                    onClick={item.action}
                    className="flex items-center gap-4 w-full p-4 text-left hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-[#3182CE] group-hover:text-white transition-all duration-200">
                      {item.icon}
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-[#3182CE] flex-1">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold min-w-[24px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              ))}

              {/* Authentication Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-4 w-full p-4 text-left hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    >
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-[#3182CE] group-hover:text-white transition-all duration-200">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-[#3182CE]">
                        Dashboard
                      </span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-4 w-full p-4 text-left hover:bg-red-50 rounded-xl transition-all duration-200 group"
                    >
                      <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-all duration-200">
                        <LogOut className="w-5 h-5 text-red-500 group-hover:text-white" />
                      </div>
                      <span className="font-medium text-red-600 group-hover:text-red-500">
                        Sign Out
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full p-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="w-full p-4 bg-gradient-to-r from-[#3182CE] to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-center text-sm text-gray-500">
                <div className="font-medium mb-1">Your Trusted Pharmacy</div>
                <div>Quality healthcare at your fingertips</div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
export default MobileNav
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AlignJustify, MessageCircle, ShoppingCart, User } from 'lucide-react'
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

  return (
    <div className='flex lg:hidden justify-between items-center w-full'>
      <Link to="/"> 
        <img src="/logo.svg" alt="Logo" className="w-36" />
      </Link>
      
      <Sheet>
        <SheetTrigger>
          <AlignJustify/>
        </SheetTrigger>
        <SheetContent className='flex flex-col gap-8 justify-center items-center'>
          {isAuthenticated ? (
            <div className="flex flex-col items-center space-y-2 w-3/4">
              
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-full rounded-md hover:bg-[#2C5282] transition-colors"
              >
                <img
                src={user?.picture || 'https://ui-avatars.com/api/?name=' + user?.name}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
                <span>{user?.name}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-3/4 rounded-md hover:bg-[#2C5282] transition-colors"
            >
              <User/> 
              <span>Sign In</span>
            </button>
          )}
          
          {/* Cart Button with Counter */}
          <button
            onClick={() => handleProtectedAction('cart')}
            className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-3/4 rounded-md hover:bg-[#2C5282] transition-colors relative"
          >
            <div className="relative">
              <ShoppingCart/>
              {isAuthenticated && itemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {itemsCount > 99 ? '99+' : itemsCount}
                </span>
              )}
            </div>
            <span>Cart</span>

          </button>
          
          <button 
            onClick={() => handleProtectedAction('chat')}
            className="flex items-center gap-2 p-5 bg-[#3182CE] text-white w-3/4 rounded-md hover:bg-[#2C5282] transition-colors"
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
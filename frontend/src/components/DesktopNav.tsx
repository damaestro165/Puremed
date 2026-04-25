import { Link, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Button } from "./ui/button"
import { ChevronDown, LogOut, MessageCircle, ShoppingCart, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import authService from "../services/auth.service"
import { useCartStore } from "@/stores/cartStore"

const DesktopNav = () => {
  const navigate = useNavigate()
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getCurrentUser()
  const { cart, getCartItemsCount, initializeCart } = useCartStore()
  const itemsCount = getCartItemsCount()

  useEffect(() => {
    if (isAuthenticated && !cart) {
      initializeCart()
    }
  }, [isAuthenticated, cart, initializeCart])

  const handleProtectedAction = (action: string) => {
    if (!isAuthenticated) {
      navigate("/login")
    } else {
      navigate(`/${action}`)
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate("/")
    window.location.reload()
  }

  const navItems = [
    { label: "Medicines", action: () => navigate("/search?q=medicine") },
    { label: "Health Products", action: () => navigate("/search?q=health") },
    { label: "Health Tips", action: () => navigate("/prescription") },
    { label: "Consult a Doctor", action: () => handleProtectedAction("chat") },
  ]

  return (
    <div className="hidden w-full items-center justify-between gap-8 lg:flex">
      <Link to="/" className="flex-shrink-0 group">
        <img src="/logo.svg" alt="Logo" className="w-40 transition-transform duration-200 group-hover:scale-105" />
      </Link>

      <div className="flex items-center gap-7 text-sm font-medium text-slate-700">
        {navItems.map((item) => (
          <button key={item.label} onClick={item.action} className="transition hover:text-[#2563eb]">
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button
          onClick={() => handleProtectedAction("chat")}
          variant="ghost"
          className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-[#2563eb]"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Chat</span>
        </Button>

        <Button
          onClick={() => handleProtectedAction("cart")}
          variant="ghost"
          className="relative flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-[#2563eb]"
        >
          <div className="relative">
            <ShoppingCart className="h-4 w-4" />
            {isAuthenticated && itemsCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white bg-gradient-to-r from-red-500 to-red-600 px-1 text-[10px] font-bold text-white shadow-lg">
                {itemsCount > 99 ? "99+" : itemsCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Button>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 rounded-xl px-4 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-[#2563eb]"
              >
                <div className="relative">
                  <img
                    src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=3182CE&color=fff`}
                    alt="Profile"
                    className="h-8 w-8 rounded-full border-2 border-blue-200 shadow-sm"
                  />
                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-400" />
                </div>
                <span className="hidden xl:inline">{user?.name?.split(" ")[0]}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
              <DropdownMenuLabel className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                <img
                  src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=3182CE&color=fff`}
                  alt="Profile"
                  className="h-12 w-12 rounded-full border-2 border-blue-200 shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-[#2D3748]">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem
                onClick={() => navigate("/dashboard")}
                className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-blue-50"
              >
                <div className="rounded-lg bg-blue-100 p-1.5">
                  <User className="h-4 w-4 text-[#3182CE]" />
                </div>
                <span className="font-medium">Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-red-600 transition-colors hover:bg-red-50 focus:text-red-600"
              >
                <div className="rounded-lg bg-red-100 p-1.5">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-medium">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/login")}
              variant="ghost"
              className="rounded-xl px-6 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-[#2563eb]"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="rounded-xl bg-[#2563eb] px-6 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[#1d4ed8]"
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

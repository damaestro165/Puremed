import DesktopNav from "./DesktopNav"
import MobileNav from "./MobileNav"


const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-50 shadow-lg">
      <div className="px-4 lg:px-10 py-4">
        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  )
}
export default Header
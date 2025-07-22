import DesktopNav from "./DesktopNav"
import MobileNav from "./MobileNav"

const Header = () => {
  return (
    <div className="flex px-4 lg:px-10 py-4 bg-white shadow-md">
      <DesktopNav />
      <MobileNav />
    </div>
  )
}

export default Header
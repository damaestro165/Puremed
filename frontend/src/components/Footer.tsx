import { Link } from "react-router-dom"
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-[linear-gradient(180deg,#13315c_0%,#0f2442_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.75fr_0.75fr_0.95fr_1fr]">
          <div>
            <img src="/logo.svg" alt="Puremed" className="mb-5 w-40 brightness-[1.65] saturate-0 invert" />
            <p className="max-w-xs text-sm leading-7 text-blue-100/85">
              Your trusted online pharmacy providing quality medications and professional healthcare services.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#2563eb]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="mt-5 space-y-3 text-sm text-blue-100/85">
              {["About Us", "Our Services", "Categories", "Contact"].map((item) => (
                <Link key={item} to="#" className="block transition hover:text-white">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Services</h3>
            <div className="mt-5 space-y-3 text-sm text-blue-100/85">
              {["Doctor Consultation", "Prescription Upload", "Home Delivery", "Health Tips"].map((item) => (
                <Link key={item} to="#" className="block transition hover:text-white">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="mt-5 space-y-4 text-sm text-blue-100/85">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-blue-300" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-blue-300" />
                <span>support@puremed.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-blue-300" />
                <span>123 Health Street, Medical City</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold">Stay Updated</h3>
            <p className="mt-3 text-sm leading-7 text-blue-100/85">
              Subscribe to our newsletter for health tips, special offers, and latest updates.
            </p>
            <div className="mt-5 space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#102645] px-4 text-sm text-white placeholder:text-blue-200/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
              <button className="h-12 w-full rounded-2xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8]">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-3 text-sm text-blue-100/70 md:flex-row md:items-center md:justify-between">
            <span>&copy; {currentYear} Puremed. All rights reserved.</span>
            <div className="flex gap-6">
              <Link to="#" className="transition hover:text-white">
                Privacy Policy
              </Link>
              <Link to="#" className="transition hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

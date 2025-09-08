
import { Link } from 'react-router-dom'
import {  Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-[#2D3748] to-gray-800 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <img src="/logo.svg" alt="Logo" className="w-40 mb-4" />
              <p className="text-gray-300 leading-relaxed">
                Your trusted online pharmacy providing quality medications and professional healthcare services.
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="bg-[#3182CE] p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="bg-[#3182CE] p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="bg-[#3182CE] p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="bg-[#3182CE] p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Quick Links</h3>
            <ul className="space-y-3">
              {['About Us', 'Our Services', 'Categories', 'Contact'].map((item) => (
                <li key={item}>
                  <Link 
                    to="#" 
                    className="text-gray-300 hover:text-[#3182CE] transition-colors font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Services</h3>
            <ul className="space-y-3">
              {['Doctor Consultation', 'Prescription Upload', 'Home Delivery', 'Health Tips'].map((item) => (
                <li key={item}>
                  <Link 
                    to="#" 
                    className="text-gray-300 hover:text-[#3182CE] transition-colors font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#3182CE] p-2 rounded-lg">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#3182CE] p-2 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-gray-300">support@pharmacy.com</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#3182CE] p-2 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-gray-300">123 Health Street, Medical City</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-[#3182CE] to-blue-600 rounded-2xl p-8 mb-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter for health tips, special offers, and latest updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl text-amber-50 border-2 border-amber-50 focus:ring-2 focus:ring-blue-300"
              />
              <button className="bg-white text-[#3182CE] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-600 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {currentYear} Your Pharmacy. All rights reserved.
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              Made by @yomidev for better health
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="#" className="text-gray-400 hover:text-[#3182CE] transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="text-gray-400 hover:text-[#3182CE] transition-colors">
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
import CategoryCard from "./CategoryCard"
import { cloneElement } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import ChatModal from "./ChatModal"
import { useEffect, useState } from "react"
import Header from "./Header"
import axios from "axios"
import { Search, Stethoscope, Shield, Truck, Clock, Star, Users, Award } from "lucide-react"
import Footer from "./Footer"

// Type definitions
interface Category {
  _id: string
  name: string
  slug: string
  description: string
  icon: string
  isActive: boolean
  createdAt: string
  image?: string
  link?: string
}

interface ApiResponse {
  success: boolean
  data: Category[]
  count: number
}

const Home: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Helper function to map category names to image files
  const getCategoryImage = (categoryName: string): string => {
    const imageMap: Record<string, string> = {
      'Pain Relief': '/pain-relief.jpeg',
      'Cold and Flu': '/cold-flu.jpeg',
      'Allergy Relief': '/allergy-relief.jpeg',
      'Vitamins and Supplements': '/vitamins-suplements.jpeg',
      'Skin Care': '/skin-care.jpeg'
    }
    return imageMap[categoryName] || '/default-category.jpeg'
  }

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get<ApiResponse>('http://localhost:8080/api/categories')
        
        if (response.data.success && response.data.data) {
          const activeCategories: Category[] = response.data.data
            .filter((category: Category) => category.isActive)
            .map((category: Category) => ({
              ...category,
              image: getCategoryImage(category.name),
              link: `/category/${category.slug}`
            }))
          setCategories(activeCategories)
        } else {
          throw new Error('Invalid API response format')
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const features = [
    {
      icon: <Stethoscope className="w-8 h-8 text-[#3182CE]" />,
      title: "Expert Consultation",
      description: "Chat with qualified doctors anytime"
    },
    {
      icon: <Shield className="w-8 h-8 text-[#3182CE]" />,
      title: "Verified Medications",
      description: "100% authentic and quality assured"
    },
    {
      icon: <Truck className="w-8 h-8 text-[#3182CE]" />,
      title: "Fast Delivery",
      description: "Quick and secure doorstep delivery"
    },
    {
      icon: <Clock className="w-8 h-8 text-[#3182CE]" />,
      title: "24/7 Support",
      description: "Round-the-clock customer service"
    }
  ]

  const stats = [
    { number: "50K+", label: "Happy Customers", icon: <Users className="w-6 h-6" /> },
    { number: "1000+", label: "Medications", icon: <Award className="w-6 h-6" /> },
    { number: "4.8", label: "Average Rating", icon: <Star className="w-6 h-6" /> },
    { number: "24/7", label: "Support", icon: <Clock className="w-6 h-6" /> }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3182CE]/5 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-8 shadow-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Trusted by 50,000+ customers</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-[#2D3748] mb-8 leading-tight">
              Your Trusted <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3182CE] to-blue-600">
                Online Pharmacy
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              Browse and buy medications with confidence. Get professional medical advice through our doctor chat service, available 24/7.
            </p>
            
            {isMobile ? (
              <Button className=" flex bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5282] hover:to-blue-700 text-white text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                <Stethoscope className="w-5 h-5 mr-2" />
                Chat with Doctor
              </Button>
            ) : (
              <ChatModal>
                <Button className="bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5282] hover:to-blue-700 text-white px-14 py-3 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Chat with Doctor
                </Button>
              </ChatModal>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#3182CE]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-[#3182CE]/10 p-3 rounded-2xl">
                    {cloneElement(stat.icon, { className: "w-6 h-6 text-[#3182CE]" })}
                  </div>
                </div>
                <div className="text-3xl font-bold text-[#2D3748] mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#2D3748] mb-6">
            What are you searching for?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Find medications, health products, and wellness solutions quickly and easily
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              className="w-full px-14 py-7 text-sm lg:text-lg border-0 bg-white shadow-xl rounded-2xl focus:ring-2 focus:ring-[#3182CE]/20"
              placeholder="Search for medications, health products, and more..."
            />
            <Button className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-[#3182CE] to-blue-600 text-white px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#2D3748] mb-4">
              Why Choose Us?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We provide comprehensive healthcare solutions with the highest standards of quality and service
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-lg transition-all duration-300 group">
                <div className="bg-white p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#2D3748] mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#2D3748] mb-4">
                Shop by Category
              </h2>
              <p className="text-gray-600 text-lg">
                Browse our wide range of healthcare products and medications
              </p>
            </div>
          </div>
          
          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center mb-8">
              <div className="text-lg font-semibold mb-2">Oops! Something went wrong</div>
              <p>{error}</p>
            </div>
          )}
          
          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="animate-pulse bg-white rounded-2xl p-6 shadow-lg">
                  <div className="bg-gray-200 rounded-2xl h-20 w-20 mx-auto mb-4"></div>
                  <div className="bg-gray-200 rounded-lg h-4 w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            /* Categories grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category: Category) => (
                <CategoryCard 
                  key={category._id}
                  title={category.name}
                  image={category.image!}
                  link={category.link!}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}


export default Home
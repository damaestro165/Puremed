import CategoryCard from "./CategoryCard"
import { cloneElement } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useEffect, useState } from "react"
import Header from "./Header"
import axios from "axios"
import { Search, Stethoscope, Shield, Truck, Clock, Star, Users, Award, Upload, FileText } from "lucide-react"
import Footer from "./Footer"
import { useNavigate } from "react-router-dom"

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

interface Product {
  _id: string
  name: string
  description: string
  price: number
  images: Array<{
    url: string
    alt: string
    isPrimary: boolean
  }>
  stock: number
  categoryId: string
}

interface ProductsApiResponse {
  success: boolean
  data: Product[]
  count: number
}

const Home: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showResults, setShowResults] = useState<boolean>(false)
  
  const navigate = useNavigate()
   const Category_Url = import.meta.env.VITE_BACKEND_URL+'/api/categories'

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
        const response = await axios.get<ApiResponse>(Category_Url)
        
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

  // Search functionality
 const searchProducts = async (query: string): Promise<void> => {
  if (!query.trim()) {
    setSearchResults([]);
    setShowResults(false);
    return;
  }

  try {
    setIsSearching(true);
    const response = await axios.get<ProductsApiResponse>(
      `${import.meta.env.VITE_BACKEND_URL}/api/medications/search?q=${encodeURIComponent(query.trim())}`
    );

    if (response.data.success && response.data.data) {
      setSearchResults(response.data.data);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(true);
    }
  } catch (err) {
    console.error('Error searching products:', err);
    setSearchResults([]);
    setShowResults(true);
  } finally {
    setIsSearching(false);
  }
};

  // Handle search input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery)
      } else {
        setShowResults(false)
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to a search results page or show results inline
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Handle clicking on a search result
  const handleProductClick = (productId: string): void => {
    navigate(`/product/${productId}`)
    setShowResults(false)
    setSearchQuery("")
  }

  // Close search results when clicking outside
  const handleSearchBlur = (): void => {
    // Add a small delay to allow clicking on results
    setTimeout(() => {
      setShowResults(false)
    }, 200)
  }

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
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isMobile ? (
                <>
                  
                   <Button 
                    onClick={() => navigate('/chat')}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5282] hover:to-blue-700 text-white text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4"
                  >
                    
                      <Stethoscope className="w-5 h-5" />
                      Chat with Doctor
                  
                  </Button>
                  <Button 
                    onClick={() => navigate('/prescription')}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Prescription
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate('/chat')} 
                  className="bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5282] hover:to-blue-700 text-white px-8 py-5 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                    <a href="/chat" className="flex items-center justify-center gap-2">
                      <Stethoscope className="w-5 h-5" />
                      Chat with Doctor
                    </a>
                  </Button>
                  <Button 
                    onClick={() => navigate('/prescription')}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-5 text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Prescription
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
       
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
          
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                className="w-full px-14 py-7 text-sm lg:text-lg border-0 bg-white shadow-xl rounded-2xl focus:ring-2 focus:ring-[#3182CE]/20"
                placeholder="Search for medications, health products, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={handleSearchBlur}
                onFocus={() => searchQuery && setShowResults(true)}
              />
              <Button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-[#3182CE] to-blue-600 text-white px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3182CE] mx-auto mb-4"></div>
                    <p className="text-gray-600">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-6 py-4 border-b border-gray-100">
                      <p className="text-sm text-gray-600 font-medium">
                        Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                      </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => handleProductClick(product._id)}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                        >
                          <img
                            src={product.images?.find(img => img.isPrimary)?.url || 
                                  product.images?.[0]?.url || 
                                  '/placeholder-product.jpeg'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder-product.jpeg'
                            }}
                          />
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-[#2D3748] text-sm line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                              {product.description}
                            </p>
                            <p className="text-sm font-bold text-[#3182CE] mt-1">
                              ${product.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.stock > 0 ? (
                              <span className="text-green-600 font-medium">In Stock</span>
                            ) : (
                              <span className="text-red-600 font-medium">Out of Stock</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {searchResults.length > 5 && (
                      <div className="p-4 border-t border-gray-100 text-center">
                        <Button
                          onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
                          variant="outline"
                          className="text-[#3182CE] border-[#3182CE] hover:bg-[#3182CE] hover:text-white"
                        >
                          View All Results
                        </Button>
                      </div>
                    )}
                  </>
                ) : searchQuery ? (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-600 mb-2">No products found</h3>
                    <p className="text-sm text-gray-500">
                      No results found for "{searchQuery}". Try different keywords or check the spelling.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </form>
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
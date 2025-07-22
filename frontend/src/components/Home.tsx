import CategoryCard from "./CategoryCard"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import ChatModal from "./ChatModal"
import { useEffect, useState } from "react"
import Header from "./Header"
import axios from "axios"

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
        
        // Extract data from the API response structure
        if (response.data.success && response.data.data) {
          // Filter only active categories and add image mapping
          const activeCategories: Category[] = response.data.data
            .filter((category: Category) => category.isActive)
            .map((category: Category) => ({
              ...category,
              // Map category names to your existing image files
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

  return (
    <section className="flex flex-col gap-2 w-full">
      <Header />

      {/* Main Content */}
      <div className="flex flex-col justify-center items-center w-full p-4 gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-bold text-3xl text-center text-[#2D3748]">
            Your Trusted <br /> Online Pharmacy
          </h1>
          <p className="text-center text-sm lg:text-base">
            Browse and buy medications with confidence. <br />
            Get professional medical advice through our doctor chat
          </p>
        </div>
        {isMobile ? (
          <Button className="bg-[#3182CE] text-white">
            Chat with Doctor
          </Button>
        ) : (
          <ChatModal>
            <Button className="bg-[#3182CE] text-white">
              Chat with Doctor
            </Button>
          </ChatModal>
        )}
      </div>

      <div className="flex flex-col justify-center items-center w-full p-4 gap-2">
        <Label className="text-2xl lg:text-3xl font-bold text-[#2D3748] text-center">
          What are you searching for?
        </Label>
        <Input
          className="w-full lg:w-1/2 mx-auto mt-4"
          placeholder="Search for medications, health products, and more..."
        />
      </div>

      <div className="flex flex-col justify-center items-center w-full p-4 gap-2">
        <h2 className="text-md lg:text-xl font-bold text-[#2D3748] self-start">
          Shop by category
        </h2>
        
        {/* Error state */}
        {error && (
          <div className="w-full text-center p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 w-full mt-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-32 w-full"></div>
                <div className="bg-gray-200 rounded h-4 w-3/4 mt-2"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Categories grid */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
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
  )
}

export default Home
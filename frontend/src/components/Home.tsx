import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import Header from "./Header"
import axios from "axios"
import {
  ArrowRight,
  Check,
  Clock3,
  HeartPulse,
  Search,
  Shield,
  Stethoscope,
  Truck,
  Upload,
} from "lucide-react"
import Footer from "./Footer"
import { useNavigate } from "react-router-dom"

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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [showResults, setShowResults] = useState<boolean>(false)

  const navigate = useNavigate()
  const categoryUrl = `${import.meta.env.VITE_BACKEND_URL}/api/categories`
  const popularSearches = ["Paracetamol", "Pain Relief", "Vitamins", "Skin Care"]

  const getCategoryImage = (categoryName: string): string => {
    const imageMap: Record<string, string> = {
      "Pain Relief": "/pain-relief.jpeg",
      "Cold and Flu": "/cold-flu.jpeg",
      "Allergy Relief": "/allergy-relief.jpeg",
      "Vitamins and Supplements": "/vitamins-suplements.jpeg",
      "Skin Care": "/skin-care.jpeg",
    }
    return imageMap[categoryName] || "/cold-flu.jpeg"
  }

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get<ApiResponse>(categoryUrl)

        if (!response.data.success || !response.data.data) {
          throw new Error("Invalid API response format")
        }

        const activeCategories = response.data.data
          .filter((category) => category.isActive)
          .map((category) => ({
            ...category,
            image: getCategoryImage(category.name),
            link: `/category/${category.slug}`,
          }))

        setCategories(activeCategories)
      } catch (err) {
        console.error("Error fetching categories:", err)
        // Use fallback categories so the UI stays intact
        setCategories([
          { _id: "1", name: "Pain Relief", slug: "pain-relief", description: "Effective pain management", icon: "", isActive: true, createdAt: "", image: "/pain-relief.jpeg", link: "/category/pain-relief" },
          { _id: "2", name: "Cold and Flu", slug: "cold-and-flu", description: "Cold & flu remedies", icon: "", isActive: true, createdAt: "", image: "/cold-flu.jpeg", link: "/category/cold-and-flu" },
          { _id: "3", name: "Vitamins and Supplements", slug: "vitamins-and-supplements", description: "Daily health essentials", icon: "", isActive: true, createdAt: "", image: "/vitamins-suplements.jpeg", link: "/category/vitamins-and-supplements" },
          { _id: "4", name: "Skin Care", slug: "skin-care", description: "Skincare products", icon: "", isActive: true, createdAt: "", image: "/skin-care.jpeg", link: "/category/skin-care" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [categoryUrl])

  const searchProducts = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await axios.get<ProductsApiResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/medications/search?q=${encodeURIComponent(query.trim())}`
      )

      if (response.data.success && response.data.data) {
        setSearchResults(response.data.data)
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(true)
      }
    } catch (err) {
      console.error("Error searching products:", err)
      setSearchResults([])
      setShowResults(true)
    } finally {
      setIsSearching(false)
    }
  }

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

  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleProductClick = (productId: string): void => {
    navigate(`/product/${productId}`)
    setShowResults(false)
    setSearchQuery("")
  }

  const handleSearchBlur = (): void => {
    setTimeout(() => setShowResults(false), 200)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <main>
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden bg-[#f0f4fa]">
          {/* Subtle organic shape — not a perfect circle */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#dce6f5] opacity-60" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#e4edfa] opacity-40" />

          <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Copy */}
              <div>
                <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#2563eb]">
                  Online Pharmacy
                </p>
                <h1 className="text-4xl font-extrabold leading-[1.1] text-[#0f1d31] sm:text-5xl lg:text-[3.4rem]">
                  Healthcare delivered to your doorstep
                </h1>
                <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-slate-500">
                  Order genuine medications, upload prescriptions, and chat with licensed doctors — all from one place. Fast delivery, real support.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    onClick={() => navigate("/chat")}
                    className="h-12 cursor-pointer rounded-lg bg-[#0f1d31] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#1a2d4a]"
                  >
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Talk to a Doctor
                  </Button>
                  <Button
                    onClick={() => navigate("/prescription")}
                    variant="outline"
                    className="h-12 cursor-pointer rounded-lg border-slate-300 px-7 text-sm font-semibold text-[#0f1d31] transition-colors hover:bg-slate-100"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Prescription
                  </Button>
                </div>

                {/* Social proof — not a grid of identical cards */}
                <div className="mt-10 flex items-center gap-6 border-t border-slate-200/80 pt-6">
                  <div>
                    <span className="text-2xl font-extrabold text-[#0f1d31]">50K+</span>
                    <p className="text-xs text-slate-400">Customers</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-2xl font-extrabold text-[#0f1d31]">4.8</span>
                    <p className="text-xs text-slate-400">Avg. Rating</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-2xl font-extrabold text-[#0f1d31]">24/7</span>
                    <p className="text-xs text-slate-400">Support</p>
                  </div>
                </div>
              </div>

              {/* Visual — asymmetric image collage, not a bento grid */}
              <div className="relative hidden lg:block">
                <div className="relative ml-auto w-full max-w-[480px]">
                  {/* Main image */}
                  <div className="overflow-hidden rounded-2xl shadow-xl">
                    <img
                      src="/vitamins-suplements.jpeg"
                      alt="Healthcare products"
                      className="h-[380px] w-full object-cover"
                    />
                  </div>
                  {/* Overlapping smaller image */}
                  <div className="absolute -bottom-6 -left-10 w-44 overflow-hidden rounded-xl border-4 border-white shadow-lg">
                    <img
                      src="/skin-care.jpeg"
                      alt="Skin care products"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                  {/* Small accent card */}
                  <div className="absolute -right-3 top-6 rounded-lg bg-white px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0f1d31]">Verified Meds</p>
                        <p className="text-[10px] text-slate-400">100% authentic</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SEARCH BAR ═══ */}
        <section className="relative z-10 mx-auto -mt-8 max-w-3xl px-5 sm:px-8">
          <div className="rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200/60">
            <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="h-12 border-none bg-transparent pl-11 text-sm shadow-none focus-visible:ring-0"
                  placeholder="Search medications, vitamins, skincare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={handleSearchBlur}
                  onFocus={() => searchQuery && setShowResults(true)}
                />
              </div>
              <Button
                type="submit"
                className="h-12 cursor-pointer rounded-lg bg-[#2563eb] px-6 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                disabled={isSearching}
              >
                Search
              </Button>

              {/* Search dropdown */}
              {showResults && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-slate-200/60">
                  {isSearching ? (
                    <div className="p-6 text-center text-sm text-slate-400">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="border-b border-slate-100 px-5 py-3 text-xs font-medium text-slate-400">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {searchResults.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => handleProductClick(product._id)}
                            className="flex cursor-pointer items-center gap-3 border-b border-slate-50 px-5 py-3 transition-colors hover:bg-slate-50"
                          >
                            <img
                              src={
                                product.images?.find((img) => img.isPrimary)?.url ||
                                product.images?.[0]?.url ||
                                "/pain-relief.jpeg"
                              }
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/pain-relief.jpeg"
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#0f1d31]">{product.name}</p>
                              <p className="truncate text-xs text-slate-400">{product.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#2563eb]">${product.price.toFixed(2)}</p>
                              <p className={`text-[10px] font-medium ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {product.stock > 0 ? "In Stock" : "Out of Stock"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-400">
                      No results for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
          {/* Quick links — casual, not boxed */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400">Popular:</span>
            {popularSearches.map((item) => (
              <button
                key={item}
                onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                className="cursor-pointer text-xs font-medium text-[#2563eb] underline decoration-[#2563eb]/30 underline-offset-2 transition-colors hover:text-[#1d4ed8] hover:decoration-[#1d4ed8]/50"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* ═══ VALUE PROPS — horizontal strip, not cards ═══ */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Stethoscope className="h-5 w-5" />, title: "Doctor Consultations", desc: "Chat with licensed doctors 24/7 from anywhere." },
              { icon: <Shield className="h-5 w-5" />, title: "Verified & Authentic", desc: "Every product sourced from certified suppliers." },
              { icon: <Truck className="h-5 w-5" />, title: "Fast Delivery", desc: "Same-day dispatch on orders placed before 2 PM." },
              { icon: <HeartPulse className="h-5 w-5" />, title: "Prescription Support", desc: "Upload your prescription, we handle the rest." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f0f4fa] text-[#2563eb]">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f1d31]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CATEGORIES ═══ */}
        <section className="bg-[#fafbfd] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0f1d31] sm:text-3xl">Shop by Category</h2>
                <p className="mt-2 text-sm text-slate-400">Browse our healthcare product range.</p>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600">{error}</div>
            )}

            {loading ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-200/60" />
                ))}
              </div>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {categories.slice(0, 4).map((category) => (
                  <button
                    key={category._id}
                    onClick={() => navigate(category.link!)}
                    className="group cursor-pointer overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-slate-200/60 transition-shadow duration-200 hover:shadow-md"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#0f1d31]">{category.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {category.description || "Shop now"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[#2563eb]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══ WHY PUREMED — editorial layout ═══ */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Image side */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="/cold-flu.jpeg"
                  alt="Cold and flu remedies"
                  className="h-[360px] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 overflow-hidden rounded-xl border-4 border-white shadow-lg">
                <img
                  src="/pain-relief.jpeg"
                  alt="Pain relief medication"
                  className="h-28 w-36 object-cover"
                />
              </div>
            </div>

            {/* Copy side */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">Why Puremed</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[#0f1d31] sm:text-3xl">
                A pharmacy that actually cares about your health
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                We're not just another online pharmacy. Every medication is verified, every order is tracked, and our doctors are available whenever you need them.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  "All medications verified by licensed pharmacists",
                  "24/7 chat with qualified healthcare professionals",
                  "Same-day delivery in select areas",
                  "Easy prescription upload and processing",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate("/search?q=medicine")}
                className="mt-8 h-11 cursor-pointer rounded-lg bg-[#2563eb] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
              >
                Browse Medications
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ═══ CTA STRIP ═══ */}
        <section className="bg-[#0f1d31]">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-14 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Need help with your prescription?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Upload it and our pharmacists will help you find the right medications.
              </p>
            </div>
            <Button
              onClick={() => navigate("/prescription")}
              className="h-11 flex-shrink-0 cursor-pointer rounded-lg bg-white px-6 text-sm font-semibold text-[#0f1d31] transition-colors hover:bg-slate-100"
            >
              Upload Prescription
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* ═══ BOTTOM TRUST — simple text, not fancy badges ═══ */}
        <section className="border-t border-slate-100">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {[
              { label: "Secure Payments", desc: "256-bit SSL encryption" },
              { label: "Privacy Protected", desc: "HIPAA compliant data handling" },
              { label: "Quality Guaranteed", desc: "Licensed supplier network" },
              { label: "Easy Returns", desc: "7-day hassle-free returns" },
            ].map((item, i) => (
              <div key={i} className="text-center lg:text-left">
                <p className="text-xs font-bold text-[#0f1d31]">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home

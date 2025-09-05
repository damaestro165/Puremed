import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PrescriptionUpload from '../components/Prescription';
import { Button } from '../components/ui/button';
import { toast, Toaster } from 'sonner';
import CartService from '../services/cartService';

interface ExtractedPrescriptionData {
  patientName?: string;
  doctorName?: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    quantity?: string;
  }>;
  date?: string;
  rawText: string;
  confidence: number;
}

const PrescriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [prescriptionData, setPrescriptionData] = useState<ExtractedPrescriptionData | null>(null);
  const [isSearchingMedications, setIsSearchingMedications] = useState(false);
  const [foundMedications, setFoundMedications] = useState<any[]>([]);

  // Handle prescription processing completion
  const handlePrescriptionProcessed = (data: ExtractedPrescriptionData) => {
    setPrescriptionData(data);
    // Automatically search for medications in your database
    searchMedicationsInDatabase(data.medications);
  };

  // Search for medications in your database
  const searchMedicationsInDatabase = async (medications: ExtractedPrescriptionData['medications']) => {
    if (medications.length === 0) return;

    setIsSearchingMedications(true);
    const found: any[] = [];

    try {
      // Search each medication in your database
      for (const medication of medications) {
        try {
            const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/medications?search=${encodeURIComponent(medication.name)}&limit=3`
  );

          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.length > 0) {
              found.push({
                prescribed: medication,
                matches: data.data,
                selected: null // User will select which match is correct
              });
            }
          }
        } catch (error) {
          console.error(`Error searching for ${medication.name}:`, error);
        }
      }

      setFoundMedications(found);
      
      if (found.length > 0) {
        toast.success(`Found ${found.length} medications in our database!`);
      } else {
        toast.info('No matching medications found in our database. You may need to consult with a pharmacist.');
      }
    } catch (error) {
      console.error('Error searching medications:', error);
      toast.error('Error searching for medications in database');
    } finally {
      setIsSearchingMedications(false);
    }
  };

  // Handle medication selection
  const selectMedication = (medicationIndex: number, productIndex: number) => {
    const updated = [...foundMedications];
    updated[medicationIndex].selected = updated[medicationIndex].matches[productIndex];
    setFoundMedications(updated);
  };

  // Add selected medications to cart
  const addSelectedToCart = async () => {
    const selectedMedications = foundMedications.filter(med => med.selected);
    
    if (selectedMedications.length === 0) {
      toast.error('Please select at least one medication to add to cart');
      return;
    }

    try {
      for (const medication of selectedMedications) {
        const product = medication.selected;
        const imageUrl = product.images?.find((img: any) => img.isPrimary)?.url || 
                        product.images?.[0]?.url || 
                        '/placeholder-product.jpeg';

        await CartService.addToCart(product._id, 1, {
          name: product.name,
          price: product.price,
          imageUrl: imageUrl,
        });
      }

      toast.success(`Added ${selectedMedications.length} medications to cart!`);
      navigate('/cart');
    } catch (error: any) {
      console.error('Error adding medications to cart:', error);
      toast.error(error.message || 'Failed to add medications to cart');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <Header />
      <Toaster />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#3182CE] to-blue-600 rounded-full mb-6 shadow-lg">
            <i className="fas fa-prescription-bottle text-white text-2xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-[#2D3748] mb-4 tracking-tight">
            Prescription Assistant
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload your prescription image and we'll help you identify and add the medications to your cart. 
            Our AI will extract the medication information and find matching products in our database.
          </p>
        </div>

        {/* Upload Component with enhanced container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <PrescriptionUpload onPrescriptionProcessed={handlePrescriptionProcessed} />
        </div>

        {/* Medication Search Loading State */}
        {isSearchingMedications && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#3182CE]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-search text-[#3182CE] text-lg"></i>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#2D3748] mt-6 mb-2">
                Searching Medications
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                We're searching our database for medications that match your prescription...
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Medication Search Results */}
        {foundMedications.length > 0 && (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-[#2D3748] mb-2">
                    Medication Matches Found
                  </h3>
                  <p className="text-gray-600">
                    Select the correct medications from our database to add to your cart
                  </p>
                </div>
                <Button
                  onClick={addSelectedToCart}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  disabled={!foundMedications.some(med => med.selected)}
                >
                  <i className="fas fa-cart-plus mr-2"></i>
                  Add Selected to Cart ({foundMedications.filter(med => med.selected).length})
                </Button>
              </div>
            </div>

            {/* Medication Cards */}
            <div className="space-y-6">
              {foundMedications.map((medication, medIndex) => (
                <div key={medIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Prescription Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-[#2D3748] mb-3 flex items-center">
                          <i className="fas fa-pills text-[#3182CE] mr-3"></i>
                          {medication.prescribed.name}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          {medication.prescribed.dosage && (
                            <div className="flex items-center text-gray-600">
                              <i className="fas fa-syringe text-gray-400 mr-2 w-4"></i>
                              <span className="font-medium">Dosage:</span>
                              <span className="ml-1">{medication.prescribed.dosage}</span>
                            </div>
                          )}
                          {medication.prescribed.frequency && (
                            <div className="flex items-center text-gray-600">
                              <i className="fas fa-clock text-gray-400 mr-2 w-4"></i>
                              <span className="font-medium">Frequency:</span>
                              <span className="ml-1">{medication.prescribed.frequency}</span>
                            </div>
                          )}
                          {medication.prescribed.quantity && (
                            <div className="flex items-center text-gray-600">
                              <i className="fas fa-hashtag text-gray-400 mr-2 w-4"></i>
                              <span className="font-medium">Quantity:</span>
                              <span className="ml-1">{medication.prescribed.quantity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-white px-3 py-1 rounded-full text-xs font-medium text-[#3182CE] border border-blue-200">
                          {medication.matches.length} matches found
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Available Matches */}
                  <div className="p-8">
                    <h5 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                      <i className="fas fa-store text-gray-400 mr-2"></i>
                      Available Products
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {medication.matches.map((product: any, productIndex: number) => (
                        <div 
                          key={productIndex}
                          className={`group relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            medication.selected?._id === product._id
                              ? 'border-[#3182CE] bg-blue-50 shadow-lg transform scale-[1.02]'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                          onClick={() => selectMedication(medIndex, productIndex)}
                        >
                          {/* Selection Indicator */}
                          {medication.selected?._id === product._id && (
                            <div className="absolute -top-2 -right-2 bg-[#3182CE] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                              <i className="fas fa-check text-sm"></i>
                            </div>
                          )}

                          <div className="space-y-4">
                            {/* Product Image */}
                            <div className="relative">
                              <img
                                src={product.images?.find((img: any) => img.isPrimary)?.url || 
                                     product.images?.[0]?.url || 
                                     '/placeholder-product.jpeg'}
                                alt={product.name}
                                className="w-full h-32 object-cover rounded-lg border border-gray-100"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-product.jpeg';
                                }}
                              />
                              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                                product.stock > 0 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                              </div>
                            </div>

                            {/* Product Details */}
                            <div>
                              <h6 className="font-bold text-[#2D3748] mb-2 line-clamp-2 text-base">
                                {product.name}
                              </h6>
                              <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                                {product.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-[#3182CE]">
                                  ${product.price.toFixed(2)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {medication.selected?._id === product._id ? (
                                    <span className="text-[#3182CE] font-medium text-sm flex items-center">
                                      <i className="fas fa-check-circle mr-1"></i>
                                      Selected
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-sm">
                                      Click to select
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Important Notice */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-amber-600 text-lg"></i>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-amber-800 mb-2">Important Medical Notice</h4>
                  <p className="text-amber-700 leading-relaxed">
                    This prescription processing is for convenience only. Always verify medications, 
                    dosages, and instructions with a licensed pharmacist or healthcare provider before use. 
                    Automated text extraction may contain errors. Your health and safety are our top priority.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionPage;
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
            `http://localhost:8080/api/medications/search?q=${encodeURIComponent(medication.name)}&limit=3`
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
    <div className="flex flex-col gap-2 w-full">
      <Header />
      <Toaster />
      
      <div className="max-w-6xl mx-auto p-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2D3748] mb-2">
            Prescription Assistant
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your prescription image and we'll help you identify and add the medications to your cart. 
            Our AI will extract the medication information and find matching products in our database.
          </p>
        </div>

        {/* Upload Component */}
        <PrescriptionUpload onPrescriptionProcessed={handlePrescriptionProcessed} />

        {/* Medication Search Results */}
        {isSearchingMedications && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-[#3182CE]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3182CE]"></div>
              <span>Searching for medications in our database...</span>
            </div>
          </div>
        )}

        {foundMedications.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#2D3748]">
                Medication Matches Found
              </h3>
              <Button
                onClick={addSelectedToCart}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!foundMedications.some(med => med.selected)}
              >
                Add Selected to Cart ({foundMedications.filter(med => med.selected).length})
              </Button>
            </div>

            <div className="space-y-6">
              {foundMedications.map((medication, medIndex) => (
                <div key={medIndex} className="border rounded-lg p-6 bg-white">
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg text-[#2D3748] mb-1">
                      Prescribed: {medication.prescribed.name}
                    </h4>
                    {medication.prescribed.dosage && (
                      <p className="text-gray-600">Dosage: {medication.prescribed.dosage}</p>
                    )}
                    {medication.prescribed.frequency && (
                      <p className="text-gray-600">Frequency: {medication.prescribed.frequency}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-800">Available matches:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {medication.matches.map((product: any, productIndex: number) => (
                        <div 
                          key={productIndex}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            medication.selected?._id === product._id
                              ? 'border-[#3182CE] bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectMedication(medIndex, productIndex)}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={product.images?.find((img: any) => img.isPrimary)?.url || 
                                   product.images?.[0]?.url || 
                                   '/placeholder-product.jpeg'}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-product.jpeg';
                              }}
                            />
                            <div className="flex-1">
                              <h6 className="font-semibold text-sm">{product.name}</h6>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                                {product.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#3182CE]">
                                  ${product.price.toFixed(2)}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  product.stock > 0 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {medication.selected?._id === product._id && (
                            <div className="mt-2 flex items-center text-[#3182CE] text-sm">
                              <i className="fas fa-check-circle mr-1"></i>
                              Selected
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-exclamation-triangle text-amber-500 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">Important Medical Notice</h4>
                  <p className="text-amber-700 text-sm">
                    This prescription processing is for convenience only. Always verify medications, 
                    dosages, and instructions with a licensed pharmacist or healthcare provider before use. 
                    Automated text extraction may contain errors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#2D3748] mb-3">
            Tips for Best Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-500 mt-0.5"></i>
                Ensure prescription image is clear and well-lit
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-500 mt-0.5"></i>
                Include the entire prescription in the image
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check text-green-500 mt-0.5"></i>
                Use high-resolution images when possible
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <i className="fas fa-times text-red-500 mt-0.5"></i>
                Avoid blurry or angled photos
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-times text-red-500 mt-0.5"></i>
                Don't crop important information
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-times text-red-500 mt-0.5"></i>
                Avoid shadows or reflections on the prescription
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPage;
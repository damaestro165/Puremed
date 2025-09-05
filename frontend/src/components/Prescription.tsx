import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, FileText, Loader2, CheckCircle, AlertTriangle, Info, X, Pill, Clock, Hash, Syringe, ShoppingBag } from 'lucide-react';

// Type definitions
interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
  confidence: number;
}

interface ExtractedPrescriptionData {
  patientName?: string;
  doctorName?: string;
  medications: Medication[];
  date?: string;
  rawText: string;
  confidence: number;
  processingTime?: number;
  cached?: boolean;
  recommendations?: Array<{
    type: 'warning' | 'caution' | 'info';
    message: string;
  }>;
}

interface ActiveIngredient {
  name: string;
  strength: string;
}

interface Manufacturer {
  name: string;
  country: string;
}

interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface Ratings {
  average: number;
  count: number;
}

interface Product {
  _id: string;
  name: string;
  genericName: string;
  brandName: string;
  description: string;
  category: string;
  activeIngredients: ActiveIngredient[];
  dosageForm: string;
  strength: string;
  packageSize: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockLevel: number;
  maxStockLevel: number;
  requiresPrescription: boolean;
  manufacturingDate: string;
  expiryDate: string;
  manufacturer: Manufacturer;
  dosageInstructions: string;
  warnings: string[];
  sideEffects: string[];
  contraindications: string[];
  images: ProductImage[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  ratings: Ratings;
}

interface MedicationMatch {
  prescribed: Medication;
  matches: Product[];
  selected: Product | null;
}

interface PrescriptionUploadProps {
  onPrescriptionProcessed: (data: ExtractedPrescriptionData) => void;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onPrescriptionProcessed }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ExtractedPrescriptionData | null>(null);
  const [foundMedications, setFoundMedications] = useState<MedicationMatch[]>([]);
  const [isSearchingMedications, setIsSearchingMedications] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Enhanced file validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, WebP)';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      alert(`File validation errors:\n${errors.join('\n')}`);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    }
  }, []);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Camera capture functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please upload an image instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `prescription-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFiles(prev => [...prev, file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // Real processing function using API
const processPrescriptions = async () => {
  if (selectedFiles.length === 0) {
    alert('Please select at least one image first');
    return;
  }

  setIsProcessing(true);
  setProcessingProgress(0);

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      setProcessingProgress(((i + 0.5) / selectedFiles.length) * 100);

      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/prescription/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result: ExtractedPrescriptionData = await response.json();

      if (result) {
        setLastResult(result);
        onPrescriptionProcessed(result);
        await searchMedications(result.medications);
      } else {
        alert('Processing failed');
      }

      setProcessingProgress(((i + 1) / selectedFiles.length) * 100);
    }

    setSelectedFiles([]);
  } catch (error: unknown) {
    console.error('Processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`Processing failed: ${errorMessage}`);
  } finally {
    setIsProcessing(false);
    setProcessingProgress(0);
  }
};

const searchMedications = async (medications: Medication[]) => {
  setIsSearchingMedications(true);

  try {
    const searchResults = await Promise.all(
      medications.map(async (medication): Promise<MedicationMatch | null> => {
        if (!medication.name || medication.name.length < 3) {
          return null;
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/medications?search=${encodeURIComponent(medication.name)}`
        );

        if (!response.ok) {
          console.error(`Search failed for ${medication.name}`);
          return null;
        }

        const matches: Product[] = await response.json();

        return {
          prescribed: medication,
          matches: Array.isArray(matches) ? matches : [],
          selected: null,
        };
      })
    );

    const validResults = searchResults.filter((med): med is MedicationMatch => med !== null);
    setFoundMedications(validResults);
  } catch (error) {
    console.error('Medication search error:', error);
    alert('Failed to search for medications. Please try again.');
  } finally {
    setIsSearchingMedications(false);
  }
};

  const selectMedication = (medicationIndex: number, productIndex: number) => {
    const updated = [...foundMedications];
    updated[medicationIndex].selected = updated[medicationIndex].matches[productIndex];
    setFoundMedications(updated);
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get recommendation icon
  const getRecommendationIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'caution': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-6 shadow-lg">
            <Pill className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4 tracking-tight">
            Prescription Assistant
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload your prescription image and we'll help you identify and add the medications to your cart. 
            Our AI will extract the medication information and find matching products in our database.
          </p>
        </div>

        {/* Upload Component with enhanced container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="space-y-8">
            {/* Camera Section */}
            {showCamera && (
              <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-80 object-cover"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <button
                    onClick={capturePhoto}
                    className="bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
                  >
                    <Camera className="w-6 h-6 text-gray-800" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-red-500 text-white rounded-full p-4 shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : selectedFiles.length > 0 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Upload Prescription
                </h3>
                <p className="text-gray-600 text-lg mb-6 max-w-md">
                  Drag and drop your prescription images here, or click to browse. Supports JPEG, PNG, WebP up to 10MB each.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Browse Files
                  </button>
                  <button
                    onClick={startCamera}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Use Camera
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Files Display */}
            {selectedFiles.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 shadow-inner">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-gray-500" />
                  Selected Files ({selectedFiles.length}/5)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-semibold truncate flex-1">{file.name}</span>
                        <button 
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process Button */}
            <button
              onClick={processPrescriptions}
              disabled={isProcessing || selectedFiles.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing... {processingProgress.toFixed(0)}%
                </>
              ) : (
                <>
                  <Pill className="w-6 h-6" />
                  Process Prescription
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {lastResult && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <CheckCircle className="w-8 h-8" />
                Processing Results
              </h2>
              <p className="text-blue-100 text-lg">
                Successfully extracted information from your prescription
              </p>
            </div>

            {/* Extracted Info */}
            <div className="p-8 border-b border-gray-100">
              <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Info className="w-6 h-6 mr-3 text-gray-500" />
                Prescription Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {lastResult.patientName && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="block text-sm font-semibold text-gray-500 mb-1">Patient Name</span>
                    <span className="text-gray-800 text-lg">{lastResult.patientName}</span>
                  </div>
                )}
                {lastResult.doctorName && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="block text-sm font-semibold text-gray-500 mb-1">Doctor Name</span>
                    <span className="text-gray-800 text-lg">{lastResult.doctorName}</span>
                  </div>
                )}
                {lastResult.date && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="block text-sm font-semibold text-gray-500 mb-1">Date</span>
                    <span className="text-gray-800 text-lg">{lastResult.date}</span>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <span className="block text-sm font-semibold text-gray-500 mb-1">Overall Confidence</span>
                  <span className={`text-lg font-bold px-3 py-1 rounded-full ${getConfidenceColor(lastResult.confidence)}`}>
                    {(lastResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {lastResult.recommendations && lastResult.recommendations.length > 0 && (
              <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-3 text-gray-500" />
                  Recommendations
                </h4>
                <div className="space-y-4">
                  {lastResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-md">
                      {getRecommendationIcon(rec.type)}
                      <span className="text-gray-700 text-lg">{rec.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications Section */}
            <div className="p-8">
              <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Pill className="w-6 h-6 mr-3 text-gray-500" />
                Extracted Medications ({lastResult.medications.length})
              </h4>
              <div className="space-y-12">
                {foundMedications.map((medication, medIndex) => (
                  <div key={medIndex} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden">
                    {/* Prescribed Medication Header */}
                    <div className="bg-white p-6 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Pill className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="text-xl font-bold text-gray-800">{medication.prescribed.name}</h5>
                              <span className={`text-sm font-medium px-3 py-1 rounded-full mt-1 inline-block ${getConfidenceColor(medication.prescribed.confidence)}`}>
                                Confidence: {(medication.prescribed.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-16">
                            {medication.prescribed.dosage && (
                              <div className="flex items-center text-gray-600">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                  <Syringe className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                  <span className="font-semibold block text-sm text-gray-500">Dosage</span>
                                  <span className="text-gray-800">{medication.prescribed.dosage}</span>
                                </div>
                              </div>
                            )}
                            {medication.prescribed.frequency && (
                              <div className="flex items-center text-gray-600">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                  <span className="font-semibold block text-sm text-gray-500">Frequency</span>
                                  <span className="text-gray-800">{medication.prescribed.frequency}</span>
                                </div>
                              </div>
                            )}
                            {medication.prescribed.quantity && (
                              <div className="flex items-center text-gray-600">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                  <Hash className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                  <span className="font-semibold block text-sm text-gray-500">Quantity</span>
                                  <span className="text-gray-800">{medication.prescribed.quantity}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-white px-4 py-2 rounded-full text-sm font-bold text-blue-600 border-2 border-blue-200 shadow-sm">
                            {medication.matches.length} matches found
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Available Matches */}
                    <div className="p-8">
                      <h5 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <ShoppingBag className="w-6 h-6 mr-3 text-gray-500" />
                        Available Products
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medication.matches.map((product, productIndex) => (
                          <div 
                            key={productIndex}
                            className={`group relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                              medication.selected?._id === product._id
                                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-102'
                            }`}
                            onClick={() => selectMedication(medIndex, productIndex)}
                          >
                            {/* Selection Indicator */}
                            {medication.selected?._id === product._id && (
                              <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                            )}

                            <div className="space-y-4">
                              {/* Product Image */}
                              <div className="relative">
                                <img
                                  src={product.images?.find((img) => img.isPrimary)?.url || 
                                       product.images?.[0]?.url || 
                                       'https://via.placeholder.com/150'}
                                  alt={product.name}
                                  className="w-full h-40 object-cover rounded-xl border border-gray-100"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/150';
                                  }}
                                />
                                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                  product.stock > 0 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-red-500 text-white'
                                }`}>
                                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                </div>
                              </div>

                              {/* Product Details */}
                              <div className="space-y-3">
                                <h6 className="font-bold text-gray-800 text-lg leading-tight">
                                  {product.name}
                                </h6>
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                  {product.description}
                                </p>
                                <div className="flex items-center justify-between pt-2">
                                  <span className="text-2xl font-bold text-blue-600">
                                    ${product.price.toFixed(2)}
                                  </span>
                                  {medication.selected?._id === product._id ? (
                                    <span className="text-blue-600 font-bold text-sm flex items-center bg-blue-100 px-3 py-1 rounded-full">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Selected
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                                      Click to select
                                    </span>
                                  )}
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
              {isSearchingMedications && (
                <div className="mt-6 flex items-center justify-center text-blue-600">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Searching for medications...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default PrescriptionUpload;
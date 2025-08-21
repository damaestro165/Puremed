// import express from 'express';
// import multer from 'multer';
// import fs from 'fs/promises';
// import crypto from 'crypto';
// import "dotenv/config";
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const router = express.Router();
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// if (!GEMINI_API_KEY) {
//   console.error('GEMINI_API_KEY environment variable is required');
//   process.exit(1);
// }

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// // Updated to use the latest Gemini model
// const model = genAI.getGenerativeModel({ 
//   model: "gemini-2.0-flash-exp", // Latest model as of late 2024
//   generationConfig: {
//     maxOutputTokens: 65535,
//     temperature: 0.1, // Lower temperature for more consistent medical text extraction
//     topP: 0.95,
//   },
//   safetySettings: [
//     {
//       category: 'HARM_CATEGORY_HATE_SPEECH',
//       threshold: 'BLOCK_NONE',
//     },
//     {
//       category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
//       threshold: 'BLOCK_NONE',
//     },
//     {
//       category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
//       threshold: 'BLOCK_NONE',
//     },
//     {
//       category: 'HARM_CATEGORY_HARASSMENT',
//       threshold: 'BLOCK_NONE',
//     }
//   ],
// });

// const cache = new Map();

// // Status endpoint
// router.get('/status', (req, res) => {
//   res.json({ 
//     allReady: true, 
//     hasGeminiToken: !!GEMINI_API_KEY,
//     model: "gemini-2.0-flash-exp",
//     timestamp: new Date().toISOString()
//   });
// });

// // Enhanced medication extraction using multiple approaches
// async function processMedicalText(rawText) {
//   const medications = [];
//   let confidence = 0;
//   let recommendations = [];

//   console.log('Processing text:', rawText.substring(0, 200) + '...');

//   // Enhanced regex patterns for medication extraction
//   const medicationPatterns = [
//     // Pattern 1: Drug name + dosage + frequency
//     /(\b[A-Z][a-z]+(?:ine|ol|pril|sartan|mycin|cillin|zole|ide|ate|ium|mab)\b)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?))\s*((?:once|twice|three times|four times|1x|2x|3x|4x)\s*(?:daily|a day|per day|morning|evening|night)?)/gi,
    
//     // Pattern 2: Generic drug name + dosage
//     /(\b[A-Z][a-z]{2,})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?))/gi,
    
//     // Pattern 3: Common drug suffixes
//     /(\b\w*(?:ine|ol|pril|sartan|mycin|cillin|zole|ide|ate|ium|mab)\b)/gi,
    
//     // Pattern 4: Tablet/Capsule format
//     /(\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]+)?)\s+(?:tablet|capsule|cap|tab)\s*(\d+\s*(?:mg|mcg|g))/gi
//   ];

//   // Use regex patterns for medication extraction
//   medicationPatterns.forEach(pattern => {
//     const matches = [...rawText.matchAll(pattern)];
//     matches.forEach(match => {
//       const name = match[1]?.trim();
//       const dosage = match[2]?.trim();
//       const frequency = match[3]?.trim();
      
//       if (name && name.length > 2) {
//         const falsePositives = ['Patient', 'Doctor', 'Date', 'Name', 'Address', 'Phone', 'Email', 'Hospital', 'Clinic'];
//         if (!falsePositives.includes(name)) {
//           medications.push({
//             name: name,
//             dosage: dosage,
//             frequency: frequency,
//             confidence: 0.7,
//             source: 'Regex'
//           });
//           confidence += 0.7;
//         }
//       }
//     });
//   });

//   // If no medications found with regex, try Gemini for structured extraction
//   if (medications.length === 0) {
//     try {
//       const structuredExtractionPrompt = `
//         You are a medical assistant that helps patients understand their prescriptions. 
        
//         Extract medication information from this prescription text and return ONLY a JSON array of medications.
        
//         For each medication, include:
//         - name: medication name
//         - dosage: dosage amount (e.g., "250mg", "5ml")
//         - frequency: how often to take (e.g., "twice daily", "once a day")
//         - confidence: confidence score between 0 and 1
        
//         Text: "${rawText}"
        
//         Return only the JSON array, no other text:
//       `;
      
//       const result = await model.generateContent(structuredExtractionPrompt);
//       const response = await result.response;
//       const text = response.text();
      
//       try {
//         const extractedMeds = JSON.parse(text);
//         if (Array.isArray(extractedMeds)) {
//           extractedMeds.forEach(med => {
//             if (med.name && med.name.trim().length > 2) {
//               medications.push({
//                 name: med.name,
//                 dosage: med.dosage || '',
//                 frequency: med.frequency || '',
//                 confidence: med.confidence || 0.8,
//                 source: 'Gemini'
//               });
//               confidence += med.confidence || 0.8;
//             }
//           });
//         }
//       } catch (parseError) {
//         console.warn('Failed to parse Gemini JSON response:', parseError);
//       }
//     } catch (error) {
//       console.warn('Gemini structured extraction failed:', error.message);
//     }
//   }

//   // Remove duplicates
//   const uniqueMedications = medications.filter((med, index, self) => 
//     index === self.findIndex(m => m.name.toLowerCase() === med.name.toLowerCase())
//   );

//   // Extract patient, doctor, and date information using regex
//   const patientMatch = rawText.match(/(?:Patient|Name):\s*([\w\s]+?)(?:\n|$|[A-Z][a-z]+:)/i);
//   const doctorMatch = rawText.match(/(?:Doctor|Physician|Dr\.?)\s*:?\s*([\w\s\.]+?)(?:\n|$|[A-Z][a-z]+:)/i);
//   const dateMatch = rawText.match(/(?:Date|Dated?):\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);

//   // Calculate average confidence
//   confidence = uniqueMedications.length > 0 ? confidence / uniqueMedications.length : 0.3;

//   // Generate recommendations
//   if (confidence < 0.6) {
//     recommendations.push({ 
//       type: 'warning', 
//       message: 'Low confidence extraction. Please verify all medications manually.' 
//     });
//   }
//   if (uniqueMedications.length > 3) {
//     recommendations.push({ 
//       type: 'caution', 
//       message: 'Multiple medications detected. Check for potential drug interactions.' 
//     });
//   }
//   if (uniqueMedications.length === 0) {
//     recommendations.push({ 
//       type: 'warning', 
//       message: 'No medications detected. Please ensure the image contains a valid prescription.' 
//     });
//   }

//   return {
//     patientName: patientMatch?.[1]?.trim(),
//     doctorName: doctorMatch?.[1]?.trim(),
//     date: dateMatch?.[1]?.trim(),
//     medications: uniqueMedications,
//     rawText,
//     confidence,
//     recommendations,
//   };
// }

// // Main processing route
// router.post('/process', upload.single('file'), async (req, res) => {
//   const startTime = Date.now();
  
//   if (!req.file) {
//     return res.status(400).json({ 
//       success: false, 
//       message: 'No file uploaded' 
//     });
//   }

//   try {
//     const fileBuffer = await fs.readFile(req.file.path);
//     const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

//     // Check cache first
//     if (cache.has(hash)) {
//       const cachedData = cache.get(hash);
//       return res.json({ 
//         success: true,
//         ...cachedData, 
//         cached: true, 
//         processingTime: Date.now() - startTime 
//       });
//     }

//     console.log(`Processing file: ${req.file.filename}, size: ${fileBuffer.length} bytes`);

//     let extractedText = '';
    
//     try {
//       // Convert file to base64 for Gemini
//       const base64Image = fileBuffer.toString('base64');
      
//       // Create the image part for Gemini
//       const imagePart = {
//         inlineData: {
//           data: base64Image,
//           mimeType: req.file.mimetype || 'image/jpeg'
//         }
//       };

//       // Enhanced OCR prompt with medical assistant context
//       console.log('Performing OCR with Gemini...');
//       const prompt = `
//         You are a medical assistant that helps patients understand their prescriptions. 
        
//         Extract ALL text from this prescription image accurately. Include:
//         - Patient name
//         - Doctor name and details
//         - Date
//         - All medications with their dosages, frequencies, and instructions
//         - Any other text visible in the prescription
        
//         Return only the extracted text, preserving the structure and layout as much as possible.
//         Be especially careful with medication names, dosages, and frequencies as these are critical for patient safety.
//       `;
      
//       const result = await model.generateContent([prompt, imagePart]);
//       const response = await result.response;
//       extractedText = response.text().trim();
      
//       console.log('OCR success, extracted text length:', extractedText.length);
      
//     } catch (error) {
//       console.error('Gemini OCR failed:', error.message);
//       throw new Error('OCR processing failed. Please ensure the image is clear and try again.');
//     }

//     // Validate extracted text
//     if (!extractedText || extractedText.trim().length < 10) {
//       throw new Error('Unable to extract readable text from the image. Please ensure the prescription is clearly visible and well-lit.');
//     }

//     // Process the extracted text
//     const structuredData = await processMedicalText(extractedText);

//     // Cache the result
//     cache.set(hash, structuredData);

//     const processingTime = Date.now() - startTime;
    
//     console.log(`Processing completed in ${processingTime}ms, found ${structuredData.medications.length} medications`);

//     res.json({
//       success: true,
//       ...structuredData,
//       processingTime,
//       cached: false,
//     });

//   } catch (error) {
//     console.error('Processing error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message || 'Processing failed',
//       processingTime: Date.now() - startTime
//     });
//   } finally {
//     // Clean up uploaded file
//     try {
//       await fs.unlink(req.file.path);
//     } catch (unlinkError) {
//       console.warn('Failed to delete uploaded file:', unlinkError.message);
//     }
//   }
// });

// // Health check endpoint
// router.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     cache_size: cache.size,
//     model: "gemini-2.0-flash-exp"
//   });
// });

// // Clear cache endpoint (for debugging)
// router.post('/clear-cache', (req, res) => {
//   cache.clear();
//   res.json({ message: 'Cache cleared successfully' });
// });

// export default router;
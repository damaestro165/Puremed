import express from "express";
import multer from "multer";
import fs from "fs/promises";
import crypto from "crypto";
import "dotenv/config";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const cache = new Map();
// Hugging Face Query Function
async function query(data) {
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });
  const result = await response.json();
  return result;
}
function extractMedications(rawText) {
  const medications = [];
  const medicationPatterns = [
    // Your existing patterns
    /(\b[A-Z][a-z]+(?:ine|ol|pril|sartan|mycin|cillin|zole|ide|ate|ium|mab)\b)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?))?\s*((?:once|twice|three times|four times|1x|2x|3x|4x)\s*(?:daily|a day|per day|morning|evening|night)?)/gi,
    /(\b[A-Z][a-z]{2,})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?))/gi,
    /(\b\w*(?:ine|ol|pril|sartan|mycin|cillin|zole|ide|ate|ium|mab)\b)/gi,
    /(\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]+)?)\s+(?:tablet|capsule|cap|tab)\s*(\d+\s*(?:mg|mcg|g))/gi,
  ];

  medicationPatterns.forEach((pattern) => {
    const matches = [...rawText.matchAll(pattern)];
    matches.forEach((match) => {
      const name = match[1]?.trim();
      const dosage = match[2]?.trim();
      const frequency = match[3]?.trim();

      if (name && name.length > 2) {
        // Expanded list of false positives
        const falsePositives = [
          "Patient", "Doctor", "Date", "Name", "Address", "Phone", "Email", "Hospital", "Clinic",
          "line", "date", "advice", "description", "details"
        ];
        if (!falsePositives.some(fp => name.toLowerCase() === fp.toLowerCase())) {
          medications.push({
            name,
            dosage: dosage || "",
            frequency: frequency || "",
            confidence: 0.7,
            source: "Regex",
          });
        }
      }
    });
  });

  return medications;
}



// Process Route
router.post("/process", upload.single("file"), async (req, res) => {
  const startTime = Date.now();

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const fileBuffer = await fs.readFile(req.file.path);
    const hash = crypto.createHash("md5").update(fileBuffer).digest("hex");

    if (cache.has(hash)) {
      return res.json({
        success: true,
        ...cache.get(hash),
        cached: true,
        processingTime: Date.now() - startTime,
      });
    }

    // Convert image to base64
    const base64Image = fileBuffer.toString("base64");
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    // Send to Hugging Face
    const hfResponse = await query({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all medications from this prescription. 
                     Return JSON with:
                     - patientName
                     - doctorName
                     - date
                     - medications (array of {name, dosage, frequency})`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct:fireworks-ai",
    });

    let extractedText = hfResponse?.choices?.[0]?.message?.content || "";
    let structuredData = {};

    try {
      // Try parsing as JSON
      structuredData = JSON.parse(extractedText);
    } catch (e) {
      console.warn("HF response not valid JSON, using regex fallback.");
      // Fallback to regex-based extraction
      const meds = extractMedications(extractedText);
      structuredData = {
        patientName: null,
        doctorName: null,
        date: null,
        medications: meds,
        rawText: extractedText,
        confidence: meds.length > 0 ? 0.7 : 0.3,
      };
    }

    // Cache result
    cache.set(hash, structuredData);

    res.json({
      success: true,
      ...structuredData,
      processingTime: Date.now() - startTime,
      cached: false,
    });
  } catch (err) {
    console.error("Processing error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Processing failed",
      processingTime: Date.now() - startTime,
    });
  } finally {
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.warn("Failed to delete uploaded file:", unlinkError.message);
    }
  }
});

export default router;

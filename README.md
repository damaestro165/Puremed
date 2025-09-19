

## Overview

Plusmed is an innovative Online Pharmacy Store app designed to address the common challenge of reading and understanding doctor prescriptions. Inspired by user feedback about prescription legibility issues, Plusmed leverages AI to extract medication information, enable user interaction with an AI doctor, and simplify adding medications to a shopping cart. This project combines cutting-edge technology with a user-friendly interface to enhance healthcare accessibility.

## Features

- **AI-Powered Prescription Processing**: Upload images of prescriptions, and the app extracts medications (e.g., CALPOL, DELCON) with approximately 70% confidence using regex and Hugging Face’s Llama-4-Scout-17B model.
- **AI Doctor Chat**: Interact with an AI doctor for guidance on medications and health queries.
- **Seamless Cart Integration**: Add extracted medications directly to your cart with a single click.
- **Camera Support**: Capture prescription images using your device’s camera.
- **Drag-and-Drop Uploads**: Easily upload prescription files with a modern drag-and-drop interface.
- **Real-Time Processing**: Process uploads efficiently with progress indicators, supported by a caching system.
- **User-Friendly UI**: Built with a responsive design using Tailwind CSS for an enhanced experience.

## Technologies

- **Frontend**: 
  - React with TypeScript for dynamic components
  - Tailwind CSS for styling
  - Lucide-React for icons
- **Backend**: 
  - Node.js with Express for API routing
  - Multer for file uploads
  - fs and crypto for file handling and caching
- **Database**: 
  - MongoDB
- **AI Integration**: Hugging Face API with Llama-4-Scout-17B model
- **Development Tools**: 
  - Webpack or Vite for bundling
  - Git for version control

## Installation

### Prerequisites

- Node.js (v16 or later)
- npm
- Access to a Hugging Face API token (set as `HF_TOKEN` in a `.env` file)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/plusmed.git
   cd plusmed
   ```

   npm install

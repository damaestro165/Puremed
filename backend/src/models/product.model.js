import mongoose from 'mongoose';

// Category Schema for Pharmacy
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['Pain Relief', 'Cold and Flu', 'Vitamins and Supplements', 'Skin Care']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    enum: ['pain-relief', 'cold-and-flu', 'vitamins-and-supplements', 'skin-care']
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String, // Icon name or URL for UI
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Medication/Product Schema
const MedicationSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  genericName: {
    type: String,
    trim: true,
    index: true
  },
  brandName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  
  // Pharmaceutical Details
  activeIngredients: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    strength: {
      type: String,
      required: true,
      trim: true
    }
  }],
  
  dosageForm: {
    type: String,
    required: true,
    enum: [
      'Tablet',
      'Capsule',
      'Liquid',
      'Syrup',
      'Cream',
      'Ointment',
      'Gel',
      'Drops',
      'Spray',
      'Injection',
      'Inhaler',
      'Patch',
      'Suppository',
      'Powder'
    ]
  },
  
  strength: {
    type: String,
    required: true,
    trim: true // e.g., "500mg", "10ml", "2.5%"
  },
  
  // Packaging and Inventory
  packageSize: {
    type: String,
    required: true,
    trim: true // e.g., "30 tablets", "100ml bottle"
  },
  
  sku: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  
  barcode: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  costPrice: {
    type: Number,
    min: 0 // For profit calculation
  },
  
  // Stock Management
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: 0
  },
  
  // Regulatory and Safety
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  
  ageRestriction: {
    minAge: {
      type: Number,
      min: 0,
      max: 100
    },
    maxAge: {
      type: Number,
      min: 0,
      max: 120
    }
  },
  
  // Dates
  manufacturingDate: {
    type: Date
  },
  
  expiryDate: {
    type: Date,
    required: true
    // REMOVED: index: true (this was the duplicate)
  },
  
  // Manufacturer Information
  manufacturer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  
  // Usage Instructions
  dosageInstructions: {
    type: String,
    trim: true
  },
  
  warnings: [{
    type: String,
    trim: true
  }],
  
  sideEffects: [{
    type: String,
    trim: true
  }],
  
  contraindications: [{
    type: String,
    trim: true
  }],
  
  // Images and Media
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // SEO and Search
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Status and Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isOnSale: {
    type: Boolean,
    default: false
  },
  
  salePrice: {
    type: Number,
    min: 0
  },
  
  // Ratings and Reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
MedicationSchema.index({ name: 'text', genericName: 'text', description: 'text' });
MedicationSchema.index({ category: 1, isActive: 1 });
MedicationSchema.index({ price: 1 });
MedicationSchema.index({ expiryDate: 1 });
MedicationSchema.index({ requiresPrescription: 1 });
MedicationSchema.index({ stock: 1 });
MedicationSchema.index({ 'manufacturer.name': 1 });

CategorySchema.index({ slug: 1 });

// Virtual for checking if medication is expired
MedicationSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual for checking if stock is low
MedicationSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStockLevel;
});

// Virtual for profit margin
MedicationSchema.virtual('profitMargin').get(function() {
  if (this.costPrice && this.costPrice > 0) {
    return ((this.price - this.costPrice) / this.costPrice) * 100;
  }
  return 0;
});

// Middleware to update updatedAt on save
MedicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if medication needs restocking
MedicationSchema.methods.needsRestocking = function() {
  return this.stock <= this.minStockLevel;
};

// Static method to find medications expiring soon
MedicationSchema.statics.findExpiringSoon = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    isActive: true
  });
};

// Static method to find low stock medications
MedicationSchema.statics.findLowStock = function() {
  return this.aggregate([
    {
      $match: {
        isActive: true,
        $expr: { $lte: ['$stock', '$minStockLevel'] }
      }
    }
  ]);
};

// Create models
export const Category = mongoose.model('Category', CategorySchema);
export const Medication = mongoose.model('Medication', MedicationSchema);

import express from 'express';
import { Category, Medication } from '../models/product.model.js';// Adjust path as needed
import mongoose from 'mongoose';

// Category Routes
const categoryRouter = express.Router();

// GET /api/categories - Get all categories
categoryRouter.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET /api/categories/:id - Get single category
categoryRouter.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// GET /api/categories/slug/:slug - Get category by slug
categoryRouter.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// POST /api/categories - Create new category
categoryRouter.post('/', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// PUT /api/categories/:id - Update category
categoryRouter.put('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// DELETE /api/categories/:id - Soft delete category
categoryRouter.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

// Medication/Product Routes
const medicationRouter = express.Router();

// GET /api/medications - Get all medications with filtering and pagination
medicationRouter.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      requiresPrescription,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (requiresPrescription !== undefined) {
      filter.requiresPrescription = requiresPrescription === 'true';
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const medications = await Medication.find(filter)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Medication.countDocuments(filter);

    res.json({
      success: true,
      data: medications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medications',
      error: error.message
    });
  }
});

// GET /api/medications/:id - Get single medication
medicationRouter.get('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id)
      .populate('category', 'name slug description');
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.json({
      success: true,
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medication',
      error: error.message
    });
  }
});

// GET /api/medications/category/:categoryId - Get medications by category
medicationRouter.get('/category/:categoryId', async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const { categoryId } = req.params;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format'
        });
      }
      
      // Convert to ObjectId
      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
      
      const medications = await Medication.find({
        category: categoryObjectId,
        isActive: true
      })
        .populate('category', 'name slug')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
  
      const total = await Medication.countDocuments({
        category: categoryObjectId,
        isActive: true
      });
  
      res.json({
        success: true,
        data: medications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching medications by category:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching medications by category',
        error: error.message
      });
    }
  });
// POST /api/medications - Create new medication
medicationRouter.post('/', async (req, res) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    await medication.populate('category', 'name slug');
    
    res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      data: medication
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating medication',
      error: error.message
    });
  }
});

// PUT /api/medications/:id - Update medication
medicationRouter.put('/:id', async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: medication
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating medication',
      error: error.message
    });
  }
});

// DELETE /api/medications/:id - Soft delete medication
medicationRouter.delete('/:id', async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.json({
      success: true,
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting medication',
      error: error.message
    });
  }
});

// GET /api/medications/featured - Get featured medications
medicationRouter.get('/special/featured', async (req, res) => {
  try {
    const medications = await Medication.find({
      isFeatured: true,
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(12);

    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
    //   success: false,
      message: 'Error fetching featured medications',
      error: error.message
    });
  }
});

// GET /api/medications/on-sale - Get medications on sale
medicationRouter.get('/special/on-sale', async (req, res) => {
  try {
    const medications = await Medication.find({
      isOnSale: true,
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(20);

    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medications on sale',
      error: error.message
    });
  }
});

// GET /api/medications/inventory/low-stock - Get low stock medications
medicationRouter.get('/inventory/low-stock', async (req, res) => {
  try {
    const medications = await Medication.findLowStock();
    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock medications',
      error: error.message
    });
  }
});

// GET /api/medications/inventory/expiring-soon - Get medications expiring soon
medicationRouter.get('/inventory/expiring-soon', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const medications = await Medication.findExpiringSoon(parseInt(days));
    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring medications',
      error: error.message
    });
  }
});

// PUT /api/medications/:id/stock - Update medication stock
medicationRouter.put('/:id/stock', async (req, res) => {
  try {
    const { stock, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'
    
    let medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    switch (operation) {
      case 'add':
        medication.stock += stock;
        break;
      case 'subtract':
        medication.stock = Math.max(0, medication.stock - stock);
        break;
      default:
        medication.stock = stock;
    }

    await medication.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { id: medication._id, stock: medication.stock }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
});

// GET /api/medications/search - Advanced search
medicationRouter.get('/search/advanced', async (req, res) => {
  try {
    const { q, category, dosageForm, requiresPrescription } = req.query;
    
    const filter = { isActive: true };
    
    if (q) {
      filter.$text = { $search: q };
    }
    
    if (category) filter.category = category;
    if (dosageForm) filter.dosageForm = dosageForm;
    if (requiresPrescription !== undefined) {
      filter.requiresPrescription = requiresPrescription === 'true';
    }

    const medications = await Medication.find(filter)
      .populate('category', 'name slug')
      .limit(20);

    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching medications',
      error: error.message
    });
  }
});


// Export the routers
export {
    categoryRouter,
    medicationRouter
};

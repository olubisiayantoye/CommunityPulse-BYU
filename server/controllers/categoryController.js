import Category from '../models/Category.js';
import Feedback from '../models/Feedback.js';
import { validationResult } from 'express-validator';

// =============================================================================
// ✅ CREATE - Add new category
// =============================================================================
export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, icon, color, order } = req.body;

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create({
      name,
      description,
      icon,
      color,
      order: order || 0,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: { category },
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('❌ Create Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating category'
    });
  }
};

// =============================================================================
// ✅ READ - Get all categories
// =============================================================================
export const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
};

// =============================================================================
// ✅ READ - Get single category
// =============================================================================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const feedbackCount = await Feedback.countDocuments({
      category: category.name
    });

    res.json({
      success: true,
      data: {
        category,
        feedbackCount
      }
    });

  } catch (error) {
    console.error('❌ Get Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching category'
    });
  }
};

// =============================================================================
// ✅ UPDATE - Update category
// =============================================================================
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, order, isActive } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (name && name !== category.name) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }

      await Feedback.updateMany(
        { category: category.name },
        { category: name }
      );
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      data: { category },
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('❌ Update Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating category'
    });
  }
};

// =============================================================================
// ✅ DELETE - Delete category
// =============================================================================
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const feedbackCount = await Feedback.countDocuments({
      category: category.name
    });

    // Soft delete if feedback exists
    if (feedbackCount > 0 && hardDelete !== 'true') {
      category.isActive = false;
      await category.save();

      return res.json({
        success: true,
        message: 'Category deactivated (has existing feedback)',
        data: { category, feedbackCount }
      });
    }

    // Hard delete
    if (hardDelete === 'true') {
      await Feedback.updateMany(
        { category: category.name },
        { category: 'Other' }
      );

      await Category.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: 'Category permanently deleted',
        data: {
          deletedId: id,
          feedbackReassigned: feedbackCount
        }
      });
    }

    // Default soft delete
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Category deactivated successfully',
      data: { category }
    });

  } catch (error) {
    console.error('❌ Delete Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting category'
    });
  }
};

// =============================================================================
// ✅ REORDER - Update category order
// =============================================================================
export const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array'
      });
    }

    await Promise.all(
      categories.map(cat =>
        Category.findByIdAndUpdate(cat._id, { order: cat.order })
      )
    );

    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });

  } catch (error) {
    console.error('❌ Reorder Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reordering categories'
    });
  }
};

// =============================================================================
// ✅ GET ACTIVE - Get only active categories
// =============================================================================
export const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .select('name description icon color');

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('❌ Get Active Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
};
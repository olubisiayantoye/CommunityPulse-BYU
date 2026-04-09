import User from '../models/User.js';
import { validationResult } from 'express-validator';

// =============================================================================
// ✅ READ - Get all users (admin only)
// =============================================================================
export const getUsersX = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      organization
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (organization) {
      query.organization = { $regex: organization, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};


export const getUsers = async (req, res) => {
  try {
    // ✅ Extract and parse query parameters
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role, 
      isActive, 
      organization 
    } = req.query;

    // ✅ Initialize query object
    const query = {};
    
    // Build search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add role filter
    if (role) {
      query.role = role;
    }
    
    // Add isActive filter (convert string 'true'/'false' to boolean)
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    
    // Add organization filter
    if (organization) {
      query.organization = { $regex: organization, $options: 'i' };
    }

    // ✅ Execute query with pagination
    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // ✅ Get total count for pagination
    const total = await User.countDocuments(query);

    // ✅ Send response
    res.json({
      success: true,
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('❌ Get Users Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching users' 
    });
  }
};




// =============================================================================
// ✅ READ - Get single user (admin only)
// =============================================================================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};

// =============================================================================
// ✅ UPDATE - Update user (admin only)
// =============================================================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, organization, isActive, bio, avatar } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === id && role && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Check for duplicate email
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (organization) user.organization = organization;
    if (isActive !== undefined) user.isActive = isActive;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    user.updatedAt = Date.now();
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('❌ Update User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
};

// =============================================================================
// ✅ DELETE - Deactivate user (soft delete)
// =============================================================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user: { _id: user._id, isActive: false }
    });
  } catch (error) {
    console.error('❌ Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating user'
    });
  }
};

// =============================================================================
// ✅ ACTIVATE - Reactivate a user
// =============================================================================
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully',
      user
    });
  } catch (error) {
    console.error('❌ Activate User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error activating user'
    });
  }
};

// =============================================================================
// ✅ STATS - Get user statistics
// =============================================================================
export const getUserStats = async (req, res) => {
  try {
    const [total, active, admins, members, byOrg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'member' }),
      User.aggregate([
        { $group: { _id: '$organization', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      total,
      active,
      inactive: total - active,
      admins,
      members,
      topOrganizations: byOrg
    });
  } catch (error) {
    console.error('❌ Get User Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user stats'
    });
  }
};
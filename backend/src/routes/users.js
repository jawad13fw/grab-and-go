import { Router } from 'express';
import { nanoid } from 'nanoid';
import { User } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateUpdateProfile, validateAddAddress } from '../middleware/validation.js';

const router = Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, validateUpdateProfile, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(avatar && { avatar }),
      updatedAt: new Date()
    };
    
    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      updateData,
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('addresses');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: { addresses: user.addresses || [] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new address
router.post('/addresses', authMiddleware, validateAddAddress, async (req, res) => {
  try {
    const { label, address, coordinates, instructions, isDefault } = req.body;
    
    const newAddress = {
      id: `addr-${nanoid(8)}`,
      label: label || 'Other',
      address,
      coordinates,
      instructions,
      isDefault: isDefault || false
    };
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // If this is the first address or set as default, handle default logic
    if (isDefault || !user.addresses || user.addresses.length === 0) {
      if (user.addresses) {
        user.addresses.forEach(addr => addr.isDefault = false);
      }
      newAddress.isDefault = true;
    }
    
    user.addresses = user.addresses || [];
    user.addresses.push(newAddress);
    user.updatedAt = new Date();
    
    await user.save();
    
    res.status(201).json({
      success: true,
      data: { address: newAddress }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update address
router.put('/addresses/:addressId', authMiddleware, validateAddAddress, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, address, coordinates, instructions, isDefault } = req.body;
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const addressIndex = user.addresses.findIndex(a => a.id === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Update fields
    if (label) user.addresses[addressIndex].label = label;
    if (address) user.addresses[addressIndex].address = address;
    if (coordinates) user.addresses[addressIndex].coordinates = coordinates;
    if (instructions !== undefined) user.addresses[addressIndex].instructions = instructions;
    
    // Handle default address logic
    if (isDefault) {
      user.addresses.forEach((addr, idx) => {
        addr.isDefault = idx === addressIndex;
      });
    }
    
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      data: { address: user.addresses[addressIndex] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete address
router.delete('/addresses/:addressId', authMiddleware, async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const addressIndex = user.addresses.findIndex(a => a.id === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);
    
    // If deleted address was default, set first remaining as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      data: { addresses: user.addresses }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get favorite shops
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('favorites');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: { favorites: user.favorites || [] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add shop to favorites
router.post('/favorites', authMiddleware, async (req, res) => {
  try {
    const { shopId } = req.body;
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.favorites = user.favorites || [];
    
    if (user.favorites.includes(shopId)) {
      return res.status(400).json({ success: false, message: 'Shop already in favorites' });
    }
    
    user.favorites.push(shopId);
    user.updatedAt = new Date();
    await user.save();
    
    res.status(201).json({
      success: true,
      data: { favorites: user.favorites }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove shop from favorites
router.delete('/favorites/:shopId', authMiddleware, async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.favorites = user.favorites || [];
    user.favorites = user.favorites.filter(id => id !== shopId);
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      data: { favorites: user.favorites }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

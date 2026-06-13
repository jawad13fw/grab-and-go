import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, BuildingStorefrontIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ImageUpload from '../../components/common/ImageUpload';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { catalogApi } from '../../api/endpoints';
import { getShopBanner, handleImageError, SHOP_BANNER_FALLBACK } from '../../utils/imageUtils';

const vendorRoutesBase = [
  { label: 'Dashboard', path: '/vendor/dashboard' },
  { label: 'My Shops', path: '/vendor/shops' },
  { label: 'Products', path: '/vendor/products' },
  { label: 'Orders', path: '/vendor/orders' },
  { label: 'Profile', path: '/vendor/profile' },
];

const CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Electronics', 'Fashion', 'Other'];

const VendorShops = () => {
  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    description: '',
    address: '',
    phone: '',
    deliveryTime: '30-45 min',
    deliveryFee: 0,
    minOrder: 0,
    hours: '9:00 AM - 10:00 PM',
    image: '',
    banner: ''
  });

  useEffect(() => {
    loadShops(currentPage);
  }, [currentPage]);

  const loadShops = async (page = 1) => {
    setLoading(true);
    try {
      const response = await catalogApi.getMyShops({ page, limit: 10 });

      if (response?.pagination) {
        setShops(response.shops || []);
        setPagination(response.pagination);
      } else {
        // Fallback for backward compatibility
        setShops(response?.shops || []);
        setPagination(null);
      }
    } catch (err) {
      console.error('Failed to load shops:', err);
      setError('Failed to load shops. Please try again.');
      setShops([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await catalogApi.createShop(formData);
      if (response.success) {
        // Refresh current page to show the new shop
        loadShops(currentPage);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (err) {
      setError('Failed to create shop: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await catalogApi.updateShop(editingShop.id, formData);
      if (response.success) {
        // Refresh current page to show updated shop
        loadShops(currentPage);
        setEditingShop(null);
        resetForm();
      }
    } catch (err) {
      setError('Failed to update shop: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (shopId) => {
    if (isProcessing) return;
    if (!window.confirm('Are you sure you want to delete this shop?')) return;

    setIsProcessing(true);
    setError(null);

    try {
      await catalogApi.deleteShop(shopId);
      // Refresh current page to remove deleted shop
      loadShops(currentPage);
    } catch (err) {
      setError('Failed to delete shop: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Food',
      description: '',
      address: '',
      phone: '',
      deliveryTime: '30-45 min',
      deliveryFee: 0,
      minOrder: 0,
      hours: '9:00 AM - 10:00 PM',
      image: '',
      banner: ''
    });
    setError(null);
  };

  const openEditModal = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      category: shop.category,
      description: shop.description || '',
      address: shop.address,
      phone: shop.phone || '',
      deliveryTime: shop.deliveryTime,
      deliveryFee: shop.deliveryFee,
      minOrder: shop.minOrder,
      hours: shop.hours,
      image: shop.image || '',
      banner: shop.banner || ''
    });
    setError(null);
  };

  const vendorRoutes = vendorRoutesBase.map((r) =>
    r.path === '/vendor/shops' ? { ...r, badge: pagination ? pagination.totalItems : shops.length } : r
  );

  if (loading) return <Loader label="Loading shops..." />;

  const renderShopForm = (onSubmit) => (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Shop Information</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Shop Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isProcessing}
          />
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Category</span>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-slate-100"
              disabled={isProcessing}
            >
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Description</span>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isProcessing}
            rows={4}
            placeholder="Tell customers what makes your shop special"
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-slate-100"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact & Timing</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Address"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={isProcessing}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={isProcessing}
          />
          <Input
            label="Delivery Time"
            value={formData.deliveryTime}
            onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
            disabled={isProcessing}
          />
          <Input
            label="Hours"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            disabled={isProcessing}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Delivery Pricing</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Delivery Fee (Rs)"
            type="number"
            value={formData.deliveryFee}
            onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
            disabled={isProcessing}
          />
          <Input
            label="Min Order (Rs)"
            type="number"
            value={formData.minOrder}
            onChange={(e) => setFormData({ ...formData, minOrder: parseFloat(e.target.value) || 0 })}
            disabled={isProcessing}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Images</p>
        <div className="mt-4 space-y-4">
          <ImageUpload
            label="Shop Image"
            value={formData.image}
            onChange={(value) => setFormData({ ...formData, image: value })}
            disabled={isProcessing}
            helperText="Upload an image or enter a URL. Max 2MB."
          />
          <ImageUpload
            label="Banner Image"
            value={formData.banner}
            onChange={(value) => setFormData({ ...formData, banner: value })}
            disabled={isProcessing}
            helperText="Upload an image or enter a URL. Max 2MB."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            editingShop ? 'Save Changes' : 'Create Shop'
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShowCreateModal(false);
            setEditingShop(null);
            resetForm();
          }}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={vendorRoutes} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Vendor</p>
            <h1 className="text-3xl font-semibold text-slate-900">My Shops</h1>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={isProcessing}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Shop
          </Button>
        </div>

        {shops.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <BuildingStorefrontIcon className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No shops yet</h3>
            <p className="mt-2 text-slate-500">Create your first shop to start selling</p>
            <Button
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
              disabled={isProcessing}
            >
              Create Shop
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {shops.map((shop) => (
                <div key={shop.id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={getShopBanner(shop)}
                      alt={shop.name}
                      className="h-full w-full object-cover"
                      onError={handleImageError(SHOP_BANNER_FALLBACK)}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-primary">{shop.category}</p>
                        <h3 className="text-xl font-semibold text-slate-900">{shop.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{shop.address}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(shop)}
                          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                          disabled={isProcessing}
                        >
                          <PencilIcon className="h-5 w-5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(shop.id)}
                          className="p-2 rounded-lg hover:bg-rose-50 disabled:opacity-50"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <svg className="animate-spin h-5 w-5 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <TrashIcon className="h-5 w-5 text-rose-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                      <span>{shop.deliveryTime}</span>
                      <span>-</span>
                      <span>Rs. {shop.deliveryFee} delivery</span>
                      <span>-</span>
                      <span>Rs. {shop.minOrder} min</span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Link to={`/vendor/products?shopId=${shop.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full" disabled={isProcessing}>
                          Manage Products
                        </Button>
                      </Link>
                      <Link to={`/shops/${shop.id}`} target="_blank" className="flex-1">
                        <Button variant="ghost" className="w-full" disabled={isProcessing}>
                          View Shop
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>

      {/* Create Shop Modal */}
      <Modal
        title="Create New Shop"
        isOpen={showCreateModal}
        size="lg"
        onClose={() => {
          if (!isProcessing) {
            setShowCreateModal(false);
            resetForm();
          }
        }}
      >
        {renderShopForm(handleCreate)}
      </Modal>

      {/* Edit Shop Modal */}
      <Modal
        title="Edit Shop"
        isOpen={Boolean(editingShop)}
        size="lg"
        onClose={() => {
          if (!isProcessing) {
            setEditingShop(null);
            resetForm();
          }
        }}
      >
        {renderShopForm(handleUpdate)}
      </Modal>
    </div>
  );
};

export default VendorShops;

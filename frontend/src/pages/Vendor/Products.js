import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import VendorProductCard from '../../components/vendor/VendorProductCard';
import Sidebar from '../../components/layout/Sidebar';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ImageUpload from '../../components/common/ImageUpload';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { catalogApi } from '../../api/endpoints';

const vendorRoutesBase = [
  { label: 'Dashboard', path: '/vendor/dashboard' },
  { label: 'My Shops', path: '/vendor/shops' },
  { label: 'Products', path: '/vendor/products' },
  { label: 'Orders', path: '/vendor/orders' },
  { label: 'Profile', path: '/vendor/profile' },
];

const CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Electronics', 'Fashion', 'Other'];

const VendorProducts = () => {
  const [searchParams] = useSearchParams();
  const preselectedShopId = searchParams.get('shopId');
  
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Food',
    shopId: preselectedShopId || '',
    image: ''
  });

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const [productsRes, shopsRes] = await Promise.all([
        catalogApi.getMyProducts({ page, limit: 15 }),
        catalogApi.getMyShops()
      ]);
      
      if (productsRes?.pagination) {
        setProducts(productsRes.products || []);
        setPagination(productsRes.pagination);
      } else {
        // Fallback for backward compatibility
        setProducts(productsRes?.products || []);
        setPagination(null);
      }
      
      setShops(shopsRes?.shops || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load products and shops. Please try again.');
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await catalogApi.createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });
      if (response.success) {
        // Refresh current page to show the new product
        loadData(currentPage);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (err) {
      setError('Failed to create product: ' + (err.response?.data?.message || err.message || 'Unknown error'));
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
      const response = await catalogApi.updateProduct(editingProduct.id, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });
      if (response.success) {
        // Refresh current page to show updated product
        loadData(currentPage);
        setEditingProduct(null);
        resetForm();
      }
    } catch (err) {
      setError('Failed to update product: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (productId) => {
    if (isProcessing) return;
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await catalogApi.deleteProduct(productId);
      // Refresh current page to remove deleted product
      loadData(currentPage);
    } catch (err) {
      setError('Failed to delete product: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'Food',
      shopId: preselectedShopId || '',
      image: ''
    });
    setError(null);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      category: product.category,
      shopId: product.shopId,
      image: product.image || ''
    });
    setError(null);
  };

  const vendorRoutes = vendorRoutesBase.map((r) =>
    r.path === '/vendor/products' ? { ...r, badge: products.length } : r
  );

  if (loading) return <Loader label="Loading products..." />;

  const renderProductForm = (onSubmit) => (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Basic Information</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Product name"
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
                placeholder="Describe ingredients, size, or key highlights"
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-slate-100"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing & Inventory</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Price (₨)"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={isProcessing}
              />
              <Input
                label="Stock"
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Listing Details</p>
            <div className="mt-4 space-y-4">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span className="font-medium text-slate-800">Shop</span>
                <select
                  value={formData.shopId}
                  onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-slate-100"
                  disabled={isProcessing}
                  required
                >
                  <option value="">Select a shop</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </label>
              <ImageUpload
                label="Product image"
                value={formData.image}
                onChange={(value) => setFormData({ ...formData, image: value })}
                disabled={isProcessing}
                helperText="Upload an image or enter a URL. Max 2MB."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
        <Button 
          type="button"
          variant="secondary"
          onClick={() => {
            setShowCreateModal(false);
            setEditingProduct(null);
            resetForm();
          }}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 sm:flex-none sm:min-w-[160px]"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="-ml-1 mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            editingProduct ? 'Save changes' : 'Create product'
          )}
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
            <h1 className="text-3xl font-semibold text-slate-900">My Products</h1>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            disabled={isProcessing}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Product
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No products yet</h3>
            <p className="mt-2 text-slate-500">Create your first product to start selling</p>
            <Button 
              className="mt-4" 
              onClick={() => setShowCreateModal(true)}
              disabled={isProcessing}
            >
              Create Product
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <VendorProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => openEditModal(product)}
                  onDelete={() => handleDelete(product.id)}
                  disabled={isProcessing}
                />
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

      {/* Create Product Modal */}
      <Modal
        title="Create New Product"
        isOpen={showCreateModal}
        size="lg"
        onClose={() => {
          if (!isProcessing) {
            setShowCreateModal(false);
            resetForm();
          }
        }}
      >
        {renderProductForm(handleCreate)}
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        title="Edit Product"
        isOpen={Boolean(editingProduct)}
        size="lg"
        onClose={() => {
          if (!isProcessing) {
            setEditingProduct(null);
            resetForm();
          }
        }}
      >
        {renderProductForm(handleUpdate)}
      </Modal>
    </div>
  );
};

export default VendorProducts;

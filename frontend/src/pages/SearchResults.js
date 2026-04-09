import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ProductCard from '../components/shop/ProductCard';
import ShopCard from '../components/shop/ShopCard';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import { catalogApi } from '../api/endpoints';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const type = searchParams.get('type') || 'all'; // 'all', 'products', 'shops'
  const pageFromUrl = parseInt(searchParams.get('page')) || 1;
  
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [productsPagination, setProductsPagination] = useState(null);
  const [shopsPagination, setShopsPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: category,
    minPrice: '',
    maxPrice: ''
  });

  const fetchResults = async (page = 1, searchQuery = query, searchType = type) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (searchQuery) params.q = searchQuery;
      if (filters.category && filters.category !== 'all') params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      // Fetch products
      if (searchType === 'all' || searchType === 'products') {
        const productsRes = await catalogApi.searchProducts(params);
        if (productsRes?.pagination) {
          setProducts(productsRes.products || []);
          setProductsPagination(productsRes.pagination);
        } else {
          setProducts(productsRes || []);
          setProductsPagination(null);
        }
      } else {
        setProducts([]);
        setProductsPagination(null);
      }

      // Fetch shops
      if (searchType === 'all' || searchType === 'shops') {
        const shopsRes = await catalogApi.searchShops({
          ...params,
          limit: searchType === 'shops' ? 12 : 6
        });
        if (shopsRes?.pagination) {
          setShops(shopsRes.shops || []);
          setShopsPagination(shopsRes.pagination);
        } else {
          setShops(shopsRes || []);
          setShopsPagination(null);
        }
      } else {
        setShops([]);
        setShopsPagination(null);
      }
    } catch (err) {
      console.error('Failed to fetch search results:', err);
      setProducts([]);
      setShops([]);
      setProductsPagination(null);
      setShopsPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    catalogApi.getCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => {});
    
    if (query) {
      fetchResults(currentPage, query, type);
    } else {
      setProducts([]);
      setShops([]);
      setProductsPagination(null);
      setShopsPagination(null);
      setLoading(false);
    }
  }, [currentPage, query, type, filters]);

  const handleSearch = (newQuery) => {
    setCurrentPage(1);
    const params = { page: 1 };
    if (newQuery) params.q = newQuery;
    if (type && type !== 'all') params.type = type;
    if (filters.category && filters.category !== 'all') params.category = filters.category;
    setSearchParams(params);
  };

  const handleTypeChange = (newType) => {
    setCurrentPage(1);
    const params = { page: 1 };
    if (query) params.q = query;
    if (newType && newType !== 'all') params.type = newType;
    if (filters.category && filters.category !== 'all') params.category = filters.category;
    setSearchParams(params);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    const params = { page: 1 };
    if (query) params.q = query;
    if (type && type !== 'all') params.type = type;
    if (newFilters.category && newFilters.category !== 'all') params.category = newFilters.category;
    if (newFilters.minPrice) params.minPrice = newFilters.minPrice;
    if (newFilters.maxPrice) params.maxPrice = newFilters.maxPrice;
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const params = { page: newPage };
    if (query) params.q = query;
    if (type && type !== 'all') params.type = type;
    if (filters.category && filters.category !== 'all') params.category = filters.category;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <Loader label="Searching..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <MagnifyingGlassIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Results</h1>
        {query ? (
          <p className="text-slate-600">
            Found results for <span className="font-semibold text-primary">"{query}"</span>
          </p>
        ) : (
          <p className="text-slate-600">Enter a search term to find products and shops</p>
        )}
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search products and shops..."
          initialValue={query}
          showFilters={true}
          onFilterChange={handleFilterChange}
          filters={filters}
        />
      </div>

      {/* Type Tabs */}
      {query && (
        <div className="flex justify-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'all'
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTypeChange('products')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'products'
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => handleTypeChange('shops')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'shops'
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Shops
          </button>
        </div>
      )}

      {/* Results */}
      {query ? (
        <>
          {/* Products Section */}
          {(type === 'all' || type === 'products') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Products</h2>
                {productsPagination && (
                  <span className="text-sm text-slate-500">
                    {productsPagination.totalItems} result{productsPagination.totalItems !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {products.length > 0 ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  
                  {productsPagination && (
                    <Pagination 
                      pagination={productsPagination} 
                      onPageChange={handlePageChange}
                      className="mt-8"
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">No products found matching your search.</p>
                </div>
              )}
            </section>
          )}

          {/* Shops Section */}
          {(type === 'all' || type === 'shops') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Shops</h2>
                {shopsPagination && (
                  <span className="text-sm text-slate-500">
                    {shopsPagination.totalItems} result{shopsPagination.totalItems !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {shops.length > 0 ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    {shops.map((shop) => (
                      <ShopCard key={shop.id} shop={shop} />
                    ))}
                  </div>
                  
                  {shopsPagination && (
                    <Pagination 
                      pagination={shopsPagination} 
                      onPageChange={handlePageChange}
                      className="mt-8"
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">No shops found matching your search.</p>
                </div>
              )}
            </section>
          )}

          {/* No Results */}
          {products.length === 0 && shops.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
                <MagnifyingGlassIcon className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No results found</h3>
              <p className="text-slate-600 mb-6">
                Try adjusting your search terms or filters
              </p>
              <div className="flex justify-center gap-3">
                <Link
                  to="/shops"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Browse Shops
                </Link>
                <Link
                  to="/categories"
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
            <MagnifyingGlassIcon className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Start Searching</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Search for products and shops by name, category, or description
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;


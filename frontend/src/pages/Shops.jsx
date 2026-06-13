import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ShopCard from '../components/shop/ShopCard';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import { catalogApi } from '../api/endpoints';

const Shops = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'all';
  const searchQueryFromUrl = searchParams.get('q') || '';
  const pageFromUrl = parseInt(searchParams.get('page')) || 1;
  const [filter, setFilter] = useState(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchQueryFromUrl);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);

  const searchSuggestions = useMemo(() => {
    return (categories || []).slice(0, 8).map((item) => ({
      label: item.name || item.id,
      value: item.name || item.id,
      meta: 'Category',
    }));
  }, [categories]);

  const fetchShops = async (page = 1, category = 'all', query = '') => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      
      if (query) {
        // Use search endpoint
        if (category && category !== 'all') params.category = category;
        if (query) params.q = query;
        
        const response = await catalogApi.searchShops(params);
        
        if (response.pagination) {
          setShops(response.shops || []);
          setPagination(response.pagination);
          setSearchQuery(query);
        } else {
          // Fallback for backward compatibility
          setShops(response || []);
          setPagination(null);
          setSearchQuery('');
        }
      } else {
        // Use regular shops endpoint
        if (category && category !== 'all') params.category = category;
        
        const response = await catalogApi.getShops(params);
        
        if (response.pagination) {
          setShops(response.shops || []);
          setPagination(response.pagination);
        } else {
          // Fallback for backward compatibility
          setShops(response || []);
          setPagination(null);
        }
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Failed to fetch shops:', err);
      setShops([]);
      setPagination(null);
      setSearchQuery('');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    catalogApi.getCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => {});
    
    fetchShops(currentPage, filter, searchQuery);
  }, [currentPage, filter, searchQuery]);

  useEffect(() => {
    setFilter(categoryFromUrl);
    setSearchQuery(searchQueryFromUrl);
    setCurrentPage(1);
    const params = { category: categoryFromUrl, page: 1 };
    if (searchQueryFromUrl) params.q = searchQueryFromUrl;
    setSearchParams(params);
  }, [categoryFromUrl, searchQueryFromUrl]);
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSearchParams({ category: filter, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    const params = { category: newFilter, page: 1 };
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params);
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    const params = { page: 1 };
    if (query) params.q = query;
    if (filter && filter !== 'all') params.category = filter;
    setSearchParams(params);
  };

  // For backward compatibility, filter shops if no pagination
  const filteredShops = useMemo(
    () => {
      if (pagination) return shops; // Already filtered on backend
      let result = shops;
      if (filter && filter !== 'all') {
        result = result.filter((shop) => shop.category === filter);
      }
      return result;
    },
    [filter, shops, pagination]
  );

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Vendors</p>
          <h2 className="text-3xl font-semibold text-slate-900">Discover shops</h2>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 md:w-48"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search shops by name, category, or address..."
          initialValue={searchQuery}
          className="max-w-2xl"
          suggestions={searchSuggestions}
          recentSearchKey="shop-searches"
          helperText="Search by shop name, location, or category"
        />
        {searchQuery && (
          <p className="mt-2 text-sm text-slate-600">
            Search results for: <span className="font-semibold">"{searchQuery}"</span>
            {pagination && (
              <span className="ml-2">
                ({pagination.totalItems} result{pagination.totalItems !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        )}
      </div>
      {filteredShops.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900 mb-1">No shops match your filters</p>
          <p className="text-sm text-slate-500 mb-4">
            Try adjusting the category or search terms to discover more places.
          </p>
        </div>
      )}
      
      {pagination && (
        <Pagination 
          pagination={pagination} 
          onPageChange={handlePageChange}
          className="mt-8"
        />
      )}
    </div>
  );
};

export default Shops;

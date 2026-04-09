import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...", 
  initialValue = "",
  className = "",
  showFilters = false,
  onFilterChange = () => {},
  filters = {}
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Handle search on Enter key or button click
  const handleSearch = () => {
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  // Update query when initialValue changes (for controlled components)
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center rounded-2xl border bg-white transition-all duration-200 ${
        isFocused 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-slate-200 hover:border-slate-300'
      }`}>
        <div className="pl-4 py-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-2 py-3 text-sm text-slate-900 placeholder-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="pr-4 py-3 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        
        <button
          onClick={handleSearch}
          className="px-4 py-3 bg-primary text-white rounded-r-2xl hover:bg-primary-dark transition-colors font-medium text-sm"
        >
          Search
        </button>
      </div>
      
      {/* Filters (if enabled) */}
      {showFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="Food">Food</option>
            <option value="Grocery">Grocery</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Other">Other</option>
          </select>
          
          {filters.minPrice !== undefined && (
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-24"
            />
          )}
          
          {filters.maxPrice !== undefined && (
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-24"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;


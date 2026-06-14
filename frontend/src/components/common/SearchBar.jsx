import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { BuildingStorefrontIcon } from '@heroicons/react/24/solid';

const normalizeSuggestion = (suggestion) => {
  if (typeof suggestion === 'string') {
    return { label: suggestion, value: suggestion, meta: '', type: 'generic' };
  }

  if (!suggestion) {
    return null;
  }

  const label = suggestion.label || suggestion.value || '';
  const value = suggestion.value || suggestion.label || '';

  if (!label || !value) {
    return null;
  }

  return {
    ...suggestion,
    label,
    value,
    meta: suggestion.meta || '',
    type: suggestion.type || 'generic',
    image: suggestion.image || null,
    price: suggestion.price ?? null,
    category: suggestion.category || '',
    keywords: Array.isArray(suggestion.keywords) ? suggestion.keywords : [],
  };
};

const dedupeSuggestions = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.value.trim().toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const readStoredSearches = (storageKey) => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item === 'string' && item.trim());
  } catch {
    return [];
  }
};

const SearchBar = ({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
  className = '',
  showFilters = false,
  onFilterChange = () => {},
  filters = {},
  suggestions = [],
  onFetchSuggestions = null, // async (query) => suggestions[]
  fetchDebounceMs = 300,
  recentSearchKey = 'grab-and-go-searches',
  showSubmitButton = true,
  variant = 'default',
  enableHotkey = true,
  clearOnSubmit = false,
  helperText = 'Press / to focus search',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const suggestionMouseDownRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setRecentSearches(readStoredSearches(recentSearchKey));
  }, [recentSearchKey]);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!enableHotkey || typeof window === 'undefined') {
      return undefined;
    }

    const handleHotkey = (event) => {
      const activeElement = document.activeElement;
      const isTypingField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable
      );

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingField) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleHotkey);

    return () => window.removeEventListener('keydown', handleHotkey);
  }, [enableHotkey]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const normalizedSuggestions = useMemo(
    () => dedupeSuggestions(suggestions.map(normalizeSuggestion).filter(Boolean)),
    [suggestions]
  );

  const normalizedQuery = query.trim();

  // Debounced async suggestion fetching
  useEffect(() => {
    if (!onFetchSuggestions) {
      setDynamicSuggestions([]);
      return;
    }

    if (!normalizedQuery || normalizedQuery.length < 2) {
      setDynamicSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const requestId = ++fetchRequestIdRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      setIsFetchingSuggestions(true);
      try {
        const results = await onFetchSuggestions(normalizedQuery);
        // Only update if this is still the latest request
        if (requestId === fetchRequestIdRef.current) {
          setDynamicSuggestions(
            dedupeSuggestions((results || []).map(normalizeSuggestion).filter(Boolean))
          );
        }
      } catch {
        if (requestId === fetchRequestIdRef.current) {
          setDynamicSuggestions([]);
        }
      } finally {
        if (requestId === fetchRequestIdRef.current) {
          setIsFetchingSuggestions(false);
        }
      }
    }, fetchDebounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [normalizedQuery, onFetchSuggestions, fetchDebounceMs]);

  const visibleSuggestions = useMemo(() => {
    const searchSpace = normalizedQuery.toLowerCase();

    // Dynamic (API-fetched) suggestions take priority
    const dynamicHits = dynamicSuggestions.length > 0
      ? dynamicSuggestions
      : [];

    // Static suggestions as fallback, filtered by query
    const staticHits = normalizedSuggestions.filter((item) => {
      if (!searchSpace) {
        return true;
      }

      const haystack = [item.label, item.value, item.meta, ...(item.keywords || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchSpace);
    });

    // Recent searches only when query is empty
    const recentHits = normalizedQuery
      ? []
      : recentSearches.map((item) => ({
          label: item,
          value: item,
          meta: 'Recent search',
          type: 'recent',
        }));

    // Merge: dynamic first, then static, then recent; dedupe
    return dedupeSuggestions([...recentHits, ...dynamicHits, ...staticHits]).slice(0, 8);
  }, [normalizedQuery, normalizedSuggestions, dynamicSuggestions, recentSearches]);

  // Group suggestions by type for rendering
  const groupedSuggestions = useMemo(() => {
    const groups = [];
    const products = visibleSuggestions.filter((s) => s.type === 'product');
    const shops = visibleSuggestions.filter((s) => s.type === 'shop');
    const recents = visibleSuggestions.filter((s) => s.type === 'recent');
    const others = visibleSuggestions.filter((s) => !['product', 'shop', 'recent'].includes(s.type));

    if (recents.length > 0) groups.push({ title: 'Recent', items: recents });
    if (products.length > 0) groups.push({ title: 'Products', items: products });
    if (shops.length > 0) groups.push({ title: 'Shops', items: shops });
    if (others.length > 0) groups.push({ title: '', items: others });

    return groups;
  }, [visibleSuggestions]);

  // Show dropdown: when focused and either has suggestions, has a typed query, or is loading
  const showDropdown = isOpen && (visibleSuggestions.length > 0 || normalizedQuery.length >= 2);

  const persistSearch = (value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue || typeof window === 'undefined') {
      return;
    }

    setRecentSearches((currentSearches) => {
      const nextSearches = [
        trimmedValue,
        ...currentSearches.filter((item) => item.toLowerCase() !== trimmedValue.toLowerCase()),
      ].slice(0, 8);

      try {
        window.localStorage.setItem(recentSearchKey, JSON.stringify(nextSearches));
      } catch {
        // Ignore storage failures.
      }

      return nextSearches;
    });
  };

  const runSearch = (value = query) => {
    const nextValue = value.trim();

    if (onSearch) {
      onSearch(nextValue);
    }

    if (nextValue) {
      persistSearch(nextValue);
    }

    setIsOpen(false);
    setActiveIndex(-1);
    setDynamicSuggestions([]);

    if (clearOnSubmit) {
      setQuery('');
    }
  };

  const selectSuggestion = (suggestion) => {
    if (!suggestion) {
      return;
    }

    setQuery(suggestion.value);

    if (onSearch) {
      onSearch(suggestion.value);
    }

    persistSearch(suggestion.value);

    if (typeof onFilterChange === 'function' && suggestion.type === 'filter') {
      onFilterChange(suggestion.filterValue || suggestion.value);
    }

    if (typeof suggestion.onSelect === 'function') {
      suggestion.onSelect(suggestion);
    }

    setIsOpen(false);
    setActiveIndex(-1);
    setDynamicSuggestions([]);

    if (clearOnSubmit) {
      setQuery('');
    }
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' && visibleSuggestions.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => (currentIndex + 1) % visibleSuggestions.length);
      return;
    }

    if (event.key === 'ArrowUp' && visibleSuggestions.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => (
        currentIndex <= 0 ? visibleSuggestions.length - 1 : currentIndex - 1
      ));
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (isOpen && activeIndex >= 0 && visibleSuggestions[activeIndex]) {
        selectSuggestion(visibleSuggestions[activeIndex]);
        return;
      }

      runSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    setDynamicSuggestions([]);

    if (onSearch) {
      onSearch('');
    }
  };

  const handleBlur = () => {
    if (suggestionMouseDownRef.current) {
      suggestionMouseDownRef.current = false;
      inputRef.current?.focus();
      return;
    }

    setIsFocused(false);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const inputSizeClasses = variant === 'compact'
    ? 'py-2.5 text-sm'
    : 'py-3 text-sm';

  const shellClasses = variant === 'compact'
    ? 'rounded-full'
    : 'rounded-2xl';

  // Helper: highlight matching text
  const HighlightMatch = ({ text, query }) => {
    if (!query || !text) return <>{text}</>;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-slate-900">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className={`flex items-center border bg-white transition-all duration-200 ${shellClasses} ${
        isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
      }`}>
        <div className={variant === 'compact' ? 'pl-4' : 'pl-4'}>
          <MagnifyingGlassIcon className={variant === 'compact' ? 'h-4 w-4 text-slate-400' : 'h-5 w-5 text-slate-400'} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={visibleSuggestions.length ? 'search-suggestions' : undefined}
          className={`flex-1 px-2 bg-transparent border-0 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 ${inputSizeClasses}`}
        />

        {isFetchingSuggestions && (
          <span className="px-2 text-xs text-slate-400 animate-pulse">Searching...</span>
        )}

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-3 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        {showSubmitButton && (
          <button
            type="button"
            onClick={() => runSearch()}
            className={`bg-primary text-white hover:bg-primary-dark transition-colors font-medium ${
              variant === 'compact'
                ? 'mr-1 rounded-full px-3 py-2 text-xs'
                : 'rounded-r-2xl px-4 py-3 text-sm'
            }`}
          >
            Search
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div id="search-suggestions" role="listbox" className="max-h-96 overflow-auto">
            {visibleSuggestions.length === 0 && normalizedQuery.length >= 2 && isFetchingSuggestions ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-2 text-xs text-slate-400">Searching...</p>
              </div>
            ) : visibleSuggestions.length === 0 && normalizedQuery.length >= 2 && !isFetchingSuggestions ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">No results for &ldquo;<span className="font-medium text-slate-700">{normalizedQuery}</span>&rdquo;</p>
                <p className="mt-1 text-xs text-slate-400">Try a different search term</p>
              </div>
            ) : (
              <div className="py-2">
                {groupedSuggestions.map((group, gi) => (
                  <div key={gi}>
                    {group.title && (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{group.title}</span>
                        <div className="flex-1 border-t border-slate-100" />
                      </div>
                    )}
                    {group.items.map((suggestion) => {
                      // Find global index for active state
                      const globalIdx = visibleSuggestions.indexOf(suggestion);
                      return (
                        <button
                          key={`${suggestion.value}-${suggestion.type}-${globalIdx}`}
                          type="button"
                          role="option"
                          aria-selected={globalIdx === activeIndex}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            suggestionMouseDownRef.current = true;
                          }}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          onClick={() => selectSuggestion(suggestion)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            globalIdx === activeIndex ? 'bg-primary/5' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Icon / Image */}
                          {suggestion.type === 'recent' ? (
                            <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
                          ) : suggestion.image ? (
                            <img
                              src={suggestion.image}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-100"
                            />
                          ) : suggestion.type === 'shop' ? (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 border border-slate-100">
                              <BuildingStorefrontIcon className="h-5 w-5 text-primary" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                            </div>
                          )}

                          {/* Label & meta */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-slate-700">
                              <HighlightMatch text={suggestion.label} query={normalizedQuery} />
                            </p>
                            {suggestion.meta && (
                              <p className="mt-0.5 truncate text-xs text-slate-400">{suggestion.meta}</p>
                            )}
                          </div>

                          {/* Price or category badge */}
                          {suggestion.price != null && suggestion.type === 'product' && (
                            <span className="shrink-0 text-sm font-semibold text-slate-900">
                              Rs {Number(suggestion.price).toLocaleString()}
                            </span>
                          )}
                          {suggestion.type === 'shop' && suggestion.category && (
                            <span className="shrink-0 rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {suggestion.category}
                            </span>
                          )}
                          {suggestion.type === 'recent' && (
                            <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
          {visibleSuggestions.length > 0 && normalizedQuery && (
            <div className="border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); suggestionMouseDownRef.current = true; }}
                onClick={() => runSearch()}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                See all results for &ldquo;{normalizedQuery}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

import React from 'react';

const Pagination = ({ pagination, onPageChange, className = '' }) => {
  const { 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    hasNextPage, 
    hasPrevPage 
  } = pagination || {};
  
  if (!pagination || totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page, and last page with ellipsis
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= Math.min(4, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > 4) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage) return;
    onPageChange(page);
  };
  
  const startIndex = ((currentPage - 1) * itemsPerPage) + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Items Info */}
      <div className="text-sm text-slate-500">
        Showing <span className="font-medium">{startIndex}</span> to <span className="font-medium">{endIndex}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasPrevPage
              ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {'<- Previous'}
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={`${page}-${index}`}
              onClick={() => handlePageClick(page)}
              disabled={page === '...' || page === currentPage}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary text-white'
                  : page === '...'
                  ? 'bg-transparent text-slate-400 cursor-default'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasNextPage
              ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Next ->
        </button>
      </div>
    </div>
  );
};

export default Pagination;


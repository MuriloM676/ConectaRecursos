'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  limit, 
  onPageChange 
}: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Mostrando <span className="font-medium text-gray-900">{startItem}</span> a{' '}
        <span className="font-medium text-gray-900">{endItem}</span> de{' '}
        <span className="font-medium text-gray-900">{totalItems}</span> resultados
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-captagov-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

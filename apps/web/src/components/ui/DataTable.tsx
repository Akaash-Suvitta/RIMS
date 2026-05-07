'use client';

import React from 'react';
import { Spinner } from './Spinner';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 animate-pulse rounded"
            style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', width: i === 0 ? '60%' : '80%' }}
          />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found.',
  emptyIcon,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(56, 189, 248, 0.12)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(17, 34, 56, 0.8)', borderBottom: '1px solid rgba(56, 189, 248, 0.12)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#7A9BBD', width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12">
                    {emptyIcon && <div className="mb-3" style={{ color: '#4A6A8A' }}>{emptyIcon}</div>}
                    <p className="text-sm" style={{ color: '#7A9BBD' }}>
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.08)' }}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(26, 51, 80, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '';
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3" style={{ color: '#E8F0F8' }}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dataset } from '@/store/appStore';
import { ArrowUpDown } from 'lucide-react';

export function DatasetTable({ dataset }: { dataset: Dataset }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns: ColumnDef<any>[] = React.useMemo(
    () =>
      dataset.columns.map((col) => ({
        accessorKey: col,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4 h-8 data-[state=open]:bg-accent"
            >
              <span>{col}</span>
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: info => {
          const val = info.getValue();
          if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val);
          }
          return String(val ?? '');
        }
      })),
    [dataset.columns]
  );

  const table = useReactTable({
    data: dataset.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // approximate row height
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-4 shrink-0 px-4 pt-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors duration-300">
        <div className="flex gap-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">Filename: <span className="text-slate-900 dark:text-slate-100 font-medium">{dataset.name}</span></div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Rows: <span className="text-slate-900 dark:text-slate-100 font-medium">{dataset.data.length}</span></div>
        </div>
        <div className="flex-1"></div>
        <Input
          placeholder="Filter data globally..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-[200px] h-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-xs focus-visible:ring-blue-500 text-slate-900 dark:text-slate-200 transition-colors duration-300"
        />
      </div>
      
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-auto px-4 pb-2 relative thin-scrollbar"
      >
         <Table>
           <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
             {table.getHeaderGroups().map((headerGroup) => (
               <TableRow key={headerGroup.id} className="border-b-0 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-300">
                 {headerGroup.headers.map((header) => {
                   return (
                     <TableHead 
                        key={header.id} 
                        className="whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium p-2 h-10 border-slate-200 dark:border-slate-700"
                     >
                       {header.isPlaceholder
                         ? null
                         : flexRender(
                             header.column.columnDef.header,
                             header.getContext()
                           )}
                     </TableHead>
                   )
                 })}
               </TableRow>
             ))}
           </TableHeader>
           <TableBody className="divide-y divide-slate-200 dark:divide-slate-800 transition-colors duration-300">
             {rows.length ? (
               <>
                 {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                   <TableRow>
                     <TableCell colSpan={columns.length} style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px`, padding: 0, border: 0 }} />
                   </TableRow>
                 )}
                 {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                   const row = rows[virtualRow.index];
                   return (
                     <TableRow
                       key={row.id}
                       data-state={row.getIsSelected() && 'selected'}
                       className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300"
                       style={{ height: `${virtualRow.size}px` }}
                       ref={rowVirtualizer.measureElement}
                       data-index={virtualRow.index}
                     >
                       {row.getVisibleCells().map((cell) => (
                         <TableCell 
                            key={cell.id} 
                            className="max-w-[300px] truncate p-3 text-slate-600 dark:text-slate-400"
                         >
                           {flexRender(
                             cell.column.columnDef.cell,
                             cell.getContext()
                           )}
                         </TableCell>
                       ))}
                     </TableRow>
                   )
                 })}
                 {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end < rowVirtualizer.getTotalSize() && (
                   <TableRow>
                     <TableCell colSpan={columns.length} style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px`, padding: 0, border: 0 }} />
                   </TableRow>
                 )}
               </>
             ) : (
               <TableRow>
                 <TableCell
                   colSpan={columns.length}
                   className="h-24 text-center text-slate-500 border-b-0"
                 >
                   No results.
                 </TableCell>
               </TableRow>
             )}
           </TableBody>
         </Table>
      </div>
      
      <div className="flex items-center justify-between px-4 pb-4 shrink-0">
        <div className="flex-1 text-xs text-slate-500 font-medium">
          Showing {table.getFilteredRowModel().rows.length} row(s) out of {dataset.data.length}.
        </div>
      </div>
    </div>
  );
}

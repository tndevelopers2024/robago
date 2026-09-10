// src/components/shared/DataTable.tsx
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "./EmptyState";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading,
    emptyMessage = "Nothing here yet.",
    onRowClick,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 20 } },
    });

    if (!isLoading && data.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                  <TableRow key={i}>
                                      {columns.map((_col, j) => (
                                          <TableCell key={j}>
                                              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              ))
                            : table.getRowModel().rows.map((row) => (
                                  <TableRow
                                      key={row.id}
                                      onClick={() => onRowClick?.(row.original)}
                                      className={onRowClick ? "cursor-pointer" : ""}
                                  >
                                      {row.getVisibleCells().map((cell) => (
                                          <TableCell key={cell.id}>
                                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              ))}
                    </TableBody>
                </Table>
            </div>
            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm text-slate-500">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default DataTable;

// src/components/sheet/SheetGrid.tsx
//
// A small spreadsheet-style grid: drag / shift / ctrl selection, whole-column and whole-row
// selection from the headers, keyboard navigation, inline editing, copy & paste, frozen
// header / first columns / totals row, and an Excel-like status bar (Count, Sum, Average…).
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ClipboardEvent,
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
} from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SheetColumn<R> {
    id: string;
    header: ReactNode;
    subHeader?: ReactNode;
    /** Plain-text name for the status bar / CSV export. */
    label?: string;
    width: number;
    /** Takes all the width left over (width is then its minimum), so the sheet fills its box with no empty column. */
    grow?: boolean;
    align?: "left" | "right" | "center";
    /** Frozen on the left while scrolling sideways (must be the first columns). */
    sticky?: boolean;
    /** Pinned to the right edge while scrolling sideways (must be the last columns) — for action buttons that must stay in view. */
    stickyRight?: boolean;
    /** Raw value — used for copy, edit text and as the default numeric value. */
    getValue: (row: R) => string | number | null | undefined;
    /** Numeric value for Sum / Average. Defaults to the raw value when it is a number. */
    getNumber?: (row: R) => number | null;
    render?: (row: R) => ReactNode;
    editable?: boolean | ((row: R) => boolean);
    /** Typing a single key applies it immediately (to every selected cell) instead of opening an editor. */
    instantKeys?: boolean;
    cellClassName?: (row: R) => string | undefined;
    footer?: (rows: R[]) => ReactNode;
}

export interface CellEdit<R> {
    row: R;
    colId: string;
    text: string;
}

export interface SheetSelectionContext<R> {
    cells: { row: R; col: SheetColumn<R> }[];
}

interface SheetGridProps<R> {
    rows: R[];
    columns: SheetColumn<R>[];
    getRowId: (row: R) => string;
    rowLabel?: (row: R, index: number) => ReactNode;
    onEdit?: (edits: CellEdit<R>[]) => void;
    formatStat?: (n: number) => string;
    /** Extra controls rendered in the status bar, given the current selection. */
    actions?: (ctx: SheetSelectionContext<R>) => ReactNode;
    footerLabel?: ReactNode;
    emptyMessage?: ReactNode;
    className?: string;
    /** Max height of the scrolling area. */
    heightClass?: string;
    /** Fired for a plain click (or tap) on one cell — not for drags or Shift/Ctrl-clicks. */
    onCellClick?: (row: R, colId: string) => void;
    /** Remember dragged column widths under this key (per browser). Without it widths reset on reload. */
    storageKey?: string;
}

/** A range as the user drew it: where it started (the active cell) and where it ends. */
interface RawRange {
    ar: number;
    ac: number;
    er: number;
    ec: number;
}

const GUTTER = 46;
const HEAD_H = 52;
const FOOT_H = 42;

const norm = (g: RawRange) => ({
    r1: Math.min(g.ar, g.er),
    r2: Math.max(g.ar, g.er),
    c1: Math.min(g.ac, g.ec),
    c2: Math.max(g.ac, g.ec),
});

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const ORIGIN: RawRange = { ar: 0, ac: 0, er: 0, ec: 0 };
const lastRange = (rs: RawRange[]): RawRange => rs[rs.length - 1] ?? ORIGIN;

function isEditable<R>(col: SheetColumn<R>, row: R) {
    return typeof col.editable === "function" ? col.editable(row) : Boolean(col.editable);
}

function numberOf<R>(col: SheetColumn<R>, row: R): number | null {
    if (col.getNumber) return col.getNumber(row);
    const v = col.getValue(row);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function isBlank(v: unknown) {
    return v === null || v === undefined || v === "";
}

export function gridToCSV<R>(columns: SheetColumn<R>[], rows: R[]): string {
    const esc = (v: unknown) => {
        const s = isBlank(v) ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map((c) => esc(c.label ?? (typeof c.header === "string" ? c.header : c.id)));
    const body = rows.map((r) => columns.map((c) => esc(c.getValue(r))).join(","));
    return [header.join(","), ...body].join("\n");
}

/** Layers the widths a user dragged (optionally remembered per browser) over the widths a page asked for. */
function useSizedColumns<R>(baseColumns: SheetColumn<R>[], storageKey?: string) {
    const [widths, setWidths] = useState<Record<string, number>>(() => {
        if (!storageKey) return {};
        try {
            const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
            return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
        } catch {
            return {};
        }
    });
    useEffect(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(widths));
        } catch {
            // ignore
        }
    }, [storageKey, widths]);
    const columns = useMemo(() => {
        const sized = baseColumns.map((c) => (widths[c.id] ? { ...c, width: widths[c.id]! } : c));
        // A column the user sized by hand stops stretching; the last scrolling column takes the spare room instead.
        if (!sized.some((c) => c.grow && widths[c.id])) return sized;
        const heir = sized.map((c) => !c.stickyRight && !(c.grow && widths[c.id])).lastIndexOf(true);
        return sized.map((c, i) => ({ ...c, grow: i === heir }));
    }, [baseColumns, widths]);
    const lastPress = useRef({ id: "", at: 0 });
    const dragResize =
        <T,>(col: SheetColumn<T>, fromRight: boolean) =>
        (e: React.PointerEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            // Two quick presses on the same edge = reset (the browser's own dblclick is swallowed by preventDefault).
            const now = e.timeStamp;
            if (lastPress.current.id === col.id && now - lastPress.current.at < 400) {
                lastPress.current = { id: "", at: 0 };
                resetWidth(col.id);
                return;
            }
            lastPress.current = { id: col.id, at: now };
            const startX = e.clientX;
            const startW = e.currentTarget.parentElement?.getBoundingClientRect().width ?? col.width;
            const move = (ev: PointerEvent) => {
                const dx = (ev.clientX - startX) * (fromRight ? -1 : 1);
                setWidths((w) => ({ ...w, [col.id]: Math.round(Math.min(640, Math.max(56, startW + dx))) }));
            };
            const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
                document.body.style.cursor = "";
            };
            document.body.style.cursor = "col-resize";
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
        };
    const resetWidth = (id: string) =>
        setWidths((w) => Object.fromEntries(Object.entries(w).filter(([k]) => k !== id)));
    return { columns, dragResize };
}

export default function SheetGrid<R>({
    rows,
    columns: baseColumns,
    getRowId,
    rowLabel,
    onEdit,
    formatStat = (n) => String(Math.round(n * 100) / 100),
    actions,
    footerLabel,
    emptyMessage,
    className,
    heightClass = "max-h-[min(74dvh,60rem)]",
    onCellClick,
    storageKey,
}: SheetGridProps<R>) {
    const { columns, dragResize } = useSizedColumns(baseColumns, storageKey);
    const [ranges, setRanges] = useState<RawRange[]>([]);
    const [editing, setEditing] = useState<{ r: number; c: number; text: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const editingRef = useRef(editing);
    const draggingRef = useRef(false);
    const pressRef = useRef<{ r: number; c: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const R = rows.length;
    const C = columns.length;
    const hasFooter = columns.some((c) => c.footer);

    // Left offsets for frozen columns (the row-number gutter is always frozen).
    const stickyLeft = useMemo(() => {
        const out: (number | undefined)[] = [];
        let left = GUTTER;
        for (const col of columns) {
            if (col.sticky) {
                out.push(left);
                left += col.width;
            } else out.push(undefined);
        }
        return out;
    }, [columns]);
    // Right offsets for columns pinned to the right edge.
    const stickyRight = useMemo(() => {
        const out: (number | undefined)[] = columns.map(() => undefined);
        let right = 0;
        for (let i = columns.length - 1; i >= 0; i--) {
            const col = columns[i] as SheetColumn<R>;
            if (col.stickyRight) {
                out[i] = right;
                right += col.width;
            }
        }
        return out;
    }, [columns]);
    const frozenRightWidth = useMemo(() => columns.reduce((w, c) => (c.stickyRight ? w + c.width : w), 0), [columns]);
    const frozenWidth = useMemo(() => GUTTER + columns.reduce((w, c) => (c.sticky ? w + c.width : w), 0), [columns]);
    const hasGrow = columns.some((c) => c.grow);
    const tableWidth = GUTTER + columns.reduce((w, c) => w + c.width, 0);

    const setEdit = useCallback((v: { r: number; c: number; text: string } | null) => {
        editingRef.current = v;
        setEditing(v);
    }, []);

    // Drop the selection if rows/columns shrink underneath it (e.g. a search filter).
    useEffect(() => {
        setRanges((prev) => {
            if (prev.every((g) => g.ar < R && g.er < R && g.ac < C && g.ec < C)) return prev;
            return [];
        });
    }, [R, C]);

    useEffect(() => {
        const stop = () => {
            draggingRef.current = false;
        };
        window.addEventListener("mouseup", stop);
        return () => window.removeEventListener("mouseup", stop);
    }, []);

    const last = ranges.length ? ranges[ranges.length - 1] : null;
    const active = last ? { r: last.ar, c: last.ac } : null;

    const scrollToCell = useCallback((r: number, c: number) => {
        const el = scrollRef.current?.querySelector<HTMLElement>(`[data-r="${r}"][data-c="${c}"]`);
        el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, []);

    const inSelection = useCallback(
        (r: number, c: number) =>
            ranges.some((g) => {
                const n = norm(g);
                return r >= n.r1 && r <= n.r2 && c >= n.c1 && c <= n.c2;
            }),
        [ranges],
    );

    // ---- selection stats (the Excel status bar) -------------------------------------------
    const selection = useMemo(() => {
        const seen = new Set<number>();
        const cells: { row: R; col: SheetColumn<R>; r: number; c: number }[] = [];
        for (const g of ranges) {
            const n = norm(g);
            for (let r = n.r1; r <= n.r2; r++) {
                for (let c = n.c1; c <= n.c2; c++) {
                    const key = r * 1000 + c;
                    const row = rows[r];
                    const col = columns[c];
                    if (seen.has(key) || !row || !col) continue;
                    seen.add(key);
                    cells.push({ row, col, r, c });
                }
            }
        }
        let count = 0;
        let numCount = 0;
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        for (const { row, col } of cells) {
            if (!isBlank(col.getValue(row))) count++;
            const n = numberOf(col, row);
            if (n !== null) {
                numCount++;
                sum += n;
                min = Math.min(min, n);
                max = Math.max(max, n);
            }
        }
        return { cells, count, numCount, sum, avg: numCount ? sum / numCount : 0, min, max };
    }, [ranges, rows, columns]);

    // ---- editing --------------------------------------------------------------------------
    const startEdit = useCallback(
        (r: number, c: number, initial?: string) => {
            const row = rows[r];
            const col = columns[c];
            if (!row || !col || !isEditable(col, row)) return;
            const raw = col.getValue(row);
            setEdit({ r, c, text: initial ?? (isBlank(raw) ? "" : String(raw)) });
        },
        [rows, columns, setEdit],
    );

    const moveActive = useCallback(
        (dr: number, dc: number) => {
            setRanges((prev) => {
                const g = lastRange(prev);
                const r = clamp(g.ar + dr, 0, R - 1);
                const c = clamp(g.ac + dc, 0, C - 1);
                queueMicrotask(() => scrollToCell(r, c));
                return [{ ar: r, ac: c, er: r, ec: c }];
            });
        },
        [R, C, scrollToCell],
    );

    const commitEdit = useCallback(
        (move?: { dr: number; dc: number }) => {
            const e = editingRef.current;
            if (!e) return;
            setEdit(null);
            const row = rows[e.r];
            const col = columns[e.c];
            if (row && col) {
                const before = col.getValue(row);
                const unchanged = (isBlank(before) ? "" : String(before)) === e.text;
                if (!unchanged) onEdit?.([{ row, colId: col.id, text: e.text }]);
            }
            scrollRef.current?.focus();
            if (move) moveActive(move.dr, move.dc);
        },
        [rows, columns, onEdit, moveActive, setEdit],
    );

    const cancelEdit = useCallback(() => {
        setEdit(null);
        scrollRef.current?.focus();
    }, [setEdit]);

    // ---- mouse ----------------------------------------------------------------------------
    const handleCellDown = (r: number, c: number, e: MouseEvent) => {
        if (e.button !== 0) return;
        if (editingRef.current && (editingRef.current.r !== r || editingRef.current.c !== c)) commitEdit();
        if (editingRef.current) return; // clicking inside the editor
        draggingRef.current = true;
        pressRef.current = e.shiftKey || e.ctrlKey || e.metaKey ? null : { r, c };
        if (e.shiftKey && last) {
            setRanges((prev) => [...prev.slice(0, -1), { ...lastRange(prev), er: r, ec: c }]);
        } else if (e.ctrlKey || e.metaKey) {
            setRanges((prev) => [...prev, { ar: r, ac: c, er: r, ec: c }]);
        } else {
            setRanges([{ ar: r, ac: c, er: r, ec: c }]);
        }
    };

    const handleCellUp = (r: number, c: number) => {
        const press = pressRef.current;
        pressRef.current = null;
        if (!press || press.r !== r || press.c !== c || !onCellClick) return;
        const row = rows[r];
        const col = columns[c];
        if (row && col) onCellClick(row, col.id);
    };

    const handleCellEnter = (r: number, c: number) => {
        if (!draggingRef.current) return;
        setRanges((prev) => (prev.length ? [...prev.slice(0, -1), { ...lastRange(prev), er: r, ec: c }] : prev));
    };

    const handleColumnHeader = (c: number, e: MouseEvent) => {
        if (!R) return;
        if (editingRef.current) commitEdit();
        const whole = (anchorCol: number): RawRange => ({ ar: 0, ac: anchorCol, er: R - 1, ec: c });
        if (e.shiftKey && last) {
            setRanges((prev) => [...prev.slice(0, -1), whole(lastRange(prev).ac)]);
        } else if (e.ctrlKey || e.metaKey) {
            setRanges((prev) => [...prev, whole(c)]);
        } else setRanges([whole(c)]);
        scrollRef.current?.focus();
    };

    const handleRowHeader = (r: number, e: MouseEvent) => {
        if (!C) return;
        if (editingRef.current) commitEdit();
        const whole = (anchorRow: number): RawRange => ({ ar: anchorRow, ac: 0, er: r, ec: C - 1 });
        if (e.shiftKey && last) {
            setRanges((prev) => [...prev.slice(0, -1), whole(lastRange(prev).ar)]);
        } else if (e.ctrlKey || e.metaKey) {
            setRanges((prev) => [...prev, whole(r)]);
        } else setRanges([whole(r)]);
        draggingRef.current = false;
        scrollRef.current?.focus();
    };

    const selectAll = () => {
        if (R && C) setRanges([{ ar: 0, ac: 0, er: R - 1, ec: C - 1 }]);
        scrollRef.current?.focus();
    };

    // ---- copy / paste ---------------------------------------------------------------------
    const copySelection = useCallback(async () => {
        if (!last) return;
        const n = norm(last);
        const lines: string[] = [];
        for (let r = n.r1; r <= n.r2; r++) {
            const cells: string[] = [];
            for (let c = n.c1; c <= n.c2; c++) {
                const rr = rows[r];
                const cc = columns[c];
                const v = rr && cc ? cc.getValue(rr) : "";
                cells.push(isBlank(v) ? "" : String(v));
            }
            lines.push(cells.join("\t"));
        }
        try {
            await navigator.clipboard.writeText(lines.join("\n"));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            // clipboard blocked — nothing sensible to fall back to
        }
    }, [last, rows, columns]);

    const handlePaste = (e: ClipboardEvent) => {
        if (editingRef.current || !active || !onEdit) return;
        const text = e.clipboardData.getData("text/plain");
        if (!text) return;
        e.preventDefault();
        const grid = text
            .replace(/\r/g, "")
            .replace(/\n$/, "")
            .split("\n")
            .map((l) => l.split("\t"));
        const edits: CellEdit<R>[] = [];
        const single = grid.length === 1 && grid[0]?.length === 1 ? grid[0][0] : undefined;
        if (single !== undefined && selection.cells.length > 1) {
            // one value → fill every selected editable cell
            for (const { row, col } of selection.cells) {
                if (isEditable(col, row)) edits.push({ row, colId: col.id, text: single });
            }
        } else {
            grid.forEach((line, i) =>
                line.forEach((cell, j) => {
                    const row = rows[active.r + i];
                    const col = columns[active.c + j];
                    if (row && col && isEditable(col, row)) edits.push({ row, colId: col.id, text: cell });
                }),
            );
        }
        if (edits.length) onEdit(edits);
    };

    // ---- keyboard -------------------------------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent) => {
        if (editingRef.current || !R || !C) return;
        const mod = e.ctrlKey || e.metaKey;
        const key = e.key;

        if (mod && key.toLowerCase() === "a") {
            e.preventDefault();
            selectAll();
            return;
        }
        if (mod && key.toLowerCase() === "c") {
            e.preventDefault();
            void copySelection();
            return;
        }
        if (mod && key.toLowerCase() === "v") return; // let the paste event fire

        const arrows: Record<string, [number, number]> = {
            ArrowUp: [-1, 0],
            ArrowDown: [1, 0],
            ArrowLeft: [0, -1],
            ArrowRight: [0, 1],
        };
        if (arrows[key]) {
            e.preventDefault();
            let [dr, dc] = arrows[key];
            if (mod) {
                dr *= R;
                dc *= C;
            }
            if (e.shiftKey && last) {
                setRanges((prev) => {
                    const g = lastRange(prev);
                    const er = clamp(g.er + dr, 0, R - 1);
                    const ec = clamp(g.ec + dc, 0, C - 1);
                    queueMicrotask(() => scrollToCell(er, ec));
                    return [...prev.slice(0, -1), { ...g, er, ec }];
                });
            } else if (!last) {
                setRanges([{ ar: 0, ac: 0, er: 0, ec: 0 }]);
            } else moveActive(dr, dc);
            return;
        }
        if (key === "Tab") {
            e.preventDefault();
            if (!last) setRanges([{ ar: 0, ac: 0, er: 0, ec: 0 }]);
            else moveActive(0, e.shiftKey ? -1 : 1);
            return;
        }
        if (key === "Home" || key === "End") {
            e.preventDefault();
            if (!active) return;
            const c = key === "Home" ? 0 : C - 1;
            setRanges([{ ar: active.r, ac: c, er: active.r, ec: c }]);
            queueMicrotask(() => scrollToCell(active.r, c));
            return;
        }
        if (key === "Escape") {
            if (active) setRanges([{ ar: active.r, ac: active.c, er: active.r, ec: active.c }]);
            return;
        }
        if (!active) return;

        if (key === "Enter" || key === "F2") {
            e.preventDefault();
            const col = columns[active.c];
            const activeRow = rows[active.r];
            if (activeRow && col && isEditable(col, activeRow)) startEdit(active.r, active.c);
            else if (key === "Enter") moveActive(1, 0);
            return;
        }
        if (key === "Delete" || key === "Backspace") {
            e.preventDefault();
            const edits = selection.cells
                .filter(({ row, col }) => isEditable(col, row) && !isBlank(col.getValue(row)))
                .map(({ row, col }) => ({ row, colId: col.id, text: "" }));
            if (edits.length) onEdit?.(edits);
            return;
        }
        if (key.length === 1 && !mod && !e.altKey) {
            const col = columns[active.c];
            const row = rows[active.r];
            if (!col || !row || !isEditable(col, row)) return;
            e.preventDefault();
            if (col.instantKeys) {
                const edits = selection.cells
                    .filter(({ row: rr, col: cc }) => cc.instantKeys && isEditable(cc, rr))
                    .map(({ row: rr, col: cc }) => ({ row: rr, colId: cc.id, text: key }));
                if (edits.length) onEdit?.(edits);
            } else startEdit(active.r, active.c, key);
        }
    };

    // ---- status bar bits ------------------------------------------------------------------
    const selectionLabel = (() => {
        if (!selection.cells.length) return null;
        if (selection.cells.length === 1) {
            const only = selection.cells[0];
            return only ? `${only.col.label ?? only.col.id} · row ${only.r + 1}` : null;
        }
        if (ranges.length === 1) {
            const n = norm(lastRange(ranges));
            const rowsN = n.r2 - n.r1 + 1;
            const colsN = n.c2 - n.c1 + 1;
            const firstCol = columns[n.c1];
            if (colsN === 1 && firstCol) return `${firstCol.label ?? firstCol.id} · ${rowsN} rows`;
            if (rowsN === 1) return `Row ${n.r1 + 1} · ${colsN} columns`;
            return `${rowsN} rows × ${colsN} columns`;
        }
        return `${selection.cells.length} cells in ${ranges.length} selections`;
    })();

    const colTouched = (c: number) =>
        ranges.some((g) => {
            const n = norm(g);
            return c >= n.c1 && c <= n.c2;
        });
    const rowTouched = (r: number) =>
        ranges.some((g) => {
            const n = norm(g);
            return r >= n.r1 && r <= n.r2;
        });

    const stickyBase = "sticky";

    return (
        <div className={cn("overflow-hidden rounded-2xl border bg-card shadow-sm", className)}>
            {/* Excel-style selection bar: always visible above the grid */}
            <div className="flex flex-col gap-2 min-h-12 border-b bg-muted/40 px-3 py-2 text-xs md:flex-row md:items-center md:justify-between">
                <div className="scrollbar-none flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap">
                    {selectionLabel ? (
                        <>
                            <span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary">
                                {selectionLabel}
                            </span>
                            {selection.cells.length > 0 && (
                                <>
                                    <Stat label="Count" value={String(selection.count)} />
                                    {selection.numCount > 0 && (
                                        <>
                                            <Stat label="Sum" value={formatStat(selection.sum)} strong />
                                            <Stat label="Average" value={formatStat(selection.avg)} strong />
                                            <Stat label="Min" value={formatStat(selection.min)} />
                                            <Stat label="Max" value={formatStat(selection.max)} />
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground">
                            <span className="hidden md:inline">
                                Click a cell · drag or Shift-click to select a range · Ctrl-click for several · click a
                                header to select a whole column or row
                            </span>
                            <span className="md:hidden">Tap cells or headers to select — totals appear here</span>
                        </span>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {actions?.({ cells: selection.cells })}
                    {selection.cells.length > 0 && (
                        <button
                            type="button"
                            onClick={() => void copySelection()}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-2.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    )}
                </div>
            </div>
            <div
                ref={scrollRef}
                tabIndex={0}
                role="grid"
                aria-rowcount={R}
                aria-colcount={C}
                aria-label="Spreadsheet"
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className={cn("scrollbar-thin relative overflow-auto outline-none", heightClass)}
            >
                <table
                    className="border-separate border-spacing-0 text-[13px] select-none"
                    style={{ width: "100%", minWidth: tableWidth, tableLayout: "fixed" }}
                >
                    <colgroup>
                        <col style={{ width: GUTTER }} />
                        {columns.map((col) => (
                            <col key={col.id} style={col.grow ? undefined : { width: col.width }} />
                        ))}
                        {/* Takes whatever width is left, so the sheet always reaches the right edge. */}
                        {!hasGrow && <col />}
                    </colgroup>

                    <thead>
                        <tr>
                            <th
                                onMouseDown={selectAll}
                                title="Select all"
                                className="sticky top-0 left-0 z-40 cursor-pointer border-r border-b bg-muted"
                                style={{ height: HEAD_H }}
                            >
                                <span className="mx-auto block size-3 rounded-[3px] border-2 border-muted-foreground/40" />
                            </th>
                            {columns.map((col, c) => (
                                <th
                                    key={col.id}
                                    onMouseDown={(e) => handleColumnHeader(c, e)}
                                    style={{ height: HEAD_H, left: stickyLeft[c], right: stickyRight[c] }}
                                    className={cn(
                                        "sticky top-0 cursor-pointer border-r border-b px-2 text-xs font-semibold tracking-tight transition-colors",
                                        col.sticky || col.stickyRight ? "z-30" : "z-20",
                                        colTouched(c)
                                            ? "bg-accent text-accent-foreground shadow-[inset_0_-2px_0_var(--primary)]"
                                            : "bg-muted text-muted-foreground",
                                        col.align === "right"
                                            ? "text-right"
                                            : col.align === "center"
                                              ? "text-center"
                                              : "text-left",
                                    )}
                                >
                                    <div className="truncate leading-tight">{col.header}</div>
                                    {col.subHeader && (
                                        <div className="truncate text-[10px] font-medium opacity-70">
                                            {col.subHeader}
                                        </div>
                                    )}
                                    <div
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label={`Resize ${col.label ?? col.id} column`}
                                        title="Drag to resize · double-click to reset"
                                        onPointerDown={dragResize(col, Boolean(col.stickyRight))}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={cn(
                                            "group/rs absolute top-0 z-10 h-full w-2.5 cursor-col-resize touch-none",
                                            col.stickyRight ? "left-0" : "right-0",
                                        )}
                                    >
                                        <span className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/rs:bg-primary" />
                                    </div>
                                </th>
                            ))}
                            {!hasGrow && (
                                <th className="sticky top-0 z-20 border-b bg-muted" style={{ height: HEAD_H }} />
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row, r) => (
                            <tr key={getRowId(row)}>
                                <th
                                    onMouseDown={(e) => handleRowHeader(r, e)}
                                    className={cn(
                                        stickyBase,
                                        "left-0 z-10 h-11 cursor-pointer border-r border-b text-center text-[11px] font-medium tabular-nums md:h-10",
                                        rowTouched(r)
                                            ? "bg-accent text-accent-foreground shadow-[inset_-2px_0_0_var(--primary)]"
                                            : "bg-muted text-muted-foreground",
                                    )}
                                >
                                    {rowLabel ? rowLabel(row, r) : r + 1}
                                </th>
                                {columns.map((col, c) => {
                                    const selected = inSelection(r, c);
                                    const isActive = active?.r === r && active?.c === c;
                                    const isEditing = editing?.r === r && editing?.c === c;
                                    const editable = isEditable(col, row);
                                    return (
                                        <td
                                            key={col.id}
                                            data-r={r}
                                            data-c={c}
                                            role="gridcell"
                                            aria-selected={selected}
                                            onMouseDown={(e) => handleCellDown(r, c, e)}
                                            onMouseEnter={() => handleCellEnter(r, c)}
                                            onMouseUp={() => handleCellUp(r, c)}
                                            onDoubleClick={() => startEdit(r, c)}
                                            style={{
                                                left: stickyLeft[c],
                                                right: stickyRight[c],
                                                scrollMarginLeft: frozenWidth,
                                                scrollMarginRight: frozenRightWidth,
                                                scrollMarginTop: HEAD_H,
                                                scrollMarginBottom: hasFooter ? FOOT_H : 0,
                                            }}
                                            className={cn(
                                                "relative h-11 overflow-hidden border-r border-b bg-card px-2 whitespace-nowrap tabular-nums md:h-10",
                                                (col.sticky || col.stickyRight) && "sticky z-10",
                                                col.align === "right"
                                                    ? "text-right"
                                                    : col.align === "center"
                                                      ? "text-center"
                                                      : "text-left",
                                                col.cellClassName?.(row),
                                                selected &&
                                                    "after:pointer-events-none after:absolute after:inset-0 after:bg-primary/10",
                                                isActive && "shadow-[inset_0_0_0_2px_var(--primary)]",
                                                editable && "cursor-cell",
                                            )}
                                        >
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    value={editing.text}
                                                    inputMode="decimal"
                                                    onFocus={(e) => {
                                                        // Caret at the end (like Excel's F2), so the key that opened the editor isn't overwritten.
                                                        const end = e.currentTarget.value.length;
                                                        e.currentTarget.setSelectionRange(end, end);
                                                    }}
                                                    onChange={(e) => setEdit({ ...editing, text: e.target.value })}
                                                    onBlur={() => commitEdit()}
                                                    onKeyDown={(e) => {
                                                        e.stopPropagation();
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            commitEdit({ dr: 1, dc: 0 });
                                                        } else if (e.key === "Tab") {
                                                            e.preventDefault();
                                                            commitEdit({ dr: 0, dc: e.shiftKey ? -1 : 1 });
                                                        } else if (e.key === "Escape") {
                                                            e.preventDefault();
                                                            cancelEdit();
                                                        }
                                                    }}
                                                    className={cn(
                                                        "absolute inset-0 z-10 w-full bg-card px-2 text-[13px] outline-none ring-2 ring-primary ring-inset",
                                                        col.align === "right" ? "text-right" : "text-left",
                                                    )}
                                                />
                                            ) : col.render ? (
                                                col.render(row)
                                            ) : (
                                                <span className="block truncate leading-[inherit]">
                                                    {isBlank(col.getValue(row)) ? "" : String(col.getValue(row))}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                                {!hasGrow && <td className="h-11 border-b bg-card md:h-10" />}
                            </tr>
                        ))}
                        {!R && (
                            <tr>
                                <td
                                    colSpan={C + (hasGrow ? 1 : 2)}
                                    className="p-10 text-center text-sm text-muted-foreground"
                                >
                                    {emptyMessage ?? "Nothing to show."}
                                </td>
                            </tr>
                        )}
                    </tbody>

                    {hasFooter && R > 0 && (
                        <tfoot>
                            <tr>
                                <th
                                    className="sticky bottom-0 left-0 z-30 border-t border-r bg-muted text-center text-sm font-semibold text-muted-foreground"
                                    style={{ height: FOOT_H }}
                                >
                                    Σ
                                </th>
                                {columns.map((col, c) => (
                                    <td
                                        key={col.id}
                                        style={{ left: stickyLeft[c], right: stickyRight[c], height: FOOT_H }}
                                        className={cn(
                                            "sticky bottom-0 border-t border-r bg-muted px-2 text-[13px] font-semibold tabular-nums whitespace-nowrap",
                                            col.sticky || col.stickyRight ? "z-30" : "z-20",
                                            col.align === "right"
                                                ? "text-right"
                                                : col.align === "center"
                                                  ? "text-center"
                                                  : "text-left",
                                        )}
                                    >
                                        {c === 0 && !col.footer ? footerLabel : col.footer?.(rows)}
                                    </td>
                                ))}
                                {!hasGrow && (
                                    <td className="sticky bottom-0 z-20 border-t bg-muted" style={{ height: FOOT_H }} />
                                )}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <span className="flex items-baseline gap-1.5 rounded-md px-1.5 py-1">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={cn(
                    "tabular-nums",
                    strong ? "text-sm font-bold text-foreground" : "font-semibold text-foreground/80",
                )}
            >
                {value}
            </span>
        </span>
    );
}

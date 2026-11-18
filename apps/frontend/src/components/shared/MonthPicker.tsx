// src/components/shared/MonthPicker.tsx — jump to any month of any year in two clicks.
import { useState } from "react";
import { addMonths, format, isSameMonth, setMonth, setYear, startOfMonth } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
    value: Date;
    onChange: (month: Date) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), "MMM"));

export default function MonthPicker({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [year, setViewYear] = useState(value.getFullYear());
    const now = new Date();

    const pick = (monthIndex: number) => {
        onChange(startOfMonth(setMonth(setYear(value, year), monthIndex)));
        setOpen(false);
    };

    return (
        <div className="flex items-center rounded-xl border bg-card p-1 shadow-xs">
            <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => onChange(addMonths(value, -1))}>
                <ChevronLeft />
            </Button>

            <Popover.Root
                open={open}
                onOpenChange={(o) => {
                    setOpen(o);
                    if (o) setViewYear(value.getFullYear());
                }}
            >
                <Popover.Trigger asChild>
                    <button className="flex min-w-36 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold whitespace-nowrap tabular-nums transition-colors hover:bg-muted">
                        <CalendarDays className="size-4 text-primary" />
                        {format(value, "MMMM yyyy")}
                        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        align="start"
                        sideOffset={8}
                        className="z-50 w-72 rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <Button variant="ghost" size="icon-sm" aria-label="Previous year" onClick={() => setViewYear((y) => y - 1)}>
                                <ChevronLeft />
                            </Button>
                            <span className="font-heading text-lg font-semibold tabular-nums">{year}</span>
                            <Button variant="ghost" size="icon-sm" aria-label="Next year" onClick={() => setViewYear((y) => y + 1)}>
                                <ChevronRight />
                            </Button>
                        </div>

                        {/* Quick year jumps */}
                        <div className="mb-3 flex justify-center gap-1">
                            {[-2, -1, 0, 1, 2].map((d) => {
                                const y = now.getFullYear() + d;
                                return (
                                    <button
                                        key={y}
                                        onClick={() => setViewYear(y)}
                                        className={cn(
                                            "rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors",
                                            y === year ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                                        )}
                                    >
                                        {y}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                            {MONTHS.map((label, i) => {
                                const date = new Date(year, i, 1);
                                const selected = isSameMonth(date, value);
                                const current = isSameMonth(date, now);
                                return (
                                    <button
                                        key={label}
                                        onClick={() => pick(i)}
                                        className={cn(
                                            "rounded-lg py-2.5 text-sm font-medium transition-colors",
                                            selected
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : current
                                                  ? "bg-accent text-accent-foreground ring-1 ring-primary/40 hover:bg-accent/80"
                                                  : "hover:bg-muted",
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => {
                                onChange(startOfMonth(new Date()));
                                setOpen(false);
                            }}
                        >
                            Go to this month
                        </Button>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => onChange(addMonths(value, 1))}>
                <ChevronRight />
            </Button>
        </div>
    );
}

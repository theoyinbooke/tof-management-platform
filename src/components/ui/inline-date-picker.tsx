"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface InlineDatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  label?: string;
}

export function InlineDatePicker({
  date,
  onSelect,
  placeholder = "Select date",
  disabled,
  className,
  label,
}: InlineDatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(date || new Date());
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // Update currentMonth when date prop changes
  React.useEffect(() => {
    if (date) {
      setCurrentMonth(date);
    }
  }, [date]);

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (current year - 5 to current year + 10)
  const yearOptions = React.useMemo(() => {
    const startYear = new Date().getFullYear() - 5;
    const endYear = new Date().getFullYear() + 10;
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  }, []);

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const handleMonthSelect = (monthIndex: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(monthIndex));
    setCurrentMonth(newDate);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate);
    setIsExpanded(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Collapsed State - Shows selected date or placeholder */}
      {!isExpanded && (
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          onClick={() => setIsExpanded(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      )}

      {/* Expanded State - Shows inline calendar */}
      {isExpanded && (
        <Card className="p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg w-full max-w-sm">
          <div className="space-y-3">
            {/* Header with month/year selectors */}
            <div className="flex items-center justify-between px-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={(e) => {
                  e.preventDefault();
                  handleMonthChange(-1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                <Select
                  value={currentMonthIndex.toString()}
                  onValueChange={handleMonthSelect}
                >
                  <SelectTrigger className="h-7 border-0 focus:ring-0 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={currentYear.toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="h-7 w-[70px] border-0 focus:ring-0 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={(e) => {
                  e.preventDefault();
                  handleMonthChange(1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar */}
            <div className="px-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={disabled}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="p-0 w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-3",
                  caption: "hidden",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-1",
                  cell: "text-center text-sm p-0 relative h-8 w-8 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-8 w-8 p-0 font-normal inline-flex items-center justify-center rounded-md",
                    "aria-selected:opacity-100",
                    "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
                  ),
                  day_selected: "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus:bg-emerald-600 focus:text-white",
                  day_today: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 font-semibold",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-between gap-2 pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    const today = new Date();
                    setCurrentMonth(today);
                    handleDateSelect(today);
                  }}
                  className="text-xs"
                >
                  Today
                </Button>
                {date && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDateSelect(undefined);
                    }}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setIsExpanded(false);
                }}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
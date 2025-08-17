"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Repeat, Calendar, X } from "lucide-react";
import { format } from "date-fns";

interface RecurrenceConfig {
  pattern: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  weekDays?: number[]; // 0-6 for Sunday-Saturday
  endType: "never" | "date" | "occurrences";
  endDate?: Date;
  occurrences?: number;
}

interface RecurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date;
  recurrence?: RecurrenceConfig;
  onSave: (recurrence: RecurrenceConfig | null) => void;
}

export function RecurrenceDialog({
  open,
  onOpenChange,
  startDate,
  recurrence,
  onSave,
}: RecurrenceDialogProps) {
  const [config, setConfig] = useState<RecurrenceConfig>(
    recurrence || {
      pattern: "weekly",
      interval: 1,
      weekDays: [startDate.getDay()],
      endType: "never",
    }
  );

  const weekDays = [
    { value: 0, label: "S", fullLabel: "Sunday" },
    { value: 1, label: "M", fullLabel: "Monday" },
    { value: 2, label: "T", fullLabel: "Tuesday" },
    { value: 3, label: "W", fullLabel: "Wednesday" },
    { value: 4, label: "T", fullLabel: "Thursday" },
    { value: 5, label: "F", fullLabel: "Friday" },
    { value: 6, label: "S", fullLabel: "Saturday" },
  ];

  const toggleWeekDay = (day: number) => {
    const currentDays = config.weekDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    // Don't allow empty selection
    if (newDays.length === 0) return;
    
    setConfig({ ...config, weekDays: newDays });
  };

  const getRecurrenceText = () => {
    let text = `Repeat every ${config.interval} `;
    
    switch (config.pattern) {
      case "daily":
        text += config.interval === 1 ? "day" : "days";
        break;
      case "weekly":
        text += config.interval === 1 ? "week" : "weeks";
        if (config.weekDays && config.weekDays.length > 0) {
          const days = config.weekDays
            .sort()
            .map(d => weekDays[d].fullLabel)
            .join(", ");
          text += ` on ${days}`;
        }
        break;
      case "monthly":
        text += config.interval === 1 ? "month" : "months";
        text += ` on day ${startDate.getDate()}`;
        break;
      case "yearly":
        text += config.interval === 1 ? "year" : "years";
        break;
    }

    if (config.endType === "date" && config.endDate) {
      text += ` until ${format(config.endDate, "MMM dd, yyyy")}`;
    } else if (config.endType === "occurrences" && config.occurrences) {
      text += `, ${config.occurrences} times`;
    }

    return text;
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  const handleRemove = () => {
    onSave(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Repeat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Start Date Display */}
          <div className="flex items-center gap-2 text-sm">
            <Label>Start</Label>
            <div className="flex-1 p-2 border rounded-md bg-gray-50">
              {format(startDate, "MM/dd/yyyy")}
            </div>
            <Calendar className="h-4 w-4 text-gray-500" />
          </div>

          {/* Repeat Pattern */}
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-gray-500" />
            <Label className="w-24">Repeat every</Label>
            <Input
              type="number"
              min="1"
              value={config.interval}
              onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) || 1 })}
              className="w-20"
            />
            <Select
              value={config.pattern}
              onValueChange={(value: any) => setConfig({ ...config, pattern: value })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">day(s)</SelectItem>
                <SelectItem value="weekly">week(s)</SelectItem>
                <SelectItem value="monthly">month(s)</SelectItem>
                <SelectItem value="yearly">year(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Week Days Selection (for weekly pattern) */}
          {config.pattern === "weekly" && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex gap-1">
                {weekDays.map((day) => (
                  <Button
                    key={day.value}
                    variant={config.weekDays?.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    className={`w-10 h-10 p-0 ${
                      config.weekDays?.includes(day.value)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }`}
                    onClick={() => toggleWeekDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* End Type */}
          <div className="space-y-3">
            <Label>Ends</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.endType === "never"}
                  onChange={() => setConfig({ ...config, endType: "never" })}
                  className="text-emerald-600"
                />
                <span className="text-sm">Never</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.endType === "date"}
                  onChange={() => setConfig({ ...config, endType: "date" })}
                  className="text-emerald-600"
                />
                <span className="text-sm">On</span>
                {config.endType === "date" && (
                  <DatePicker
                    date={config.endDate}
                    onSelect={(date) => setConfig({ ...config, endDate: date })}
                    className="ml-2"
                  />
                )}
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.endType === "occurrences"}
                  onChange={() => setConfig({ ...config, endType: "occurrences" })}
                  className="text-emerald-600"
                />
                <span className="text-sm">After</span>
                {config.endType === "occurrences" && (
                  <>
                    <Input
                      type="number"
                      min="1"
                      value={config.occurrences || 1}
                      onChange={(e) => setConfig({ ...config, occurrences: parseInt(e.target.value) || 1 })}
                      className="w-20 ml-2"
                    />
                    <span className="text-sm">occurrences</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            {getRecurrenceText()}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleRemove}>
            Remove
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Discard
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
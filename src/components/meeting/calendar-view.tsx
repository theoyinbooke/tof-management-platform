"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  getHours,
  getMinutes,
  startOfDay,
  setHours,
  setMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Video } from "lucide-react";

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  scheduledStartTime: number;
  scheduledEndTime: number;
  location?: string;
  type: string;
  status: string;
  host?: {
    firstName: string;
    lastName: string;
  };
}

interface CalendarViewProps {
  meetings: Meeting[];
  onMeetingClick?: (meeting: Meeting) => void;
  onBackToGrid?: () => void;
}

export function CalendarView({ meetings, onMeetingClick, onBackToGrid }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"week" | "month">("week");

  // Navigation functions
  const handlePrevious = () => {
    if (viewType === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewType === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get date range based on view type
  const dateRange = useMemo(() => {
    if (viewType === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  }, [currentDate, viewType]);

  // Get all days in the current view
  const daysInView = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Filter meetings for current view
  const meetingsInView = useMemo(() => {
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.scheduledStartTime);
      return meetingDate >= dateRange.start && meetingDate <= dateRange.end;
    });
  }, [meetings, dateRange]);

  // Group meetings by day
  const meetingsByDay = useMemo(() => {
    const grouped: { [key: string]: Meeting[] } = {};
    meetingsInView.forEach((meeting) => {
      const dayKey = format(new Date(meeting.scheduledStartTime), "yyyy-MM-dd");
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(meeting);
    });
    return grouped;
  }, [meetingsInView]);

  // Time slots for week view (1 hour intervals)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // Format time for display
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  };

  // Get meeting position and height for week view
  const getMeetingStyle = (meeting: Meeting) => {
    const startDate = new Date(meeting.scheduledStartTime);
    const endDate = new Date(meeting.scheduledEndTime);
    
    const startHour = getHours(startDate);
    const startMinute = getMinutes(startDate);
    const endHour = getHours(endDate);
    const endMinute = getMinutes(endDate);
    
    const top = (startHour + startMinute / 60) * 60; // 60px per hour
    const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`, // Minimum height of 30px
    };
  };

  // Render week view
  const renderWeekView = () => {
    const weekDays = daysInView.slice(0, 7);
    
    return (
      <div className="overflow-auto">
        <div className="min-w-[800px]">
          {/* Header with day names */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-sm font-medium text-gray-500"></div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 text-center border-l",
                  isToday(day) && "bg-emerald-50"
                )}
              >
                <div className="text-sm font-medium text-gray-500">
                  {format(day, "EEE")}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  isToday(day) && "text-emerald-600"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative">
            {timeSlots.map((hour) => (
              <div key={hour} className="grid grid-cols-8 h-[60px] border-b">
                <div className="p-2 text-xs text-gray-500 text-right">
                  {formatTime(hour)}
                </div>
                {weekDays.map((day) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "border-l relative",
                      isToday(day) && "bg-emerald-50/30"
                    )}
                  >
                    {/* Meetings will be positioned absolutely within these cells */}
                  </div>
                ))}
              </div>
            ))}

            {/* Overlay meetings */}
            {weekDays.map((day, dayIndex) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayMeetings = meetingsByDay[dayKey] || [];
              
              return dayMeetings.map((meeting) => {
                const style = getMeetingStyle(meeting);
                const leftPosition = `calc(${(100 / 8) * (dayIndex + 1)}% + 1px)`;
                const width = `calc(${100 / 8}% - 2px)`;
                
                return (
                  <div
                    key={meeting._id}
                    className="absolute bg-emerald-600 text-white rounded p-1 overflow-hidden cursor-pointer hover:bg-emerald-700 transition-colors"
                    style={{
                      ...style,
                      left: leftPosition,
                      width: width,
                      zIndex: 10,
                    }}
                    onClick={() => onMeetingClick?.(meeting)}
                  >
                    <div className="text-xs font-medium truncate">
                      {format(new Date(meeting.scheduledStartTime), "h:mm a")}
                    </div>
                    <div className="text-xs font-semibold truncate">
                      {meeting.title}
                    </div>
                    {parseInt(style.height) > 40 && meeting.location && (
                      <div className="text-xs opacity-90 truncate">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {meeting.location}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
    const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {allDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayMeetings = meetingsByDay[dayKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-white p-2 min-h-[100px] relative",
                !isCurrentMonth && "bg-gray-50",
                isToday(day) && "bg-emerald-50"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                !isCurrentMonth && "text-gray-400",
                isToday(day) && "text-emerald-600"
              )}>
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayMeetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting._id}
                    className="text-xs p-1 bg-emerald-100 text-emerald-700 rounded cursor-pointer hover:bg-emerald-200 transition-colors"
                    onClick={() => onMeetingClick?.(meeting)}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">
                        {format(new Date(meeting.scheduledStartTime), "h:mm a")}
                      </span>
                    </div>
                    <div className="truncate font-semibold">{meeting.title}</div>
                  </div>
                ))}
                {dayMeetings.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayMeetings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBackToGrid}>
            Back to grid
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {viewType === "week"
              ? `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")}
          </h2>
        </div>

        <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar view */}
      <Card>
        <CardContent className="p-0">
          {viewType === "week" ? renderWeekView() : renderMonthView()}
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SlotData {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isOwnBooking: boolean;
  bookedByName: string | null;
  bookedByImage: string | null;
  notes: string | null;
}

interface SlotCellProps {
  slot: SlotData;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  accentColorClass: string;
}

function convertUtcTimeToLocal(utcTime: string) {
  const [hours, minutes] = utcTime.split(':');
  const d = new Date();
  d.setUTCHours(parseInt(hours, 10));
  d.setUTCMinutes(parseInt(minutes, 10));
  
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SlotCell({ slot, isSelected, onSelect, accentColorClass }: SlotCellProps) {
  const isAvailable = !slot.isBooked;

  return (
    <div
      onClick={(e) => onSelect(slot.id, e.shiftKey)}
      className={cn(
        "flex items-center p-3 border-b cursor-pointer transition-colors min-h-[44px]",
        isAvailable ? "hover:bg-muted/50" : "opacity-80 cursor-not-allowed",
        isSelected && isAvailable && `bg-${accentColorClass}/10 border-l-4 border-l-${accentColorClass}`,
        slot.isOwnBooking && `bg-${accentColorClass}/5 border-l-4 border-l-${accentColorClass}`
      )}
    >
      <div className="w-24 font-medium text-sm tabular-nums shrink-0">
        {convertUtcTimeToLocal(slot.startTime)}
      </div>
      
      <div className="flex-1 flex items-center justify-between ml-4">
        {isAvailable ? (
          <Badge variant="outline" className="text-muted-foreground">Available</Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={slot.isOwnBooking ? "default" : "secondary"} className={cn(slot.isOwnBooking && `bg-${accentColorClass}`)}>
              {slot.isOwnBooking ? "My Booking" : "Booked"}
            </Badge>
            
            {slot.bookedByName && (
              <div className="flex items-center gap-2 ml-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={slot.bookedByImage || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {slot.bookedByName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{slot.bookedByName}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

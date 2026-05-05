"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function BookingForm({ eventId, maxTickets }: { eventId: string; maxTickets: number }) {
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const booking = await api.bookings.create({
        eventId,
        userEmail: email,
        quantity,
      });

      toast.success("Reservation successful! You have 10 minutes to confirm.");
      router.push(`/bookings/${booking.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create reservation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleBooking} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity (Max {Math.min(maxTickets, 10)})</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={Math.min(maxTickets, 10)}
          required
          value={quantity || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              setQuantity(0);
              return;
            }
            const parsed = parseInt(val, 10);
            if (!isNaN(parsed)) {
              setQuantity(parsed);
            }
          }}
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading || maxTickets === 0}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Reserving...
          </>
        ) : (
          "Reserve Tickets"
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Tickets will be held for 10 minutes while you complete your purchase.
      </p>
    </form>
  );
}

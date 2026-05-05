"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchBooking = async () => {
      try {
        const data = await api.bookings.get(id);
        setBooking(data);
      } catch (error) {
        toast.error("Failed to fetch booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  useEffect(() => {
    if (!booking || booking.status !== "pending" || !booking.expiresAt) return;

    const interval = setInterval(() => {
      const expiry = new Date(booking.expiresAt);
      if (expiry < new Date()) {
        setTimeLeft("Expired");
        setBooking({ ...booking, status: "expired" });
        clearInterval(interval);
      } else {
        setTimeLeft(formatDistanceToNow(expiry, { addSuffix: true }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const handleConfirm = async () => {
    if (!id) return;
    setConfirming(true);
    try {
      await api.bookings.confirm(id);
      setBooking({ ...booking, status: "confirmed" });
      toast.success("Booking confirmed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm booking");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Booking not found</h2>
        <Button className="mt-4" asChild>
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className={booking.status === "confirmed" ? "border-emerald-500/50 bg-emerald-500/5" : ""}>
        <CardHeader className="text-center">
          {booking.status === "confirmed" ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          ) : booking.status === "pending" ? (
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          ) : (
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
          )}
          <CardTitle className="text-2xl">
            {booking.status === "confirmed" ? "Booking Confirmed!" : 
             booking.status === "pending" ? "Complete Your Booking" : 
             "Booking Expired"}
          </CardTitle>
          <CardDescription>
            {booking.status === "confirmed" ? `Successfully booked for ${booking.eventName}` :
             booking.status === "pending" ? `Your tickets for ${booking.eventName} are on hold.` :
             "The reservation time has lapsed and the tickets have been released."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 py-4 border-y">
            <div>
              <p className="text-sm text-muted-foreground">Event</p>
              <p className="font-semibold">{booking.eventName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-semibold">{booking.quantity} tickets</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price per Ticket</p>
              <p className="font-semibold">{formatPrice(booking.pricePaid)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-lg text-primary">{formatPrice(booking.totalAmount)}</p>
            </div>
          </div>

          {booking.status === "pending" && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-1">Reservation Expires In</p>
              <p className="text-2xl font-mono font-bold text-amber-500">{timeLeft || "Calculating..."}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {booking.status === "pending" ? (
            <Button className="w-full size-lg" onClick={handleConfirm} disabled={confirming}>
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm & Pay Now"
              )}
            </Button>
          ) : (
            <Button className="w-full" variant="outline" asChild>
              <Link href="/events">Explore More Events</Link>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            A confirmation email will be sent to {booking.userEmail}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

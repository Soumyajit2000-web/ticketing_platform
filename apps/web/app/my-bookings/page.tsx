"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Ticket } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.bookings.listByEmail(email);
      setBookings(data);
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">Manage your event reservations and tickets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find your bookings</CardTitle>
          <CardDescription>Enter the email address you used to book tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-grow">
              <Input 
                type="email" 
                placeholder="your@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-20 border rounded-xl bg-card/50">
              <p className="text-muted-foreground">No bookings found for this email.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="p-6 flex-grow space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg">{booking.eventName}</h3>
                          <p className="text-sm text-muted-foreground">{format(new Date(booking.eventDate), "PPP p")}</p>
                        </div>
                        <Badge variant={
                          booking.status === "confirmed" ? "success" : 
                          booking.status === "pending" ? "warning" : 
                          "destructive"
                        }>
                          {booking.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantity:</span> {booking.quantity}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Paid:</span> {formatPrice(booking.totalAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-6 flex items-center justify-center border-t sm:border-t-0 sm:border-l shrink-0">
                      <Button variant="outline" asChild size="sm">
                        <Link href={`/bookings/${booking.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

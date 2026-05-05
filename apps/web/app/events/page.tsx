import { api } from "@/lib/api";
export const dynamic = "force-dynamic";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";

export default async function EventsPage() {
  let events = [];
  try {
    events = await api.events.list();
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Available Events</h1>
        <p className="text-muted-foreground">Discover live events with real-time dynamic pricing.</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-card/50">
          <p className="text-muted-foreground">No events found. Make sure the API is running and seeded.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/events">Retry</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => {
            const isLowStock = event.remainingTickets > 0 && event.remainingTickets < 50;
            const isSoldOut = event.remainingTickets <= 0;

            return (
              <Card key={event.id} className="overflow-hidden flex flex-col group hover:border-primary/50 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isSoldOut ? "destructive" : isLowStock ? "warning" : "secondary"}>
                      {isSoldOut ? "Sold Out" : isLowStock ? "Low Stock" : "Available"}
                    </Badge>
                    <span className="text-2xl font-bold">{formatPrice(event.currentPrice)}</span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {event.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground flex-grow">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(event.date), "PPP p")}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    {event.remainingTickets} tickets left
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/50">
                  <Button className="w-full" asChild disabled={isSoldOut}>
                    <Link href={`/events/${event.id}`}>
                      {isSoldOut ? "Sold Out" : "Book Tickets"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

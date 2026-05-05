import { api } from "@/lib/api";
export const dynamic = "force-dynamic";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Ticket, Info, TrendingUp, Clock, Archive } from "lucide-react";
import { format } from "date-fns";
import { BookingForm } from "@/components/booking-form";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let event: any;
  
  try {
    event = await api.events.get(id);
  } catch (error) {
    return <div>Event not found</div>;
  }

  const { pricing } = event;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Info */}
        <div className="flex-grow space-y-6">
          <div className="space-y-4">
            <Badge variant="secondary">Upcoming Event</Badge>
            <h1 className="text-4xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-xl text-muted-foreground">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-semibold">{format(new Date(event.date), "PPP p")}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{event.venue}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Price Breakdown
              </CardTitle>
              <CardDescription>How the current price is calculated based on demand and availability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Archive className="w-4 h-4" /> Base Price
                </span>
                <span className="font-medium">{formatPrice(event.basePrice)}</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Dynamic Adjustments (Weighted)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AdjustmentItem 
                    icon={<Clock className="w-4 h-4" />}
                    label="Time" 
                    value={pricing.breakdown.timeAdjustment} 
                    weight={pricing.weights.time}
                  />
                  <AdjustmentItem 
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Demand" 
                    value={pricing.breakdown.demandAdjustment} 
                    weight={pricing.weights.demand}
                  />
                  <AdjustmentItem 
                    icon={<Ticket className="w-4 h-4" />}
                    label="Inventory" 
                    value={pricing.breakdown.inventoryAdjustment} 
                    weight={pricing.weights.inventory}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t text-lg font-bold">
                <span>Final Current Price</span>
                <span className="text-primary">{formatPrice(event.currentPrice)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Booking Form */}
        <div className="w-full md:w-80 shrink-0">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Book Tickets</CardTitle>
              <CardDescription>
                {event.remainingTickets} tickets available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingForm eventId={event.id} maxTickets={event.remainingTickets} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdjustmentItem({ icon, label, value, weight }: { icon: any; label: string; value: number; weight: number }) {
  const percentage = (value * 100).toFixed(0);
  const contribution = (value * weight * 100).toFixed(1);
  
  return (
    <div className="p-3 rounded-lg bg-muted/50 border flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="text-lg font-bold">+{percentage}%</div>
      <div className="text-[10px] text-muted-foreground">
        Contrib: +{contribution}% (w: {weight})
      </div>
    </div>
  );
}

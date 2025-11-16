// components/beer-card-skeleton.tsx
import { Card, CardContent } from "@/components/ui/card"

export function BeerCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden border-2 border-border/50 bg-card/50 animate-pulse">
      <div className="aspect-[4/5] bg-muted" />
      <CardContent className="p-3 sm:p-4">
        <div className="h-5 bg-muted rounded mb-2" />
        <div className="h-4 bg-muted rounded mb-3" />
        <div className="h-20 bg-muted rounded mb-3" />
        <div className="h-10 bg-muted rounded" />
      </CardContent>
    </Card>
  )
}
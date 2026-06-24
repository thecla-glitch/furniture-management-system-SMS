"use client"

import { useMemo, useState } from "react"
import { MapPin, Package, Store } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ShowroomSetStatus } from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { SellSetDialog } from "@/components/shop/sell-set-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Filter = "Available" | "Sold" | "All"

const FILTERS: Filter[] = ["Available", "Sold", "All"]

const STATUS_STYLES: Record<ShowroomSetStatus, string> = {
  Available: "bg-primary/10 text-primary border-primary/20",
  Reserved: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Sold: "bg-muted text-muted-foreground border-border",
  Broken: "bg-destructive/10 text-destructive border-destructive/20",
  Transferred: "bg-secondary text-secondary-foreground border-border",
}

export function ShowroomInventoryScreen() {
  const { activeBranch } = useBranch()
  const { sets } = useShowroom()
  const [filter, setFilter] = useState<Filter>("Available")

  // Front Desk only ever sees its own branch's stock.
  const branchSets = useMemo(
    () => sets.filter((s) => s.branchId === activeBranch.id),
    [sets, activeBranch.id]
  )

  const visibleSets = useMemo(() => {
    if (filter === "All") return branchSets
    return branchSets.filter((s) => s.status === filter)
  }, [branchSets, filter])

  const availableCount = branchSets.filter(
    (s) => s.status === "Available"
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Store className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Showroom inventory
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Ready-made sets available to sell off the floor.{" "}
              {availableCount} available now.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5 self-start">
          <MapPin className="size-3.5" />
          Branch {activeBranch.code} — {activeBranch.name}
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {visibleSets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              No {filter === "All" ? "" : filter.toLowerCase()} sets at{" "}
              {activeBranch.name}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSets.map((set) => {
            const sellable = set.status === "Available"
            return (
              <Card
                key={set.id}
                className={cn("flex flex-col", !sellable && "opacity-75")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {set.id}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("border", STATUS_STYLES[set.status])}
                    >
                      {set.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base text-balance">
                    {set.name}
                  </CardTitle>
                  <CardDescription className="text-pretty">
                    {set.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold tabular-nums">
                      ${set.fullSetPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {set.components.length} piece
                      {set.components.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {set.historyNote && (
                    <p className="text-xs text-muted-foreground">
                      {set.historyNote}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  {sellable ? (
                    <SellSetDialog set={set} />
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Not available
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

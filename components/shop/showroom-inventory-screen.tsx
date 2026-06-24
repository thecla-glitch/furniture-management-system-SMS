"use client"

import { useMemo, useState } from "react"
import { CalendarClock, MapPin, Package, Store } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  getShowroomSetById,
  type PartialSaleStatus,
  type ShowroomSetStatus,
} from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { SellSetDialog } from "@/components/shop/sell-set-dialog"
import { SellPartDialog } from "@/components/shop/sell-part-dialog"
import { ReserveSetDialog } from "@/components/shop/reserve-set-dialog"
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

type Filter = "Available" | "Reserved" | "Sold" | "All"

const FILTERS: Filter[] = ["Available", "Reserved", "Sold", "All"]

const STATUS_STYLES: Record<ShowroomSetStatus, string> = {
  Available: "bg-primary/10 text-primary border-primary/20",
  Reserved: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Sold: "bg-muted text-muted-foreground border-border",
  Broken: "bg-destructive/10 text-destructive border-destructive/20",
  Transferred: "bg-secondary text-secondary-foreground border-border",
}

const PARTIAL_STATUS_STYLES: Record<PartialSaleStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Approved: "bg-primary/10 text-primary border-primary/20",
  Declined: "bg-destructive/10 text-destructive border-destructive/20",
}

export function ShowroomInventoryScreen() {
  const { activeBranch } = useBranch()
  const { sets, partialRequests, reservations, releaseReservation } =
    useShowroom()
  const [filter, setFilter] = useState<Filter>("Available")

  // Active reservations indexed by set, so a Reserved card can show its hold.
  const activeReservationBySet = useMemo(() => {
    const map = new Map<string, (typeof reservations)[number]>()
    for (const r of reservations) {
      if (r.status === "Active") map.set(r.setId, r)
    }
    return map
  }, [reservations])

  function handleRelease(reservationId: string, setName: string) {
    releaseReservation(reservationId)
    toast.info("Reservation released", {
      description: `${setName} is available to sell again.`,
    })
  }

  // This branch's partial-sale requests, newest first, so staff can see the
  // Director's decision without an Approve/Break control of their own.
  const branchRequests = useMemo(
    () => partialRequests.filter((r) => r.branchId === activeBranch.id),
    [partialRequests, activeBranch.id]
  )

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

      {branchRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Partial-sale requests
            </CardTitle>
            <CardDescription>
              Director decisions on this branch&apos;s break-set requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {branchRequests.map((req) => {
              const reqSet = getShowroomSetById(req.setId)
              return (
                <div
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {req.customerName} ·{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        {req.setId}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {req.componentIds.length} component
                      {req.componentIds.length === 1 ? "" : "s"}
                      {reqSet ? ` · ${reqSet.name}` : ""}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("border", PARTIAL_STATUS_STYLES[req.status])}
                  >
                    {req.status}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

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
            const reservation = activeReservationBySet.get(set.id)
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
                  {reservation && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs">
                      <p className="flex items-center gap-1.5 font-medium text-amber-600">
                        <CalendarClock className="size-3.5" />
                        Reserved for {reservation.customerName}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Deposit ${reservation.depositPaid.toLocaleString()} ·{" "}
                        {reservation.contact}
                        {reservation.expiresAt
                          ? ` · expires ${reservation.expiresAt}`
                          : ""}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-wrap gap-2">
                  {sellable ? (
                    <>
                      <SellSetDialog set={set} />
                      {set.components.filter(
                        (c) => c.componentStatus === "Available"
                      ).length > 1 && <SellPartDialog set={set} />}
                      <ReserveSetDialog set={set} />
                    </>
                  ) : reservation ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleRelease(reservation.id, set.name)
                      }
                    >
                      Release reservation
                    </Button>
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

"use client"

import { useEffect, useMemo } from "react"
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import type { Technician } from "@/lib/mock-data"
import { useOrders } from "@/components/front-desk/orders-store"
import {
  usePaySettlement,
  type PayBatch,
} from "@/components/head-technician/pay-settlement-store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// ---------- helpers ---------------------------------------------------------

/** ISO date string → Monday of that week as ISO date string */
function mondayOf(iso: string): string {
  const d = new Date(iso)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** Monday ISO date → human label "Jun 22 – Jun 28, 2026" */
function labelFromMonday(mondayIso: string): string {
  const mon = new Date(mondayIso + "T12:00:00")
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  const f = (x: Date) =>
    x.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${f(mon)} – ${f(sun)}, ${sun.getFullYear()}`
}

function fmtSettled(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------- screen ----------------------------------------------------------

export function TechFinancialsScreen({ technician }: { technician: Technician }) {
  const { orders } = useOrders()
  const { batches, upsertBatch, settleBatch } = usePaySettlement()

  // Compute weekly batches from live order data for this technician.
  const computed = useMemo(() => {
    const byWeek = new Map<string, { count: number; weekStart: string }>()
    for (const order of orders) {
      for (const stage of order.stages) {
        if (
          stage.headTechId !== technician.id ||
          stage.status !== "Done" ||
          !stage.completedAt
        ) continue
        const mon = mondayOf(stage.completedAt)
        const existing = byWeek.get(mon)
        byWeek.set(mon, {
          weekStart: mon,
          count: (existing?.count ?? 0) + 1,
        })
      }
    }
    return [...byWeek.values()].sort((a, b) =>
      b.weekStart.localeCompare(a.weekStart)
    )
  }, [orders, technician.id])

  // Upsert computed batches into the store so the store always reflects
  // the current live totals (will not overwrite settledAt).
  useEffect(() => {
    for (const w of computed) {
      const label = labelFromMonday(w.weekStart)
      upsertBatch({
        id: `${technician.id}::${label}`,
        technicianId: technician.id,
        weekLabel: label,
        weekStart: w.weekStart,
        stagesCompleted: w.count,
        rate: technician.rate,
        total: w.count * technician.rate,
      })
    }
  }, [computed, technician.id, technician.rate, upsertBatch])

  // Only show batches for this technician, newest first.
  const myBatches = batches
    .filter((b) => b.technicianId === technician.id)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  const totalEarned = myBatches.reduce((s, b) => s + b.total, 0)
  const totalSettled = myBatches
    .filter((b) => b.settledAt)
    .reduce((s, b) => s + b.total, 0)
  const totalOwed = totalEarned - totalSettled
  const unsettledCount = myBatches.filter((b) => !b.settledAt).length

  function handleSettle(batch: PayBatch) {
    settleBatch(batch.id)
    toast.success("Payment confirmed.", {
      description: `$${batch.total.toLocaleString()} for ${batch.weekLabel} has been logged as received.`,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">Total earned</p>
            <p className="text-2xl font-semibold tabular-nums">
              ${totalEarned.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">all weeks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">Awaiting collection</p>
            <p className={cn(
              "text-2xl font-semibold tabular-nums",
              unsettledCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
            )}>
              ${totalOwed.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unsettledCount} batch{unsettledCount !== 1 ? "es" : ""} pending
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground text-pretty">
        Your rate is <strong>${technician.rate.toLocaleString()} per stage</strong>. Payments are collected weekly. Tap &ldquo;Confirm receipt&rdquo; after you have been paid to log it as settled.
      </p>

      {/* Batch list */}
      {myBatches.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No earnings recorded yet. Complete your first stage to see it here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {myBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onSettle={() => handleSettle(batch)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- BatchCard -------------------------------------------------------

function BatchCard({
  batch,
  onSettle,
}: {
  batch: PayBatch
  onSettle: () => void
}) {
  const settled = !!batch.settledAt

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden border-l-4",
        settled
          ? "border-l-green-500 bg-green-50/40 dark:bg-green-950/20"
          : "border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20"
      )}
    >
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {batch.weekLabel}
          </div>
          {settled ? (
            <Badge className="gap-1 border-transparent bg-green-600 text-white dark:bg-green-500">
              <BadgeCheck className="size-3" />
              Settled
            </Badge>
          ) : (
            <Badge className="gap-1 border-transparent bg-blue-600 text-white dark:bg-blue-500">
              <Wallet className="size-3" />
              Awaiting collection
            </Badge>
          )}
        </div>
        <CardTitle
          className={cn(
            "text-2xl font-semibold tabular-nums",
            settled
              ? "text-green-700 dark:text-green-400"
              : "text-blue-700 dark:text-blue-400"
          )}
        >
          ${batch.total.toLocaleString()}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        {/* Stage breakdown — no item values, only rate × count */}
        <div
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            settled
              ? "bg-green-100/60 dark:bg-green-900/30"
              : "bg-blue-100/60 dark:bg-blue-900/30"
          )}
        >
          <span className="text-muted-foreground">
            {batch.stagesCompleted} stage{batch.stagesCompleted !== 1 ? "s" : ""}
          </span>
          {" × "}
          <span className="font-medium">${batch.rate.toLocaleString()}</span>
          <span className="text-muted-foreground"> per stage</span>
        </div>

        {settled ? (
          <p className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            Confirmed received on {fmtSettled(batch.settledAt!)}
          </p>
        ) : (
          <ConfirmDialog batch={batch} onConfirm={onSettle} />
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Confirm dialog --------------------------------------------------

function ConfirmDialog({
  batch,
  onConfirm,
}: {
  batch: PayBatch
  onConfirm: () => void
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-base"
          >
            <CheckCircle2 data-icon="inline-start" />
            Confirm I received this
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm payment received</DialogTitle>
          <DialogDescription>
            You are confirming that you have physically received{" "}
            <strong>${batch.total.toLocaleString()}</strong> for the week of{" "}
            {batch.weekLabel}.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will log the payment as settled. This action cannot be undone.
        </p>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="ghost" className="h-11">
                Cancel
              </Button>
            }
          />
          <DialogClose
            render={
              <Button
                className="h-11 bg-green-600 text-white hover:bg-green-700"
                onClick={onConfirm}
              >
                <BadgeCheck data-icon="inline-start" />
                Yes, I received it
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

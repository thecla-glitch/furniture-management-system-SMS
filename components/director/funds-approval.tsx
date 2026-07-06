"use client"

import { useState } from "react"
import { Banknote, Check, Clock, X } from "lucide-react"
import { toast } from "sonner"

import { useFunds, type FundRequest } from "@/components/director/funds-store"
import { formatCurrency } from "@/lib/costing"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export function FundsApproval() {
  const { requests, approveFunds, declineFunds } = useFunds()

  const pending = requests.filter((r) => r.status === "Pending")
  const resolved = requests.filter((r) => r.status !== "Pending")

  const pendingTotal = pending.reduce((s, r) => s + r.amount, 0)
  const approvedTotal = requests
    .filter((r) => r.status === "Approved")
    .reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending requests" value={String(pending.length)} />
        <StatCard label="Pending amount" value={formatCurrency(pendingTotal)} highlight />
        <StatCard label="Approved to date" value={formatCurrency(approvedTotal)} />
      </div>

      {/* Pending queue */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Awaiting decision
        </h2>
        {pending.length === 0 ? (
          <Empty className="rounded-lg border border-dashed border-border py-10">
            <EmptyHeader>
              <EmptyTitle>No pending fund requests</EmptyTitle>
              <EmptyDescription>
                When the Stock Keeper requests restocking funds, they will appear
                here for your approval.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          pending.map((req) => (
            <PendingCard
              key={req.id}
              req={req}
              onApprove={(note) => {
                approveFunds(req.id, note)
                toast.success("Funds approved", {
                  description: `${formatCurrency(req.amount)} released to the Stock Keeper.`,
                })
              }}
              onDecline={(note) => {
                declineFunds(req.id, note)
                toast("Request declined", {
                  description: `The Stock Keeper has been notified.`,
                })
              }}
            />
          ))
        )}
      </section>

      {/* History */}
      {resolved.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">History</h2>
          <div className="flex flex-col gap-2">
            {resolved.map((req) => (
              <ResolvedRow key={req.id} req={req} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <Card className={cn(highlight && "border-primary/40 bg-primary/5")}>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function PendingCard({
  req,
  onApprove,
  onDecline,
}: {
  req: FundRequest
  onApprove: (note?: string) => void
  onDecline: (note?: string) => void
}) {
  const [note, setNote] = useState("")

  return (
    <Card className="border-l-4 border-l-yellow-400">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="size-4 text-primary" />
              {formatCurrency(req.amount)}
            </CardTitle>
            <CardDescription>
              {req.materialName ? `${req.materialName} · ` : ""}
              Requested by {req.requestedBy} · {req.createdAt}
            </CardDescription>
          </div>
          <Badge className="gap-1 border border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
            <Clock className="size-3" />
            Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">{req.reason}</p>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note to the Stock Keeper"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onApprove(note || undefined)}>
            <Check data-icon="inline-start" />
            Approve &amp; release
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDecline(note || undefined)}
          >
            <X data-icon="inline-start" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ResolvedRow({ req }: { req: FundRequest }) {
  const approved = req.status === "Approved"
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border-l-4 bg-card px-3 py-2",
        approved ? "border-l-green-500" : "border-l-muted-foreground/40"
      )}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(req.amount)}
          {req.materialName ? ` · ${req.materialName}` : ""}
        </span>
        <span className="text-xs text-muted-foreground">
          {req.requestedBy} · {req.resolvedAt ?? req.createdAt}
          {req.note ? ` · "${req.note}"` : ""}
        </span>
      </div>
      <Badge
        className={cn(
          "gap-1",
          approved
            ? "border-transparent bg-green-600 text-white dark:bg-green-500"
            : "border border-border bg-muted text-muted-foreground"
        )}
      >
        {approved ? <Check className="size-3" /> : <X className="size-3" />}
        {req.status}
      </Badge>
    </div>
  )
}

"use client"

import { useMemo } from "react"
import { ClipboardCheck, Globe, PackageCheck } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  getBranchById,
  getShowroomSetById,
  type PartialSaleStatus,
} from "@/lib/mock-data"
import { useShowroom } from "@/components/shop/showroom-store"
import { BreakSetDialog } from "@/components/shop/break-set-dialog"
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

const STATUS_STYLES: Record<PartialSaleStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Approved: "bg-primary/10 text-primary border-primary/20",
  Declined: "bg-destructive/10 text-destructive border-destructive/20",
}

export function SetApprovalsScreen() {
  const { partialRequests, declinePartialSale } = useShowroom()

  const pending = useMemo(
    () => partialRequests.filter((r) => r.status === "Pending"),
    [partialRequests]
  )
  const decided = useMemo(
    () => partialRequests.filter((r) => r.status !== "Pending"),
    [partialRequests]
  )

  function handleDecline(id: string) {
    declinePartialSale(id)
    toast.info("Request declined", {
      description: "The branch has been notified. No stock has moved.",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ClipboardCheck className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Set Approvals
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Approve or decline partial-sale requests across every branch.
              Breaking a set is a Director-only action.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5 self-start">
          <Globe className="size-3.5" />
          All branches
        </Badge>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Pending requests ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackageCheck className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                No partial-sale requests waiting for approval.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((req) => {
              const set = getShowroomSetById(req.setId)
              const branch = getBranchById(req.branchId)
              const requestedComponents =
                set?.components.filter((c) =>
                  req.componentIds.includes(c.id)
                ) ?? []
              return (
                <Card key={req.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {req.setId}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("border", STATUS_STYLES[req.status])}
                      >
                        {req.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base text-balance">
                      {set?.name ?? req.setId}
                    </CardTitle>
                    <CardDescription>
                      {branch
                        ? `Branch ${branch.code} — ${branch.name}`
                        : req.branchId}{" "}
                      · {req.customerName} · {req.contact}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-2">
                    <p className="text-sm font-medium">
                      Requested components
                    </p>
                    <ul className="flex flex-col gap-1">
                      {requestedComponents.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-sm"
                        >
                          <span>{c.label}</span>
                          <span className="tabular-nums text-muted-foreground">
                            ${c.individualPrice.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex-wrap gap-2">
                    {set && set.status === "Available" ? (
                      <BreakSetDialog request={req} />
                    ) : (
                      <Button size="sm" disabled>
                        Set unavailable
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(req.id)}
                    >
                      Decline
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent decisions
          </h2>
          <Card>
            <CardContent className="flex flex-col gap-2 py-4">
              {decided.map((req) => {
                const set = getShowroomSetById(req.setId)
                const branch = getBranchById(req.branchId)
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
                        {branch ? `Branch ${branch.code}` : req.branchId}
                        {set ? ` · ${set.name}` : ""}
                        {req.decidedAt ? ` · ${req.decidedAt}` : ""}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("border", STATUS_STYLES[req.status])}
                    >
                      {req.status}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

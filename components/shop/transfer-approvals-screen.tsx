"use client"

import { useMemo } from "react"
import { ArrowRight, Globe, PackageCheck, Truck } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { getBranchById, type TransferStatus } from "@/lib/mock-data"
import { useShowroom } from "@/components/shop/showroom-store"
import { NewTransferDialog } from "@/components/shop/new-transfer-dialog"
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

const STATUS_STYLES: Record<TransferStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Approved: "bg-primary/10 text-primary border-primary/20",
  Completed: "bg-primary/10 text-primary border-primary/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
}

export function TransferApprovalsScreen() {
  const { sets, transfers, approveTransfer, declineTransfer } = useShowroom()

  const pending = useMemo(
    () => transfers.filter((t) => t.status === "Pending"),
    [transfers]
  )
  const decided = useMemo(
    () => transfers.filter((t) => t.status !== "Pending"),
    [transfers]
  )

  function handleApprove(id: string, setName: string) {
    approveTransfer(id)
    toast.success("Transfer approved", {
      description: `${setName} moved to the requesting branch.`,
    })
  }

  function handleDecline(id: string) {
    declineTransfer(id)
    toast.info("Transfer declined", {
      description: "The branch has been notified. No stock has moved.",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Truck className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Inter-branch transfers
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Approve transfer requests from branches, or move an available set
              between branches yourself.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Badge variant="secondary" className="gap-1.5">
            <Globe className="size-3.5" />
            All branches
          </Badge>
          <NewTransferDialog />
        </div>
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
                No transfer requests waiting for approval.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((t) => {
              const set = sets.find((s) => s.id === t.setId)
              const from = getBranchById(set?.branchId ?? t.fromBranchId)
              const to = getBranchById(t.toBranchId)
              return (
                <Card key={t.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {t.setId}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("border", STATUS_STYLES[t.status])}
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base text-balance">
                      {set?.name ?? t.setId}
                    </CardTitle>
                    <CardDescription>
                      Requested by {t.requestedBy} · {t.requestedAt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="rounded-md bg-muted px-2 py-1">
                        {from ? from.name : "Source branch"}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
                        {to ? to.name : "Destination"}
                      </span>
                    </div>
                    {t.reason && (
                      <p className="rounded-md bg-muted/50 px-2.5 py-1.5 text-sm text-muted-foreground">
                        {t.reason}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(t.id, set?.name ?? t.setId)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(t.id)}
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
            Recent transfers
          </h2>
          <Card>
            <CardContent className="flex flex-col gap-2 py-4">
              {decided.map((t) => {
                const set = sets.find((s) => s.id === t.setId)
                const from = getBranchById(t.fromBranchId)
                const to = getBranchById(t.toBranchId)
                return (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {set?.name ?? t.setId}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          {t.setId}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {from ? from.name : "—"}
                        {" → "}
                        {to ? to.name : "—"}
                        {t.directorInitiated ? " · Director initiated" : ""}
                        {t.decidedAt ? ` · ${t.decidedAt}` : ""}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("border", STATUS_STYLES[t.status])}
                    >
                      {t.status === "Completed" ? "Transferred" : t.status}
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

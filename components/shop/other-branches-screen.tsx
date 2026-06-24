"use client"

import { useMemo } from "react"
import { Eye, Globe, PackageSearch } from "lucide-react"

import { cn } from "@/lib/utils"
import { getBranchById, type TransferStatus } from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { TransferRequestDialog } from "@/components/shop/transfer-request-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const TRANSFER_STATUS_STYLES: Record<TransferStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Approved: "bg-primary/10 text-primary border-primary/20",
  Completed: "bg-primary/10 text-primary border-primary/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
}

export function OtherBranchesScreen() {
  const { activeBranch, branches } = useBranch()
  const { sets, transfers } = useShowroom()

  // Read-only: every Available set that lives at another branch.
  const otherSets = useMemo(
    () =>
      sets.filter(
        (s) => s.branchId !== activeBranch.id && s.status === "Available"
      ),
    [sets, activeBranch.id]
  )

  // Group sets under their owning branch for a clear, scannable layout.
  const groups = useMemo(
    () =>
      branches
        .filter((b) => b.id !== activeBranch.id)
        .map((b) => ({
          branch: b,
          sets: otherSets.filter((s) => s.branchId === b.id),
        }))
        .filter((g) => g.sets.length > 0),
    [branches, activeBranch.id, otherSets]
  )

  // This branch's own outgoing transfer requests, so staff can track them.
  const myTransfers = useMemo(
    () => transfers.filter((t) => t.toBranchId === activeBranch.id),
    [transfers, activeBranch.id]
  )

  // A set has a live (pending) request when we already asked for it.
  const pendingSetIds = useMemo(
    () =>
      new Set(
        myTransfers.filter((t) => t.status === "Pending").map((t) => t.setId)
      ),
    [myTransfers]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Globe className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Other branches
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Browse stock at other showrooms. You can request a transfer to{" "}
              {activeBranch.name}, but you cannot sell another branch&apos;s
              stock directly.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5 self-start">
          <Eye className="size-3.5" />
          Read-only
        </Badge>
      </div>

      {myTransfers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your transfer requests</CardTitle>
            <CardDescription>
              Status of stock you&apos;ve asked the Director to move here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {myTransfers.map((t) => {
              const set = sets.find((s) => s.id === t.setId)
              const from = getBranchById(t.fromBranchId)
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
                      {from ? `From ${from.name}` : "Pending source"}
                      {t.reason ? ` · ${t.reason}` : ""}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("border", TRANSFER_STATUS_STYLES[t.status])}
                  >
                    {t.status === "Completed" ? "Transferred" : t.status}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageSearch className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              No available stock at other branches right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <section key={group.branch.id} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Branch {group.branch.code} — {group.branch.name} (
              {group.sets.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.sets.map((set) => {
                const requested = pendingSetIds.has(set.id)
                return (
                  <Card key={set.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {set.id}
                        </span>
                        <Badge variant="secondary">{group.branch.name}</Badge>
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
                    </CardContent>
                    <CardFooter>
                      {requested ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            TRANSFER_STATUS_STYLES.Pending
                          )}
                        >
                          Transfer requested
                        </Badge>
                      ) : (
                        <TransferRequestDialog set={set} />
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

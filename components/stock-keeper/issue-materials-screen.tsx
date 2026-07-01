"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  PackageCheck,
  PackagePlus,
} from "lucide-react"
import { toast } from "sonner"

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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStock } from "@/components/stock-keeper/stock-store"
import type { AdditionalIssuance, OrderIssuance } from "@/lib/mock-data"

// --------------------------------------------------------------------------
// Expandable order issuance card
// --------------------------------------------------------------------------

function OrderIssuanceCard({ issuance }: { issuance: OrderIssuance }) {
  const { items, issueOrder } = useStock()
  const [expanded, setExpanded] = useState(issuance.status === "Pending")
  const [actuals, setActuals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      issuance.lines.map((l) => [l.inventoryItemId, String(l.estimatedQty)])
    )
  )

  const done = issuance.status === "Done"

  function onHand(itemId: string): number {
    return items.find((i) => i.id === itemId)?.quantity ?? 0
  }

  function hasShortage(): boolean {
    return issuance.lines.some((line) => {
      const want = Number.parseFloat(actuals[line.inventoryItemId]) || 0
      return want > onHand(line.inventoryItemId)
    })
  }

  function handleIssue() {
    const parsed: Record<string, number> = {}
    for (const line of issuance.lines) {
      const value = Number.parseFloat(actuals[line.inventoryItemId])
      parsed[line.inventoryItemId] = Number.isNaN(value) ? 0 : Math.max(0, value)
    }
    issueOrder(issuance.id, parsed)
    toast.success(`Materials issued for ${issuance.orderId}`, {
      description: `${issuance.lines.length} material${issuance.lines.length > 1 ? "s" : ""} deducted.`,
    })
  }

  return (
    <Card className={cn(done && "opacity-60")}>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <CardTitle className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-base">
          <span className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {issuance.orderId}
            </span>
            <span>{issuance.furnitureType}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {issuance.lines.length} line{issuance.lines.length !== 1 ? "s" : ""}
            </span>
            {done ? (
              <Badge variant="secondary" className="gap-1">
                <Check className="size-3" />
                Issued {issuance.issuedAt}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-primary/50">
                Pending
              </Badge>
            )}
          </span>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-4 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Estimated</TableHead>
                <TableHead>On hand</TableHead>
                {!done && <TableHead>Issue qty</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuance.lines.map((line) => {
                const available = onHand(line.inventoryItemId)
                const want = Number.parseFloat(actuals[line.inventoryItemId]) || 0
                const short = !done && want > available
                return (
                  <TableRow key={line.inventoryItemId}>
                    <TableCell className="font-medium">
                      {line.materialName}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {line.estimatedQty} {line.unit}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular-nums",
                        short ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {short && <AlertTriangle className="size-3" />}
                        {available} {line.unit}
                      </span>
                    </TableCell>
                    {!done && (
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={actuals[line.inventoryItemId]}
                          onChange={(e) =>
                            setActuals((prev) => ({
                              ...prev,
                              [line.inventoryItemId]: e.target.value,
                            }))
                          }
                          aria-invalid={short}
                          className="h-8 w-24 tabular-nums"
                          aria-label={`Qty to issue for ${line.materialName}`}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {!done && (
            <div className="flex items-center justify-between gap-3">
              {hasShortage() && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertTriangle className="size-4" />
                  One or more materials are below the requested quantity.
                </p>
              )}
              <div className="ml-auto">
                <Button onClick={handleIssue}>
                  <PackageCheck className="size-4" />
                  Issue materials
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// --------------------------------------------------------------------------
// Additional issuance row
// --------------------------------------------------------------------------

function AdditionalRow({
  issuance,
}: {
  issuance: AdditionalIssuance
}) {
  const { items, issueAdditional } = useStock()
  const available =
    items.find((i) => i.id === issuance.inventoryItemId)?.quantity ?? 0
  const short =
    issuance.status === "Pending" && issuance.approvedQty > available
  const done = issuance.status === "Done"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg border border-dashed p-4",
        done
          ? "border-border bg-muted/40 opacity-60"
          : "border-primary/40 bg-accent/40"
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {issuance.orderId}
          </span>
          <Badge variant="outline" className="border-primary/50 text-xs">
            Additional
          </Badge>
        </div>
        <span className="font-medium">
          {issuance.approvedQty} {issuance.unit} — {issuance.materialName}
        </span>
        <span className="text-xs text-muted-foreground">
          Requested by {issuance.technicianName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!done && (
          <span
            className={cn(
              "flex items-center gap-1 text-sm tabular-nums",
              short ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {short && <AlertTriangle className="size-3" />}
            {available} {issuance.unit} on hand
          </span>
        )}
        {done ? (
          <Badge variant="secondary" className="gap-1">
            <Check className="size-3" />
            Issued {issuance.issuedAt}
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              issueAdditional(issuance.id)
              toast.success(`Issued for ${issuance.orderId}`, {
                description: `${issuance.approvedQty} ${issuance.unit} of ${issuance.materialName} deducted.`,
              })
            }}
          >
            <PackagePlus className="size-4" />
            Issue
          </Button>
        )}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Main screen with tabs: Orders | Additional | All done
// --------------------------------------------------------------------------

type IssueTab = "orders" | "additional" | "history"

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
      {count}
    </span>
  )
}

export function IssueMaterialsScreen() {
  const { orderIssuances, additionalIssuances } = useStock()
  const [tab, setTab] = useState<IssueTab>("orders")

  const pendingOrders = orderIssuances.filter((i) => i.status === "Pending")
  const pendingAdditional = additionalIssuances.filter(
    (i) => i.status === "Pending"
  )
  const doneOrders = orderIssuances.filter((i) => i.status === "Done")
  const doneAdditional = additionalIssuances.filter((i) => i.status === "Done")

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <span>
          <strong className="tabular-nums">{pendingOrders.length}</strong>{" "}
          order issuance{pendingOrders.length !== 1 ? "s" : ""} pending
        </span>
        <span className="text-muted-foreground">·</span>
        <span>
          <strong className="tabular-nums">{pendingAdditional.length}</strong>{" "}
          additional request{pendingAdditional.length !== 1 ? "s" : ""} pending
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {doneOrders.length + doneAdditional.length} issued total
        </span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as IssueTab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="orders" className="gap-1.5">
            Order issuances
            <CountBadge count={pendingOrders.length} />
          </TabsTrigger>
          <TabsTrigger value="additional" className="gap-1.5">
            Additional requests
            <CountBadge count={pendingAdditional.length} />
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            History
            <CountBadge count={doneOrders.length + doneAdditional.length} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Order issuances */}
      {tab === "orders" && (
        <div className="flex flex-col gap-4">
          {pendingOrders.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No pending order issuances</EmptyTitle>
                <EmptyDescription>
                  Per-order material estimates from the Operations Manager will
                  appear here when they are ready to be issued.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            pendingOrders.map((i) => (
              <OrderIssuanceCard key={i.id} issuance={i} />
            ))
          )}
        </div>
      )}

      {/* Additional requests */}
      {tab === "additional" && (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <PackagePlus className="size-4 text-primary" />
            Extra materials approved mid-build — issued on top of the original
            order estimate.
          </p>
          {pendingAdditional.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No pending additional requests</EmptyTitle>
                <EmptyDescription>
                  Extra-material requests approved by the Operations Manager will
                  appear here for physical issue.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            pendingAdditional.map((i) => (
              <AdditionalRow key={i.id} issuance={i} />
            ))
          )}
        </div>
      )}

      {/* History — all completed issuances */}
      {tab === "history" && (
        <div className="flex flex-col gap-4">
          {doneOrders.length === 0 && doneAdditional.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No issuances completed yet</EmptyTitle>
                <EmptyDescription>
                  Completed order and additional issuances will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {doneOrders.map((i) => (
                <OrderIssuanceCard key={i.id} issuance={i} />
              ))}
              {doneAdditional.map((i) => (
                <AdditionalRow key={i.id} issuance={i} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

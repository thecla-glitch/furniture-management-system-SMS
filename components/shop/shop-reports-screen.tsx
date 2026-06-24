"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Globe,
  Hammer,
  PackageCheck,
  Scissors,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  branches,
  getBranchById,
  type ShopSale,
  type ShowroomSet,
  type ShowroomSetStatus,
} from "@/lib/mock-data"
import { useShowroom } from "@/components/shop/showroom-store"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Scope = "all" | string

interface ScopeMetrics {
  totalSalesValue: number
  fullSetsSold: number
  setsBroken: number
  partialSales: number
  unsoldValue: number
}

const SET_STATUS_STYLES: Record<ShowroomSetStatus, string> = {
  Available: "bg-primary/10 text-primary border-primary/20",
  Reserved: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Sold: "bg-muted text-muted-foreground border-border",
  Broken: "bg-destructive/10 text-destructive border-destructive/20",
  Transferred: "bg-secondary text-secondary-foreground border-border",
}

const SET_STATUSES: ShowroomSetStatus[] = [
  "Available",
  "Reserved",
  "Sold",
  "Broken",
  "Transferred",
]

function formatMoney(value: number): string {
  return `$${value.toLocaleString()}`
}

/** Whole days a set has sat in the showroom since it was entered. */
function daysInShowroom(dateEntered: string): number {
  const ms = Date.now() - new Date(dateEntered).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

function computeMetrics(
  scope: Scope,
  sets: ShowroomSet[],
  sales: ShopSale[]
): ScopeMetrics {
  const inScope = (branchId: string) => scope === "all" || branchId === scope
  const scopedSales = sales.filter((s) => inScope(s.branchId))
  const scopedSets = sets.filter((s) => inScope(s.branchId))

  return {
    totalSalesValue: scopedSales.reduce((sum, s) => sum + s.salePrice, 0),
    fullSetsSold: scopedSales.filter((s) => s.kind === "Full Set").length,
    setsBroken: scopedSets.filter((s) => s.status === "Broken").length,
    partialSales: scopedSales.filter((s) => s.kind === "Components").length,
    // Unsold inventory = every Available set's full price. Standalone pieces
    // left over from a break are themselves Available sets, so they're counted.
    unsoldValue: scopedSets
      .filter((s) => s.status === "Available")
      .reduce((sum, s) => sum + s.fullSetPrice, 0),
  }
}

export function ShopReportsScreen() {
  const { sets, sales } = useShowroom()
  const [scope, setScope] = useState<Scope>("all")
  const [threshold, setThreshold] = useState(60)

  // Combined inventory table has its own independent filters.
  const [branchFilter, setBranchFilter] = useState<Scope>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | ShowroomSetStatus>(
    "all"
  )

  // Value→label maps so the Base UI Select trigger shows readable text.
  const scopeItems = {
    all: "Combined (all branches)",
    ...Object.fromEntries(
      branches.map((b) => [b.id, `Branch ${b.code} — ${b.name}`])
    ),
  }
  const branchFilterItems = {
    all: "All branches",
    ...Object.fromEntries(branches.map((b) => [b.id, `Branch ${b.code}`])),
  }
  const statusFilterItems = {
    all: "All statuses",
    ...Object.fromEntries(SET_STATUSES.map((s) => [s, s])),
  }

  const metrics = useMemo(
    () => computeMetrics(scope, sets, sales),
    [scope, sets, sales]
  )

  const perBranch = useMemo(
    () =>
      branches.map((b) => ({
        branch: b,
        metrics: computeMetrics(b.id, sets, sales),
      })),
    [sets, sales]
  )

  const scopeLabel =
    scope === "all" ? "All branches" : getBranchById(scope)?.name ?? "Branch"

  // Slow-moving = Available sets older than the threshold, within scope.
  const slowMoving = useMemo(() => {
    return sets
      .filter(
        (s) =>
          s.status === "Available" &&
          (scope === "all" || s.branchId === scope) &&
          daysInShowroom(s.dateEntered) > threshold
      )
      .map((s) => ({ set: s, days: daysInShowroom(s.dateEntered) }))
      .sort((a, b) => b.days - a.days)
  }, [sets, scope, threshold])

  const inventoryRows = useMemo(() => {
    return sets
      .filter((s) => branchFilter === "all" || s.branchId === branchFilter)
      .filter((s) => statusFilter === "all" || s.status === statusFilter)
      .map((s) => ({ set: s, days: daysInShowroom(s.dateEntered) }))
      .sort((a, b) => a.set.id.localeCompare(b.set.id))
  }, [sets, branchFilter, statusFilter])

  const statCards = [
    {
      label: "Total sales value",
      value: formatMoney(metrics.totalSalesValue),
      icon: Wallet,
      hint: "Completed shop sales",
    },
    {
      label: "Full sets sold",
      value: metrics.fullSetsSold.toLocaleString(),
      icon: PackageCheck,
      hint: "Sold as a whole set",
    },
    {
      label: "Sets broken",
      value: metrics.setsBroken.toLocaleString(),
      icon: Scissors,
      hint: "Split into pieces",
    },
    {
      label: "Partial sales",
      value: metrics.partialSales.toLocaleString(),
      icon: Hammer,
      hint: "Component sales",
    },
    {
      label: "Unsold inventory",
      value: formatMoney(metrics.unsoldValue),
      icon: Boxes,
      hint: "Available set value",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <BarChart3 className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Shop Reports
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Sales performance, slow-moving stock, and a bird&apos;s-eye view
              of inventory across every branch.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Globe className="size-4 text-muted-foreground" />
          <Select
            items={scopeItems}
            value={scope}
            onValueChange={(v) => setScope(v ?? "all")}
          >
            <SelectTrigger className="w-48" aria-label="Report scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Combined (all branches)</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  Branch {b.code} — {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary stat cards for the selected scope */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {scopeLabel} summary
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="gap-2 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-pretty">
                    {card.label}
                  </CardDescription>
                  <card.icon className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl tabular-nums">
                  {card.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Per-branch breakdown — only meaningful in the combined view */}
      {scope === "all" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Per-branch breakdown
          </h2>
          <Card>
            <CardContent className="px-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Sales value</TableHead>
                    <TableHead className="text-right">Full sets sold</TableHead>
                    <TableHead className="text-right">Sets broken</TableHead>
                    <TableHead className="text-right">Partial sales</TableHead>
                    <TableHead className="text-right">Unsold value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perBranch.map(({ branch, metrics: m }) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        <span className="font-mono text-xs text-muted-foreground">
                          {branch.code}
                        </span>{" "}
                        {branch.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(m.totalSalesValue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.fullSetsSold}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.setsBroken}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.partialSales}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(m.unsoldValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Slow-moving stock flag */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AlertTriangle className="size-4 text-amber-600" />
            Needs attention — slow-moving stock
          </h2>
          <div className="flex items-center gap-2">
            <label
              htmlFor="slow-threshold"
              className="text-sm text-muted-foreground"
            >
              Older than
            </label>
            <Input
              id="slow-threshold"
              type="number"
              min={1}
              value={threshold}
              onChange={(e) =>
                setThreshold(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>
        {slowMoving.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackageCheck className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                No available sets have been in {scopeLabel.toLowerCase()} for
                more than {threshold} days.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="px-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Days in showroom</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowMoving.map(({ set, days }) => (
                    <TableRow key={set.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{set.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {set.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getBranchById(set.branchId)?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="border-amber-500/20 bg-amber-500/10 tabular-nums text-amber-600"
                        >
                          {days} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(set.fullSetPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Combined inventory view — always all branches, own filters */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Combined inventory — all branches ({inventoryRows.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              items={branchFilterItems}
              value={branchFilter}
              onValueChange={(v) => setBranchFilter(v ?? "all")}
            >
              <SelectTrigger className="w-40" aria-label="Filter by branch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    Branch {b.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={statusFilterItems}
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter((v ?? "all") as "all" | ShowroomSetStatus)
              }
            >
              <SelectTrigger className="w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {SET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Card>
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Set ID</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Full set price</TableHead>
                  <TableHead className="text-right">Days in showroom</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No sets match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryRows.map(({ set, days }) => (
                    <TableRow key={set.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {set.id}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getBranchById(set.branchId)?.code ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">{set.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("border", SET_STATUS_STYLES[set.status])}
                        >
                          {set.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(set.fullSetPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {days}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

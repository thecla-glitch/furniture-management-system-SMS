"use client"

import { useState } from "react"
import { Download, Loader2, TrendingUp, ShoppingBag, Hammer } from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/components/front-desk/orders-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { formatCurrency, getOrderCosting } from "@/lib/costing"
import { downloadPDF } from "@/lib/pdf-export"
import { shopCategories, type ShopCategory } from "@/lib/mock-data"

const PIE_COLORS = [
  "#4F7BEF", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
]

type RevenueTab = "overview" | "workshop" | "showroom"

export function RevenueView() {
  const { orders } = useOrders()
  const { sales } = useShowroom()
  const [tab, setTab] = useState<RevenueTab>("overview")
  const [exporting, setExporting] = useState(false)

  // --- Workshop (order) revenue ---
  const workshopOrders = orders.filter((o) => o.status !== "Pending Approval")
  const workshopRevenue = workshopOrders.reduce((s, o) => s + o.quotedPrice, 0)
  const workshopMargin = workshopOrders.reduce((s, o) => {
    const c = getOrderCosting(o)
    return s + (c.hasStages ? c.grossMargin : 0)
  }, 0)

  // Revenue by originating branch (workshop orders)
  const workshopByBranch = Object.entries(
    workshopOrders.reduce<Record<string, number>>((acc, o) => {
      const key = o.originatingBranch ?? "Unknown"
      acc[key] = (acc[key] ?? 0) + o.quotedPrice
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // Revenue by furniture type (top 6)
  const workshopByType = Object.entries(
    workshopOrders.reduce<Record<string, number>>((acc, o) => {
      acc[o.furnitureType] = (acc[o.furnitureType] ?? 0) + o.quotedPrice
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  // --- Showroom (shop) revenue ---
  const showroomRevenue = sales.reduce((s, sale) => s + sale.total, 0)
  const showroomByCategory: { name: ShopCategory; value: number }[] = shopCategories
    .map((cat) => {
      const value = sales.reduce((s, sale) => {
        // Find items that match this category — item info is on the line item name
        // We don't have category on the sale line, so we use the items in the store.
        return s + sale.lineItems.filter(() => true).reduce((ls, li) => ls + li.price, 0)
      }, 0)
      return { name: cat, value }
    })
    .filter((d) => d.value > 0)

  // Simpler: group showroom sales by kind (Single / Set)
  const showroomByKind = [
    {
      name: "Single unit",
      value: sales.filter((s) => s.kind === "Single").reduce((a, s) => a + s.total, 0),
    },
    {
      name: "Set sale",
      value: sales.filter((s) => s.kind === "Set").reduce((a, s) => a + s.total, 0),
    },
  ].filter((d) => d.value > 0)

  // Payment method split
  const showroomByPayment = Object.entries(
    sales.reduce<Record<string, number>>((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const totalRevenue = workshopRevenue + showroomRevenue

  async function handleExport() {
    setExporting(true)
    try {
      await downloadPDF(
        `revenue-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        "Revenue Report",
        `All-time · ${orders.length} workshop orders · ${sales.length} showroom sales`,
        [
          {
            title: "Summary",
            stats: [
              { label: "Total revenue", value: formatCurrency(totalRevenue) },
              { label: "Workshop orders", value: formatCurrency(workshopRevenue) },
              { label: "Showroom sales", value: formatCurrency(showroomRevenue) },
              { label: "Gross margin (workshop)", value: formatCurrency(workshopMargin) },
            ],
          },
          {
            title: "Revenue by branch (workshop)",
            elementId: "rev-branch-chart",
          },
          {
            title: "Workshop orders detail",
            table: {
              headers: ["Order", "Customer", "Furniture type", "Branch", "Revenue", "Margin"],
              rows: workshopOrders.map((o) => {
                const c = getOrderCosting(o)
                return [
                  o.id,
                  o.customerName,
                  o.furnitureType,
                  o.originatingBranch ?? "—",
                  formatCurrency(o.quotedPrice),
                  c.hasStages ? formatCurrency(c.grossMargin) : "—",
                ]
              }),
              footerRow: ["", "", "", "Total", formatCurrency(workshopRevenue), formatCurrency(workshopMargin)],
            },
          },
          {
            title: "Showroom sales summary",
            elementId: "rev-showroom-chart",
          },
          {
            title: "Showroom sales detail",
            table: {
              headers: ["Sale ID", "Branch", "Kind", "Customer", "Payment", "Total"],
              rows: sales.map((s) => [
                s.id,
                s.branchId,
                s.kind,
                s.customerName,
                s.paymentMethod,
                formatCurrency(s.total),
              ]),
              footerRow: ["", "", "", "", "Total", formatCurrency(showroomRevenue)],
            },
          },
        ]
      )
      toast.success("Revenue report downloaded.")
    } catch {
      toast.error("Export failed. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const tabs: { key: RevenueTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "workshop", label: "Workshop orders" },
    { key: "showroom", label: "Showroom sales" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">Revenue</h2>
          <p className="text-sm text-muted-foreground">
            Combined revenue from workshop orders and showroom sales across all branches.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-1.5 self-start"
        >
          {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Download PDF
        </Button>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI summary — always visible */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Total revenue" value={formatCurrency(totalRevenue)} />
        <KpiCard icon={Hammer} label="Workshop orders" value={formatCurrency(workshopRevenue)} sub={`${workshopOrders.length} orders`} />
        <KpiCard icon={ShoppingBag} label="Showroom sales" value={formatCurrency(showroomRevenue)} sub={`${sales.length} transactions`} />
        <KpiCard
          icon={TrendingUp}
          label="Gross margin"
          value={formatCurrency(workshopMargin)}
          sub="workshop only"
          highlight={workshopMargin >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {workshopByBranch.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Workshop revenue by branch</CardTitle>
                <CardDescription>Customer order value per originating branch</CardDescription>
              </CardHeader>
              <CardContent id="rev-branch-chart">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={workshopByBranch} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {workshopByBranch.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {workshopByType.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by furniture type</CardTitle>
                <CardDescription>Top 6 types by order value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={workshopByType} margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="value" fill={PIE_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showroomByKind.length > 0 && (
            <Card id="rev-showroom-chart">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Showroom sales by type</CardTitle>
                <CardDescription>Single-unit vs set sales value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={showroomByKind} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {showroomByKind.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showroomByPayment.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Showroom by payment method</CardTitle>
                <CardDescription>Revenue split per payment channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={showroomByPayment} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {showroomByPayment.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Workshop orders tab */}
      {tab === "workshop" && (
        <Card>
          <CardHeader>
            <CardTitle>Workshop orders</CardTitle>
            <CardDescription>All customer orders and their revenue contribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Furniture</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshopOrders.map((o) => {
                    const c = getOrderCosting(o)
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.id}</TableCell>
                        <TableCell>{o.customerName}</TableCell>
                        <TableCell>{o.furnitureType}</TableCell>
                        <TableCell className="text-muted-foreground">{o.originatingBranch ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(o.quotedPrice)}</TableCell>
                        <TableCell className={cn(
                          "text-right tabular-nums font-medium",
                          c.hasStages
                            ? c.grossMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                            : "text-muted-foreground"
                        )}>
                          {c.hasStages ? formatCurrency(c.grossMargin) : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">{formatCurrency(workshopRevenue)}</TableCell>
                    <TableCell className={cn("text-right font-bold tabular-nums",
                      workshopMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                    )}>
                      {formatCurrency(workshopMargin)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Showroom sales tab */}
      {tab === "showroom" && (
        <Card>
          <CardHeader>
            <CardTitle>Showroom sales</CardTitle>
            <CardDescription>All completed showroom transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No showroom sales recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.id}</TableCell>
                        <TableCell>{s.customerName}</TableCell>
                        <TableCell className="text-muted-foreground">{s.branchId}</TableCell>
                        <TableCell>
                          <Badge variant={s.kind === "Set" ? "default" : "secondary"} className="text-xs">{s.kind}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.paymentMethod}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(s.soldAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatCurrency(s.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{formatCurrency(showroomRevenue)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  highlight?: "positive" | "negative"
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground text-pretty">{label}</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-3.5" />
          </span>
        </div>
        <span className={cn(
          "text-xl font-semibold leading-tight",
          highlight === "positive" && "text-green-600 dark:text-green-400",
          highlight === "negative" && "text-destructive",
          !highlight && "text-foreground"
        )}>
          {value}
        </span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </CardContent>
    </Card>
  )
}

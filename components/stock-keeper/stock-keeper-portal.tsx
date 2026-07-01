"use client"

import { useMemo } from "react"
import { Warehouse } from "lucide-react"

import { useStock } from "@/components/stock-keeper/stock-store"
import { StockOverview } from "@/components/stock-keeper/stock-overview"
import { InventoryLedger } from "@/components/stock-keeper/inventory-ledger"
import { IssueMaterialsScreen } from "@/components/stock-keeper/issue-materials-screen"
import { ReordersScreen } from "@/components/stock-keeper/reorders-screen"
import { FundsRequestPanel } from "@/components/stock-keeper/funds-request-panel"

// --------------------------------------------------------------------------
// Shared page shell — header banner shared by all four routes
// --------------------------------------------------------------------------

function PageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const { lowStockCount, pendingIssuanceCount } = useStock()

  const metaItems = useMemo(
    () => [
      { label: "low stock", value: lowStockCount, alert: lowStockCount > 0 },
      {
        label: "pending issuances",
        value: pendingIssuanceCount,
        alert: pendingIssuanceCount > 0,
      },
    ],
    [lowStockCount, pendingIssuanceCount]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Portal header */}
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Warehouse className="size-5" />
        </span>
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {/* Live stats strip */}
        <div className="flex items-center gap-4 self-start rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          {metaItems.map((m) => (
            <span
              key={m.label}
              className={
                m.alert ? "font-semibold text-destructive" : "text-muted-foreground"
              }
            >
              <span className="tabular-nums">{m.value}</span>{" "}
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          ))}
        </div>
      </div>

      {children}
    </div>
  )
}

// --------------------------------------------------------------------------
// Four named exports — one per route
// --------------------------------------------------------------------------

export function StockOverviewPage() {
  return (
    <PageShell
      title="Stock Keeper — Overview"
      description="Live snapshot of inventory value, low-stock materials, pending issuances and open reorders."
    >
      <StockOverview />
    </PageShell>
  )
}

export function StockInventoryPage() {
  return (
    <PageShell
      title="Stock Keeper — Inventory"
      description="Full material ledger. Edit on-hand quantity, unit cost or reorder threshold inline. Add or remove materials as needed."
    >
      <InventoryLedger />
    </PageShell>
  )
}

export function StockIssueMaterialsPage() {
  return (
    <PageShell
      title="Stock Keeper — Issue Materials"
      description="Issue materials against open orders and approve additional mid-build requests. Every issuance deducts from the ledger automatically."
    >
      <IssueMaterialsScreen />
    </PageShell>
  )
}

export function StockReordersPage() {
  return (
    <PageShell
      title="Stock Keeper — Reorders"
      description="Raise purchase requests, track them from Raised → Ordered → Received, and receive stock directly into the inventory ledger."
    >
      <ReordersScreen />
    </PageShell>
  )
}

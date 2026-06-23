"use client"

import { useState } from "react"
import { Warehouse } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryLedger } from "@/components/stock-keeper/inventory-ledger"
import { PendingIssuances } from "@/components/stock-keeper/pending-issuances"
import { AdditionalIssuances } from "@/components/stock-keeper/additional-issuances"
import { IssuanceRecords } from "@/components/stock-keeper/issuance-records"
import { useStock } from "@/components/stock-keeper/stock-store"

type StockTab = "ledger" | "to-issue" | "additional" | "records"

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
      {count}
    </span>
  )
}

export function StockKeeperPortal() {
  const {
    lowStockCount,
    orderIssuances,
    additionalIssuances,
    records,
  } = useStock()
  const [tab, setTab] = useState<StockTab>("ledger")

  const toIssueCount = orderIssuances.filter(
    (i) => i.status === "Pending"
  ).length
  const additionalCount = additionalIssuances.filter(
    (i) => i.status === "Pending"
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Warehouse className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Stock Keeper Portal
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Maintain the inventory ledger and issue materials against orders.
            Every issuance deducts from the same balances the ledger shows.
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as StockTab)}
        className="gap-6"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="ledger" className="gap-1.5">
            Inventory ledger
            <CountBadge count={lowStockCount} />
          </TabsTrigger>
          <TabsTrigger value="to-issue" className="gap-1.5">
            To issue
            <CountBadge count={toIssueCount} />
          </TabsTrigger>
          <TabsTrigger value="additional" className="gap-1.5">
            Additional
            <CountBadge count={additionalCount} />
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-1.5">
            Records
            <CountBadge count={records.length} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "ledger" && <InventoryLedger />}
      {tab === "to-issue" && <PendingIssuances />}
      {tab === "additional" && <AdditionalIssuances />}
      {tab === "records" && <IssuanceRecords />}
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBranch } from "@/components/shop/branch-store"
import { useQuotes } from "@/components/shop/quotes-store"
import { ShowroomInventoryScreen } from "@/components/shop/showroom-inventory-screen"
import { OtherBranchesScreen } from "@/components/shop/other-branches-screen"
import { CatalogueScreen } from "@/components/shop/catalogue-screen"
import { QuotesScreen } from "@/components/shop/quotes-screen"

type ShopTab = "inventory" | "other" | "catalogue" | "quotes"

export function ShopFrontDeskPortal() {
  const { activeBranch } = useBranch()
  const { quotes } = useQuotes()
  const [tab, setTab] = useState<ShopTab>("inventory")

  // Badge the Quotes tab with this branch's quotes awaiting a verdict.
  const pendingQuotes = useMemo(
    () =>
      quotes.filter(
        (q) =>
          q.branchId === activeBranch.id && q.status === "Pending Director"
      ).length,
    [quotes, activeBranch.id]
  )

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ShopTab)}
        className="gap-0"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="inventory">Showroom stock</TabsTrigger>
          <TabsTrigger value="other">Other branches</TabsTrigger>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          <TabsTrigger value="quotes" className="gap-1.5">
            Quotes
            {pendingQuotes > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {pendingQuotes}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "inventory" && <ShowroomInventoryScreen />}
      {tab === "other" && <OtherBranchesScreen />}
      {tab === "catalogue" && <CatalogueScreen />}
      {tab === "quotes" && <QuotesScreen />}
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuotes } from "@/components/shop/quotes-store"
import { QuoteVerdictsScreen } from "@/components/shop/quote-verdicts-screen"
import { CatalogueScreen } from "@/components/shop/catalogue-screen"
import { ShopReportsScreen } from "@/components/shop/shop-reports-screen"

type DirectorShopTab = "verdicts" | "catalogue" | "reports"

export function ShopDirectorPortal() {
  const { quotes } = useQuotes()
  const [tab, setTab] = useState<DirectorShopTab>("verdicts")

  const pendingVerdicts = useMemo(
    () => quotes.filter((q) => q.status === "Pending Director").length,
    [quotes]
  )

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as DirectorShopTab)}
        className="gap-0"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="verdicts" className="gap-1.5">
            Quote verdicts
            {pendingVerdicts > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {pendingVerdicts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "verdicts" && <QuoteVerdictsScreen />}
      {tab === "catalogue" && <CatalogueScreen showQuoteAction={false} />}
      {tab === "reports" && <ShopReportsScreen />}
    </div>
  )
}

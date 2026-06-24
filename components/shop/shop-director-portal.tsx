"use client"

import { useMemo, useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useShowroom } from "@/components/shop/showroom-store"
import { SetApprovalsScreen } from "@/components/shop/set-approvals-screen"
import { TransferApprovalsScreen } from "@/components/shop/transfer-approvals-screen"
import { ShopReportsScreen } from "@/components/shop/shop-reports-screen"

type DirectorShopTab = "approvals" | "transfers" | "reports"

export function ShopDirectorPortal() {
  const { partialRequests, transfers } = useShowroom()
  const [tab, setTab] = useState<DirectorShopTab>("approvals")

  const pendingApprovals = useMemo(
    () => partialRequests.filter((r) => r.status === "Pending").length,
    [partialRequests]
  )
  const pendingTransfers = useMemo(
    () => transfers.filter((t) => t.status === "Pending").length,
    [transfers]
  )

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as DirectorShopTab)}
        className="gap-0"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="approvals" className="gap-1.5">
            Set approvals
            {pendingApprovals > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {pendingApprovals}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-1.5">
            Transfers
            {pendingTransfers > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {pendingTransfers}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "approvals" && <SetApprovalsScreen />}
      {tab === "transfers" && <TransferApprovalsScreen />}
      {tab === "reports" && <ShopReportsScreen />}
    </div>
  )
}

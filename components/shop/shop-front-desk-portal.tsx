"use client"

import { useMemo, useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { ShowroomInventoryScreen } from "@/components/shop/showroom-inventory-screen"
import { OtherBranchesScreen } from "@/components/shop/other-branches-screen"

type ShopTab = "inventory" | "other"

export function ShopFrontDeskPortal() {
  const { activeBranch } = useBranch()
  const { transfers } = useShowroom()
  const [tab, setTab] = useState<ShopTab>("inventory")

  // Badge the Other branches tab with this branch's open transfer requests.
  const pendingTransfers = useMemo(
    () =>
      transfers.filter(
        (t) => t.toBranchId === activeBranch.id && t.status === "Pending"
      ).length,
    [transfers, activeBranch.id]
  )

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ShopTab)}
        className="gap-0"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="inventory">My inventory</TabsTrigger>
          <TabsTrigger value="other" className="gap-1.5">
            Other branches
            {pendingTransfers > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {pendingTransfers}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "inventory" && <ShowroomInventoryScreen />}
      {tab === "other" && <OtherBranchesScreen />}
    </div>
  )
}

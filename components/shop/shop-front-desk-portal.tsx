"use client"

import { useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShowroomInventoryScreen } from "@/components/shop/showroom-inventory-screen"
import { OtherBranchesScreen } from "@/components/shop/other-branches-screen"
import { CatalogueScreen } from "@/components/shop/catalogue-screen"

type ShopTab = "inventory" | "other" | "catalogue"

export function ShopFrontDeskPortal() {
  const [tab, setTab] = useState<ShopTab>("inventory")

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
        </TabsList>
      </Tabs>

      {tab === "inventory" && <ShowroomInventoryScreen />}
      {tab === "other" && <OtherBranchesScreen />}
      {tab === "catalogue" && <CatalogueScreen />}
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { MapPin, Package, ShoppingCart, Store, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  shopCategories,
  type ShopCategory,
  type ShopItem,
} from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { SellCheckoutDialog } from "@/components/shop/sell-checkout-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

type Filter = "Available" | "Sold" | "All"

const FILTERS: Filter[] = ["Available", "Sold", "All"]

export function ShowroomInventoryScreen() {
  const { activeBranch } = useBranch()
  const { items } = useShowroom()
  const [filter, setFilter] = useState<Filter>("Available")
  const [category, setCategory] = useState<ShopCategory | "All">("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Front Desk only ever sees its own branch's stock.
  const branchItems = useMemo(
    () => items.filter((i) => i.branchId === activeBranch.id),
    [items, activeBranch.id]
  )

  const visibleItems = useMemo(() => {
    return branchItems.filter((i) => {
      if (filter !== "All" && i.status !== filter) return false
      if (category !== "All" && i.category !== category) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !i.name.toLowerCase().includes(q) &&
          !i.id.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [branchItems, filter, category, search])

  const availableCount = branchItems.filter(
    (i) => i.status === "Available"
  ).length

  const selectedItems = useMemo(
    () => branchItems.filter((i) => selected.has(i.id)),
    [branchItems, selected]
  )
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.price, 0)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Store className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Showroom inventory
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Every piece is a single unit at a fixed price. Select one to sell
              on its own, or tick several to sell them together as a set.{" "}
              {availableCount} available now.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5 self-start">
          <MapPin className="size-3.5" />
          Branch {activeBranch.code} — {activeBranch.name}
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="h-9 max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant={category === "All" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCategory("All")}
            >
              All
            </Button>
            {shopCategories.map((c) => (
              <Button
                key={c}
                variant={category === c ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              No items match your filters at {activeBranch.name}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => {
            const sellable = item.status === "Available"
            const isSelected = selected.has(item.id)
            return (
              <Card
                key={item.id}
                className={cn(
                  "flex flex-col transition-colors",
                  !sellable && "opacity-70",
                  isSelected && "border-primary ring-1 ring-primary"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.id}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border",
                        sellable
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    {sellable && (
                      <Checkbox
                        id={`pick-${item.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggle(item.id)}
                        className="mt-1"
                        aria-label={`Select ${item.name}`}
                      />
                    )}
                    <div className="space-y-0.5">
                      <label
                        htmlFor={`pick-${item.id}`}
                        className="text-base font-medium leading-tight text-balance"
                      >
                        {item.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <span className="text-2xl font-semibold tabular-nums">
                    ${item.price.toLocaleString()}
                  </span>
                </CardContent>
                <CardFooter>
                  {sellable ? (
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                      className="w-full"
                      onClick={() => toggle(item.id)}
                    >
                      {isSelected ? "Selected" : "Add to sale"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sold{item.soldAt ? ` · ${item.soldAt.slice(0, 10)}` : ""}
                    </span>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <X className="size-4" />
              </Button>
              <div className="text-sm">
                <span className="font-medium">
                  {selectedItems.length}{" "}
                  {selectedItems.length === 1 ? "item" : "items"} selected
                </span>
                <span className="ml-2 text-muted-foreground">
                  {selectedItems.length > 1 ? "Sell as a set" : "Single sale"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold tabular-nums">
                ${selectedTotal.toLocaleString()}
              </span>
              <Button onClick={() => setCheckoutOpen(true)} className="gap-1.5">
                <ShoppingCart className="size-4" />
                Sell {selectedItems.length > 1 ? "as set" : "item"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <SellCheckoutDialog
        items={selectedItems}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSold={clearSelection}
      />
    </div>
  )
}

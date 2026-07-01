"use client"

import { useMemo, useState } from "react"
import { Eye, Globe, MapPin, PackageSearch } from "lucide-react"

import { shopCategories, type ShopCategory } from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function OtherBranchesScreen() {
  const { activeBranch, branches } = useBranch()
  const { items } = useShowroom()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<ShopCategory | "All">("All")

  // Read-only: every Available unit that lives at another branch.
  const otherItems = useMemo(
    () =>
      items.filter(
        (i) => i.branchId !== activeBranch.id && i.status === "Available"
      ),
    [items, activeBranch.id]
  )

  const matches = useMemo(() => {
    return otherItems.filter((i) => {
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
  }, [otherItems, search, category])

  // Group matches under their owning branch for a scannable layout.
  const groups = useMemo(
    () =>
      branches
        .filter((b) => b.id !== activeBranch.id)
        .map((b) => ({
          branch: b,
          items: matches.filter((i) => i.branchId === b.id),
        }))
        .filter((g) => g.items.length > 0),
    [branches, activeBranch.id, matches]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Globe className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Check other branches
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Search stock at other showrooms. If a customer wants a piece held
              elsewhere, direct them to that branch to pay and collect — stock
              is never moved between branches.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5 self-start">
          <Eye className="size-3.5" />
          Read-only
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all other branches…"
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

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageSearch className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              No matching stock at other branches right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <section key={group.branch.id} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin className="size-3.5" />
              Branch {group.branch.code} — {group.branch.name} (
              {group.items.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.id}
                      </span>
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                    <CardTitle className="text-base text-balance">
                      {item.name}
                    </CardTitle>
                    <CardDescription>
                      Available at {group.branch.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-end">
                    <span className="text-2xl font-semibold tabular-nums">
                      ${item.price.toLocaleString()}
                    </span>
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground text-pretty">
                      Direct the customer to {group.branch.name} to pay and
                      collect.
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { BookOpen, Search } from "lucide-react"

import {
  shopCategories,
  type CatalogueProduct,
  type ShopCategory,
} from "@/lib/mock-data"
import { useCatalogue } from "@/components/shop/catalogue-store"
import { NewQuoteDialog } from "@/components/shop/new-quote-dialog"
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

export function CatalogueScreen({
  showQuoteAction = true,
}: {
  /** Front Desk can start a quote; the Director view is reference-only. */
  showQuoteAction?: boolean
}) {
  const { products } = useCatalogue()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<ShopCategory | "All">("All")
  const [quoteProduct, setQuoteProduct] = useState<CatalogueProduct | null>(
    null
  )

  const matches = useMemo(() => {
    return products.filter((c) => {
      if (category !== "All" && c.category !== category) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.description.toLowerCase().includes(q) &&
          !c.category.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [products, search, category])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <BookOpen className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Custom-piece catalogue
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Reference price ranges for bespoke builds. Use these to guide
            bargaining — this is separate from showroom stock, which carries
            fixed per-unit prices.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the catalogue…"
            className="h-9 pl-8"
          />
        </div>
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

      {matches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              No catalogue products match your search.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {product.id}
                  </span>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                <CardTitle className="text-base text-balance">
                  {product.name}
                </CardTitle>
                <CardDescription className="text-pretty">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end">
                <span className="text-xs text-muted-foreground">
                  Reference range
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  ${product.minPrice.toLocaleString()} – $
                  {product.maxPrice.toLocaleString()}
                </span>
              </CardContent>
              {showQuoteAction && (
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setQuoteProduct(product)}
                  >
                    Start quote
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {showQuoteAction && (
        <NewQuoteDialog
          product={quoteProduct ?? undefined}
          open={quoteProduct !== null}
          onOpenChange={(v) => {
            if (!v) setQuoteProduct(null)
          }}
        />
      )}
    </div>
  )
}

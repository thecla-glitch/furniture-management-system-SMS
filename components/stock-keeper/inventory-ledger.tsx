"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddItemDialog } from "@/components/stock-keeper/add-item-dialog"
import { useStock } from "@/components/stock-keeper/stock-store"
import type { InventoryItem } from "@/lib/mock-data"

/** Inline numeric editor that commits to the store on blur. */
function EditableNumber({
  value,
  onCommit,
  step = "1",
  prefix,
}: {
  value: number
  onCommit: (next: number) => void
  step?: string
  prefix?: string
}) {
  const [draft, setDraft] = useState(String(value))

  // Keep the field in sync when the underlying value changes elsewhere.
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  function commit() {
    const parsed = Number.parseFloat(draft)
    if (Number.isNaN(parsed) || parsed < 0) {
      setDraft(String(value))
      return
    }
    if (parsed !== value) onCommit(parsed)
  }

  return (
    <div className="flex items-center gap-1">
      {prefix && (
        <span className="text-xs text-muted-foreground">{prefix}</span>
      )}
      <Input
        type="number"
        min="0"
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
        className="h-8 w-20 tabular-nums"
        aria-label="Edit value"
      />
    </div>
  )
}

function LedgerRow({ item }: { item: InventoryItem }) {
  const { updateItem } = useStock()
  const low = item.quantity <= item.reorderLevel

  return (
    <TableRow
      className={cn(
        low &&
          "bg-destructive/5 hover:bg-destructive/10 data-[state=selected]:bg-destructive/10"
      )}
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          <span className="text-xs text-muted-foreground">{item.category}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
      <TableCell>
        <EditableNumber
          value={item.quantity}
          onCommit={(next) => updateItem(item.id, { quantity: next })}
        />
      </TableCell>
      <TableCell>
        <EditableNumber
          value={item.unitCost}
          step="0.01"
          prefix="$"
          onCommit={(next) => updateItem(item.id, { unitCost: next })}
        />
      </TableCell>
      <TableCell>
        <EditableNumber
          value={item.reorderLevel}
          onCommit={(next) => updateItem(item.id, { reorderLevel: next })}
        />
      </TableCell>
      <TableCell className="text-right">
        {low ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="size-3" />
            Low stock
          </Badge>
        ) : (
          <Badge variant="secondary">In stock</Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

export function InventoryLedger() {
  const { items, lowStockCount } = useStock()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {items.length} materials tracked
          </span>
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3" />
              {lowStockCount} low
            </Badge>
          )}
        </div>
        <AddItemDialog />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Price / unit</TableHead>
              <TableHead>Low-stock level</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <LedgerRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: edit on-hand quantity, price, or low-stock level directly in the
        table. Rows at or below their threshold are flagged in red.
      </p>
    </div>
  )
}

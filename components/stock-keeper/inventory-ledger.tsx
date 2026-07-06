"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Search, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { InventoryCategory, InventoryItem } from "@/lib/mock-data"
import { toast } from "sonner"

// --------------------------------------------------------------------------
// Inline editable number cell
// --------------------------------------------------------------------------

function EditableNumber({
  value,
  onCommit,
  step = "1",
  prefix,
  min = "0",
}: {
  value: number
  onCommit: (next: number) => void
  step?: string
  prefix?: string
  min?: string
}) {
  const [draft, setDraft] = useState(String(value))

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
        min={min}
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

// --------------------------------------------------------------------------
// Delete confirmation dialog
// --------------------------------------------------------------------------

function DeleteItemDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
}: {
  item: InventoryItem | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove material</DialogTitle>
          <DialogDescription>
            <strong>{item?.name}</strong> will be permanently removed from the
            ledger. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --------------------------------------------------------------------------
// Row
// --------------------------------------------------------------------------

function LedgerRow({
  item,
  onDelete,
}: {
  item: InventoryItem
  onDelete: (item: InventoryItem) => void
}) {
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
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${item.name}`}
          onClick={() => onDelete(item)}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

// --------------------------------------------------------------------------
// Main component
// --------------------------------------------------------------------------

const CATEGORIES: Array<InventoryCategory | "All"> = [
  "All",
  "Wood",
  "Hardware",
  "Upholstery",
  "Finishing",
  "Adhesive",
]

export function InventoryLedger() {
  const { items, lowStockCount, deleteItem } = useStock()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<InventoryCategory | "All">("All")
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((item) => {
      const matchCat = category === "All" || item.category === category
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [items, search, category])

  function handleDelete() {
    if (!deleteTarget) return
    deleteItem(deleteTarget.id)
    toast.success(`${deleteTarget.name} removed from ledger.`)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 w-48 pl-8"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            items={Object.fromEntries(CATEGORIES.map((c) => [c, c]))}
            value={category}
            onValueChange={(v) => setCategory(v as InventoryCategory | "All")}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filtered.length} of {items.length}
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="ml-2 gap-1">
                <AlertTriangle className="size-3" />
                {lowStockCount} low
              </Badge>
            )}
          </span>
        </div>
        <AddItemDialog />
      </div>

      {/* Table */}
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
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No materials match your filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <LedgerRow
                  key={item.id}
                  item={item}
                  onDelete={setDeleteTarget}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Edit on-hand quantity, unit price, or low-stock level directly in the
        table. Rows at or below their threshold are flagged in red.
      </p>

      <DeleteItemDialog
        item={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

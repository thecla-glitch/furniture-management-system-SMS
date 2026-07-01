"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  PackageSearch,
  Plus,
  RotateCcw,
  Trash2,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStock } from "@/components/stock-keeper/stock-store"
import type { Reorder } from "@/lib/mock-data"

// --------------------------------------------------------------------------
// Status badge
// --------------------------------------------------------------------------

const statusStyles: Record<
  Reorder["status"],
  { variant: "outline" | "secondary" | "destructive"; label: string }
> = {
  Raised: { variant: "outline", label: "Raised" },
  Ordered: { variant: "secondary", label: "Ordered" },
  Received: { variant: "secondary", label: "Received" },
}

function StatusBadge({ status }: { status: Reorder["status"] }) {
  const s = statusStyles[status]
  return (
    <Badge
      variant={s.variant}
      className={cn(
        status === "Ordered" && "border-primary/50 bg-primary/10 text-primary",
        status === "Received" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      )}
    >
      {status === "Received" && <Check className="mr-1 size-3" />}
      {status === "Ordered" && <Truck className="mr-1 size-3" />}
      {s.label}
    </Badge>
  )
}

// --------------------------------------------------------------------------
// Receive dialog
// --------------------------------------------------------------------------

function ReceiveDialog({
  reorder,
  open,
  onOpenChange,
}: {
  reorder: Reorder | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { receiveReorder } = useStock()
  const [qty, setQty] = useState("")

  const canSubmit = Number.parseFloat(qty) > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reorder || !canSubmit) return
    const received = Number.parseFloat(qty)
    receiveReorder(reorder.id, received)
    toast.success(`Stock received for ${reorder.materialName}`, {
      description: `${received} ${reorder.unit} added to on-hand balance.`,
    })
    setQty("")
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setQty("")
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Receive stock</DialogTitle>
          <DialogDescription>
            Enter the quantity of{" "}
            <strong>{reorder?.materialName}</strong> physically received. This
            will be added to the on-hand balance in the ledger.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="receive-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="receive-qty">
                Quantity received ({reorder?.unit})
              </FieldLabel>
              <Input
                id="receive-qty"
                type="number"
                min="0.01"
                step="any"
                placeholder={`Ordered: ${reorder?.qtyOrdered ?? 0}`}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="receive-form" disabled={!canSubmit}>
            Confirm receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --------------------------------------------------------------------------
// Mark-ordered dialog
// --------------------------------------------------------------------------

function MarkOrderedDialog({
  reorder,
  open,
  onOpenChange,
}: {
  reorder: Reorder | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { markOrdered } = useStock()
  const [note, setNote] = useState(reorder?.supplierNote ?? "")

  function handleConfirm() {
    if (!reorder) return
    markOrdered(reorder.id, note.trim() || undefined)
    toast.success(`Reorder for ${reorder.materialName} marked as ordered.`)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setNote("")
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as ordered</DialogTitle>
          <DialogDescription>
            Confirm that the order for{" "}
            <strong>{reorder?.materialName}</strong> has been placed with the
            supplier.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="supplier-note">
              Supplier note (optional)
            </FieldLabel>
            <Input
              id="supplier-note"
              placeholder="e.g. Timber House Ltd"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Truck className="size-4" />
            Confirm order placed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --------------------------------------------------------------------------
// Raise reorder dialog
// --------------------------------------------------------------------------

function RaiseReorderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { items, raiseReorder } = useStock()
  const [inventoryItemId, setInventoryItemId] = useState("")
  const [qtyOrdered, setQtyOrdered] = useState("")
  const [supplierNote, setSupplierNote] = useState("")

  const selected = useMemo(
    () => items.find((i) => i.id === inventoryItemId),
    [items, inventoryItemId]
  )
  const itemsMap = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, `${i.name} (${i.unit})`])),
    [items]
  )

  const canSubmit =
    !!inventoryItemId && Number.parseFloat(qtyOrdered) > 0

  function reset() {
    setInventoryItemId("")
    setQtyOrdered("")
    setSupplierNote("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !selected) return
    raiseReorder({
      inventoryItemId: selected.id,
      materialName: selected.name,
      unit: selected.unit,
      qtyOnHand: selected.quantity,
      reorderLevel: selected.reorderLevel,
      qtyOrdered: Number.parseFloat(qtyOrdered),
      supplierNote: supplierNote.trim() || undefined,
    })
    toast.success(`Reorder raised for ${selected.name}`, {
      description: `${qtyOrdered} ${selected.unit} requested.`,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raise reorder</DialogTitle>
          <DialogDescription>
            Create a new purchase request for a material that is running low.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="raise-reorder-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reorder-item">Material</FieldLabel>
              <Select
                items={itemsMap}
                value={inventoryItemId}
                onValueChange={(v) => setInventoryItemId(v ?? "")}
              >
                <SelectTrigger id="reorder-item" className="w-full">
                  <SelectValue placeholder="Select a material..." />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span>{item.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.quantity} {item.unit} on hand
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {selected && (
              <p className="text-xs text-muted-foreground">
                On hand: <strong>{selected.quantity} {selected.unit}</strong> — threshold:{" "}
                <strong>{selected.reorderLevel} {selected.unit}</strong>
              </p>
            )}
            <Field orientation="responsive">
              <Field>
                <FieldLabel htmlFor="reorder-qty">
                  Quantity to order ({selected?.unit ?? "units"})
                </FieldLabel>
                <Input
                  id="reorder-qty"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0"
                  value={qtyOrdered}
                  onChange={(e) => setQtyOrdered(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reorder-supplier">
                  Supplier note (optional)
                </FieldLabel>
                <Input
                  id="reorder-supplier"
                  placeholder="e.g. Timber House Ltd"
                  value={supplierNote}
                  onChange={(e) => setSupplierNote(e.target.value)}
                />
              </Field>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
            Cancel
          </Button>
          <Button type="submit" form="raise-reorder-form" disabled={!canSubmit}>
            <RotateCcw className="size-4" />
            Raise reorder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --------------------------------------------------------------------------
// Reorder row
// --------------------------------------------------------------------------

function ReorderRow({
  reorder,
  onMarkOrdered,
  onReceive,
  onDelete,
}: {
  reorder: Reorder
  onMarkOrdered: (r: Reorder) => void
  onReceive: (r: Reorder) => void
  onDelete: (r: Reorder) => void
}) {
  const received = reorder.status === "Received"
  return (
    <TableRow className={cn(received && "opacity-60")}>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-mono text-xs text-muted-foreground">
            {reorder.id}
          </span>
          <span className="font-medium">{reorder.materialName}</span>
          {reorder.supplierNote && (
            <span className="text-xs text-muted-foreground">
              {reorder.supplierNote}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        <span
          className={cn(
            reorder.qtyOnHand <= reorder.reorderLevel &&
              reorder.status !== "Received" &&
              "text-destructive"
          )}
        >
          {reorder.qtyOnHand}
        </span>{" "}
        / {reorder.reorderLevel} {reorder.unit}
      </TableCell>
      <TableCell className="tabular-nums font-medium">
        {reorder.qtyOrdered} {reorder.unit}
      </TableCell>
      <TableCell>
        <StatusBadge status={reorder.status} />
      </TableCell>
      <TableCell className="text-xs tabular-nums text-muted-foreground">
        {reorder.receivedAt ?? reorder.orderedAt ?? reorder.raisedAt}
      </TableCell>
      <TableCell>
        {reorder.qtyReceived !== undefined && (
          <span className="text-sm tabular-nums text-muted-foreground">
            {reorder.qtyReceived} {reorder.unit} received
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {reorder.status === "Raised" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkOrdered(reorder)}
            >
              <Truck className="size-3.5" />
              Mark ordered
            </Button>
          )}
          {reorder.status === "Ordered" && (
            <Button size="sm" onClick={() => onReceive(reorder)}>
              <Check className="size-3.5" />
              Receive
            </Button>
          )}
          {!received && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label={`Delete reorder ${reorder.id}`}
              onClick={() => onDelete(reorder)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

// --------------------------------------------------------------------------
// Main screen
// --------------------------------------------------------------------------

type ReorderTab = "active" | "received" | "suggestions"

export function ReordersScreen() {
  const { items, reorders, deleteReorder } = useStock()
  const [tab, setTab] = useState<ReorderTab>("active")
  const [raiseOpen, setRaiseOpen] = useState(false)
  const [markOrderedTarget, setMarkOrderedTarget] = useState<Reorder | null>(null)
  const [receiveTarget, setReceiveTarget] = useState<Reorder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Reorder | null>(null)

  const active = reorders.filter((r) => r.status !== "Received")
  const received = reorders.filter((r) => r.status === "Received")

  // Materials at or below reorder level that have no open reorder.
  const openReorderIds = new Set(
    active.map((r) => r.inventoryItemId)
  )
  const suggestions = useMemo(
    () =>
      items.filter(
        (i) => i.quantity <= i.reorderLevel && !openReorderIds.has(i.id)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, reorders]
  )

  function handleDelete() {
    if (!deleteTarget) return
    deleteReorder(deleteTarget.id)
    toast.success(`Reorder ${deleteTarget.id} removed.`)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Track purchase requests from raised through ordered to received.
          Receiving stock automatically credits the inventory ledger.
        </p>
        <Button onClick={() => setRaiseOpen(true)}>
          <Plus className="size-4" />
          Raise reorder
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReorderTab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="active" className="gap-1.5">
            Active
            {active.length > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-1.5">
            Received
            {received.length > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {received.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1.5">
            Suggestions
            {suggestions.length > 0 && (
              <span className="rounded-full bg-destructive/20 px-1.5 text-xs font-medium text-destructive tabular-nums">
                {suggestions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Active reorders */}
      {tab === "active" && (
        <div className="overflow-hidden rounded-lg border border-border">
          {active.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <PackageSearch className="size-8 text-muted-foreground" />
                <EmptyTitle>No active reorders</EmptyTitle>
                <EmptyDescription>
                  Use the &ldquo;Raise reorder&rdquo; button to create a
                  purchase request for any material running low.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>On hand / threshold</TableHead>
                  <TableHead>Qty ordered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((r) => (
                  <ReorderRow
                    key={r.id}
                    reorder={r}
                    onMarkOrdered={setMarkOrderedTarget}
                    onReceive={setReceiveTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Received */}
      {tab === "received" && (
        <div className="overflow-hidden rounded-lg border border-border">
          {received.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No received reorders</EmptyTitle>
                <EmptyDescription>
                  Reorders marked as received will appear here with the quantity
                  credited.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>On hand / threshold</TableHead>
                  <TableHead>Qty ordered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Qty received</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {received.map((r) => (
                  <ReorderRow
                    key={r.id}
                    reorder={r}
                    onMarkOrdered={setMarkOrderedTarget}
                    onReceive={setReceiveTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Suggestions */}
      {tab === "suggestions" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Materials below their threshold with no active reorder — consider
            raising one.
          </p>
          {suggestions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No suggestions</EmptyTitle>
                <EmptyDescription>
                  All low-stock materials already have an active reorder in
                  progress.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>On hand</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.category}
                      </TableCell>
                      <TableCell className="tabular-nums text-destructive">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          {item.quantity} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {item.reorderLevel} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRaiseOpen(true)}
                        >
                          <RotateCcw className="size-3.5" />
                          Raise reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <RaiseReorderDialog open={raiseOpen} onOpenChange={setRaiseOpen} />
      <MarkOrderedDialog
        reorder={markOrderedTarget}
        open={!!markOrderedTarget}
        onOpenChange={(v) => !v && setMarkOrderedTarget(null)}
      />
      <ReceiveDialog
        reorder={receiveTarget}
        open={!!receiveTarget}
        onOpenChange={(v) => !v && setReceiveTarget(null)}
      />

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete reorder</DialogTitle>
            <DialogDescription>
              Reorder <strong>{deleteTarget?.id}</strong> for{" "}
              <strong>{deleteTarget?.materialName}</strong> will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

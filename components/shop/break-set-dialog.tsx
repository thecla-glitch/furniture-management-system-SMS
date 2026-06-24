"use client"

import { useEffect, useMemo, useState } from "react"
import { Scissors } from "lucide-react"
import { toast } from "sonner"

import {
  getShowroomSetById,
  type PartialSaleRequest,
} from "@/lib/mock-data"
import {
  useShowroom,
  type RemainingDecision,
} from "@/components/shop/showroom-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RemainingAction = "keep" | "reprice" | "hold"

const ACTION_LABELS: Record<RemainingAction, string> = {
  keep: "Keep price → standalone",
  reprice: "Reprice → standalone",
  hold: "Mark Hold (withhold)",
}

export function BreakSetDialog({ request }: { request: PartialSaleRequest }) {
  const { breakSet } = useShowroom()
  const [open, setOpen] = useState(false)

  const set = getShowroomSetById(request.setId)

  // Components still on the floor (a previous break may have removed some).
  const liveComponents = useMemo(
    () =>
      set ? set.components.filter((c) => c.componentStatus === "Available") : [],
    [set]
  )

  const [soldSelected, setSoldSelected] = useState<Record<string, boolean>>({})
  const [soldPrices, setSoldPrices] = useState<Record<string, string>>({})
  const [actions, setActions] = useState<Record<string, RemainingAction>>({})
  const [repriced, setRepriced] = useState<Record<string, string>>({})

  // Initialise from the request whenever the dialog opens.
  useEffect(() => {
    if (!open || !set) return
    const requested = new Set(request.componentIds)
    const soldInit: Record<string, boolean> = {}
    const priceInit: Record<string, string> = {}
    const actionInit: Record<string, RemainingAction> = {}
    const repriceInit: Record<string, string> = {}
    for (const c of liveComponents) {
      soldInit[c.id] = requested.has(c.id)
      priceInit[c.id] = String(c.individualPrice)
      actionInit[c.id] = "keep"
      repriceInit[c.id] = String(c.individualPrice)
    }
    setSoldSelected(soldInit)
    setSoldPrices(priceInit)
    setActions(actionInit)
    setRepriced(repriceInit)
  }, [open, set, request.componentIds, liveComponents])

  if (!set) return null

  const soldIds = liveComponents.filter((c) => soldSelected[c.id]).map((c) => c.id)
  const remainingComponents = liveComponents.filter((c) => !soldSelected[c.id])

  const soldTotal = soldIds.reduce(
    (sum, id) => sum + (Number.parseFloat(soldPrices[id]) || 0),
    0
  )

  // At least one sold, and at least one component left over (else it's a full sale).
  const canApprove =
    soldIds.length > 0 && soldIds.length < liveComponents.length

  function handleApprove() {
    if (!canApprove || !set) return

    const soldPriceMap: Record<string, number> = {}
    for (const id of soldIds) {
      soldPriceMap[id] = Number.parseFloat(soldPrices[id]) || 0
    }

    const remaining: RemainingDecision[] = remainingComponents.map((c) => {
      const action = actions[c.id] ?? "keep"
      const price =
        action === "reprice"
          ? Number.parseFloat(repriced[c.id]) || c.individualPrice
          : c.individualPrice
      return { componentId: c.id, action, price }
    })

    breakSet({
      requestId: request.id,
      setId: set.id,
      soldPrices: soldPriceMap,
      remaining,
    })

    toast.success("Set broken", {
      description: `${set.id} broken — ${soldIds.length} sold, ${remainingComponents.length} remaining as standalone items.`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Scissors data-icon="inline-start" />
            Review &amp; break set
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Break set — {set.id}</DialogTitle>
          <DialogDescription>
            {set.name} · requested by {request.customerName}. Confirm the sale
            and decide what happens to the rest. The original full-set price ($
            {set.fullSetPrice.toLocaleString()}) and component prices are kept in
            history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Components being sold</p>
            <div className="flex flex-col gap-1 rounded-lg border">
              {liveComponents.map((comp) => {
                const isSold = !!soldSelected[comp.id]
                return (
                  <div
                    key={comp.id}
                    className="flex items-center gap-3 px-3 py-2.5 not-last:border-b"
                  >
                    <Checkbox
                      id={`sold-${comp.id}`}
                      checked={isSold}
                      onCheckedChange={(v) =>
                        setSoldSelected((prev) => ({
                          ...prev,
                          [comp.id]: !!v,
                        }))
                      }
                    />
                    <label
                      htmlFor={`sold-${comp.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {comp.label}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {comp.id}
                      </span>
                    </label>
                    {isSold ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          aria-label={`Sale price for ${comp.label}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={soldPrices[comp.id] ?? ""}
                          onChange={(e) =>
                            setSoldPrices((prev) => ({
                              ...prev,
                              [comp.id]: e.target.value,
                            }))
                          }
                          className="h-8 w-24"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        list ${comp.individualPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Sold subtotal:{" "}
              <span className="font-medium tabular-nums text-foreground">
                ${soldTotal.toLocaleString()}
              </span>
            </p>
          </div>

          {remainingComponents.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">
                  Remaining components ({remainingComponents.length})
                </p>
                {remainingComponents.map((comp) => {
                  const action = actions[comp.id] ?? "keep"
                  return (
                    <div
                      key={comp.id}
                      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {comp.label}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {comp.id} · list $
                          {comp.individualPrice.toLocaleString()}
                        </p>
                      </div>
                      <Field className="w-48">
                        <FieldLabel className="text-xs">Decision</FieldLabel>
                        <Select
                          items={ACTION_LABELS}
                          value={action}
                          onValueChange={(v) =>
                            setActions((prev) => ({
                              ...prev,
                              [comp.id]: v as RemainingAction,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.keys(ACTION_LABELS) as RemainingAction[]
                            ).map((a) => (
                              <SelectItem key={a} value={a}>
                                {ACTION_LABELS[a]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      {action === "reprice" && (
                        <Field className="w-28">
                          <FieldLabel className="text-xs">New price</FieldLabel>
                          <Input
                            aria-label={`New price for ${comp.label}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={repriced[comp.id] ?? ""}
                            onChange={(e) =>
                              setRepriced((prev) => ({
                                ...prev,
                                [comp.id]: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {!canApprove && soldIds.length >= liveComponents.length && (
            <p className="text-sm text-destructive">
              You have selected every component. Leave at least one remaining,
              or process this as a full-set sale instead.
            </p>
          )}

          <DialogFooter className="mt-1">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" onClick={handleApprove} disabled={!canApprove}>
              Approve &amp; break set
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

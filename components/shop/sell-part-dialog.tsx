"use client"

import { useEffect, useState } from "react"
import { Scissors } from "lucide-react"
import { toast } from "sonner"

import type { ShowroomSet } from "@/lib/mock-data"
import { useShowroom } from "@/components/shop/showroom-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"

export function SellPartDialog({ set }: { set: ShowroomSet }) {
  const { requestPartialSale } = useShowroom()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [customerName, setCustomerName] = useState("")
  const [contact, setContact] = useState("")

  // Only components still on the floor can be requested.
  const availableComponents = set.components.filter(
    (c) => c.componentStatus === "Available"
  )

  useEffect(() => {
    if (open) {
      setSelected({})
      setCustomerName("")
      setContact("")
    }
  }, [open])

  const selectedIds = availableComponents
    .filter((c) => selected[c.id])
    .map((c) => c.id)

  const selectedTotal = availableComponents
    .filter((c) => selected[c.id])
    .reduce((sum, c) => sum + c.individualPrice, 0)

  // Requesting every available piece would empty the set — that is a full sale.
  const isWholeSet =
    selectedIds.length > 0 &&
    selectedIds.length === availableComponents.length

  const canSubmit =
    selectedIds.length > 0 &&
    !isWholeSet &&
    customerName.trim().length > 0 &&
    contact.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    requestPartialSale({
      setId: set.id,
      branchId: set.branchId,
      componentIds: selectedIds,
      customerName,
      contact,
    })

    toast.success("Partial sale request sent to Director for approval.", {
      description: `${selectedIds.length} component${
        selectedIds.length === 1 ? "" : "s"
      } from ${set.id} for ${customerName.trim()}.`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Scissors data-icon="inline-start" />
            Sell part of this set
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request partial sale — {set.id}</DialogTitle>
          <DialogDescription>
            Pick the components the customer wants. The Director must approve
            before the set is broken up. No stock moves yet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Components to sell</FieldLabel>
            <div className="flex flex-col gap-1 rounded-lg border">
              {availableComponents.map((comp) => (
                <label
                  key={comp.id}
                  htmlFor={`pick-${comp.id}`}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 not-last:border-b hover:bg-muted/50"
                >
                  <Checkbox
                    id={`pick-${comp.id}`}
                    checked={!!selected[comp.id]}
                    onCheckedChange={(v) =>
                      setSelected((prev) => ({ ...prev, [comp.id]: !!v }))
                    }
                  />
                  <span className="flex-1 text-sm">{comp.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {comp.id}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    ${comp.individualPrice.toLocaleString()}
                  </span>
                </label>
              ))}
            </div>
            {isWholeSet ? (
              <FieldDescription className="text-destructive">
                That is every available piece — use “Sell set” for a full-set
                sale instead.
              </FieldDescription>
            ) : (
              <FieldDescription>
                {selectedIds.length} selected · estimated $
                {selectedTotal.toLocaleString()}
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="partial-customer">Customer name</FieldLabel>
            <Input
              id="partial-customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Yakubu Garba"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="partial-contact">Contact</FieldLabel>
            <Input
              id="partial-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
            />
          </Field>

          <DialogFooter className="mt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

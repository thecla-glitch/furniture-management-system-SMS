"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock } from "lucide-react"
import { toast } from "sonner"

import type { ShowroomSet } from "@/lib/mock-data"
import { useShowroom } from "@/components/shop/showroom-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function ReserveSetDialog({ set }: { set: ShowroomSet }) {
  const { reserveSet } = useShowroom()
  const [open, setOpen] = useState(false)

  // Default the expiry to two weeks out for convenience.
  const defaultExpiry = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  }, [])

  const [customerName, setCustomerName] = useState("")
  const [contact, setContact] = useState("")
  const [deposit, setDeposit] = useState("")
  const [expiresAt, setExpiresAt] = useState(defaultExpiry)

  useEffect(() => {
    if (open) {
      setCustomerName("")
      setContact("")
      setDeposit("")
      setExpiresAt(defaultExpiry)
    }
  }, [open, defaultExpiry])

  const depositValue = Number.parseFloat(deposit) || 0
  const canSubmit =
    customerName.trim().length > 0 &&
    contact.trim().length > 0 &&
    depositValue > 0 &&
    expiresAt.length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    reserveSet({
      setId: set.id,
      customerName,
      contact,
      depositPaid: depositValue,
      expiresAt,
    })

    toast.success("Set reserved", {
      description: `${set.name} (${set.id}) held for ${customerName.trim()} until ${expiresAt}.`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <CalendarClock data-icon="inline-start" />
            Reserve
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve set — {set.id}</DialogTitle>
          <DialogDescription>
            {set.name} · ${set.fullSetPrice.toLocaleString()}. Reserving holds
            it against a deposit and removes it from the sellable floor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="reserve-customer">Customer name</FieldLabel>
            <Input
              id="reserve-customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Halima Abdullahi"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="reserve-contact">Contact</FieldLabel>
            <Input
              id="reserve-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
            />
          </Field>
          <Field orientation="responsive">
            <Field>
              <FieldLabel htmlFor="reserve-deposit">Deposit paid</FieldLabel>
              <Input
                id="reserve-deposit"
                type="number"
                min="0"
                step="0.01"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="reserve-expiry">Hold expires</FieldLabel>
              <Input
                id="reserve-expiry"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </Field>
          </Field>
          <FieldDescription>
            The set returns to Available if the hold is released or expires.
          </FieldDescription>

          <DialogFooter className="mt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Reserve set
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

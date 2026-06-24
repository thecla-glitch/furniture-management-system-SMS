"use client"

import { useEffect, useState } from "react"
import { Lock, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import {
  getBranchById,
  type PaymentMethod,
  type ShowroomSet,
} from "@/lib/mock-data"
import { useShowroom } from "@/components/shop/showroom-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Card",
  "Bank Transfer",
  "Mobile Money",
]

export function SellSetDialog({ set }: { set: ShowroomSet }) {
  const { sellFullSet } = useShowroom()
  const [open, setOpen] = useState(false)

  const canDiscount = getBranchById(set.branchId)?.discountAuthority ?? false

  const [customerName, setCustomerName] = useState("")
  const [contact, setContact] = useState("")
  const [salePrice, setSalePrice] = useState(String(set.fullSetPrice))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash")
  const [amountReceived, setAmountReceived] = useState("")

  // Reset the form whenever the dialog re-opens for this set.
  useEffect(() => {
    if (open) {
      setCustomerName("")
      setContact("")
      setSalePrice(String(set.fullSetPrice))
      setPaymentMethod("Cash")
      setAmountReceived("")
    }
  }, [open, set.fullSetPrice])

  const paymentItems = Object.fromEntries(PAYMENT_METHODS.map((m) => [m, m]))

  const price = Number.parseFloat(salePrice) || 0
  const received = Number.parseFloat(amountReceived) || 0
  const balance = price - received

  const canSubmit =
    customerName.trim().length > 0 &&
    contact.trim().length > 0 &&
    price > 0 &&
    received >= 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    sellFullSet({
      setId: set.id,
      customerName,
      contact,
      // Without discount authority the sale always books at list price.
      salePrice: canDiscount ? price : set.fullSetPrice,
      paymentMethod,
      amountReceived: received,
    })

    toast.success("Sale completed", {
      description: `${set.name} (${set.id}) sold to ${customerName.trim()}.`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <ShoppingCart data-icon="inline-start" />
            Sell set
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell full set — {set.id}</DialogTitle>
          <DialogDescription>
            {set.name} · list price ${set.fullSetPrice.toLocaleString()}. All{" "}
            {set.components.length} component
            {set.components.length === 1 ? "" : "s"} will be marked sold.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="sale-customer">Customer name</FieldLabel>
            <Input
              id="sale-customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Amina Yusuf"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sale-contact">Contact</FieldLabel>
            <Input
              id="sale-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="sale-price">
              Sale price
              {!canDiscount && (
                <Badge variant="secondary" className="ml-2 gap-1">
                  <Lock className="size-3" />
                  List price only
                </Badge>
              )}
            </FieldLabel>
            <Input
              id="sale-price"
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              readOnly={!canDiscount}
              disabled={!canDiscount}
            />
            <FieldDescription>
              {canDiscount
                ? "This branch may apply a discount from the list price."
                : "This branch has no discount authority — price is fixed."}
            </FieldDescription>
          </Field>

          <Field orientation="responsive">
            <Field>
              <FieldLabel>Payment method</FieldLabel>
              <Select
                items={paymentItems}
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="sale-received">Amount received</FieldLabel>
              <Input
                id="sale-received"
                type="number"
                min="0"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
              />
            </Field>
          </Field>

          {amountReceived !== "" && (
            <p className="text-sm text-muted-foreground">
              {balance > 0
                ? `Outstanding balance: $${balance.toLocaleString()}`
                : balance < 0
                  ? `Change due: $${Math.abs(balance).toLocaleString()}`
                  : "Paid in full."}
            </p>
          )}

          <DialogFooter className="mt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Complete sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

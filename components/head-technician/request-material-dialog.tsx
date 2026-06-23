"use client"

import { useState } from "react"
import { PackagePlus } from "lucide-react"
import { toast } from "sonner"

import type { Order, Technician } from "@/lib/mock-data"
import { useMaterialRequests } from "@/components/operations/material-requests-store"
import { Button } from "@/components/ui/button"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const UNITS = ["pcs", "boards", "sheets", "meters", "liters", "rolls", "pairs"]

export function RequestMaterialDialog({
  order,
  technician,
}: {
  order: Order
  technician: Technician
}) {
  const { addRequest } = useMaterialRequests()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("pcs")

  const quantityNum = Number.parseInt(quantity, 10)
  const valid = name.trim().length > 0 && quantityNum > 0

  function reset() {
    setName("")
    setQuantity("")
    setUnit("pcs")
  }

  function handleSubmit() {
    if (!valid) return
    addRequest({
      orderId: order.id,
      technicianId: technician.id,
      technicianName: technician.name,
      materialName: name.trim(),
      quantity: quantityNum,
      unit,
    })
    toast.success("Request sent for approval.", {
      description: `${quantityNum} ${unit} of ${name.trim()} for ${order.id}.`,
    })
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="h-11 w-full">
            <PackagePlus data-icon="inline-start" />
            Request materials
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request materials</DialogTitle>
          <DialogDescription>
            For {order.furnitureType} ({order.id}). Goes to the Operations
            Manager for approval.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="material-name">Material</FieldLabel>
            <Input
              id="material-name"
              className="h-11"
              placeholder="e.g. Brass Hinges"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <div className="flex gap-3">
            <Field className="flex-1">
              <FieldLabel htmlFor="material-qty">Quantity</FieldLabel>
              <Input
                id="material-qty"
                className="h-11"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field className="flex-1">
              <FieldLabel htmlFor="material-unit">Unit</FieldLabel>
              <select
                id="material-unit"
                className="h-11 rounded-md border border-input bg-background px-3 text-base"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FieldGroup>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="ghost" className="h-11">
                Cancel
              </Button>
            }
          />
          <Button className="h-11" onClick={handleSubmit} disabled={!valid}>
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

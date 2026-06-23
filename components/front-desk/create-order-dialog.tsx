"use client"

import { useRef, useState } from "react"
import { ImagePlus, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useOrders } from "@/components/front-desk/orders-store"

interface RefImage {
  id: string
  name: string
  url: string
}

const today = () => new Date().toISOString().slice(0, 10)

export function CreateOrderDialog() {
  const { addOrder } = useOrders()
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [customerName, setCustomerName] = useState("")
  const [contact, setContact] = useState("")
  const [furnitureType, setFurnitureType] = useState("")
  const [size, setSize] = useState("")
  const [quotedPrice, setQuotedPrice] = useState("")
  const [orderDate, setOrderDate] = useState(today())
  const [expectedDelivery, setExpectedDelivery] = useState("")
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [images, setImages] = useState<RefImage[]>([])
  const [dragActive, setDragActive] = useState(false)

  function resetForm() {
    setCustomerName("")
    setContact("")
    setFurnitureType("")
    setSize("")
    setQuotedPrice("")
    setOrderDate(today())
    setExpectedDelivery("")
    setRequiresApproval(false)
    setImages([])
  }

  function addMockImages(files: FileList | null) {
    // Mock only — we don't actually upload, just render thumbnails.
    const incoming: RefImage[] = []
    const count = files?.length ?? 1
    for (let i = 0; i < count; i++) {
      const file = files?.[i]
      const url = file ? URL.createObjectURL(file) : ""
      incoming.push({
        id: `${Date.now()}-${i}`,
        name: file?.name ?? `reference-${images.length + i + 1}.jpg`,
        url,
      })
    }
    setImages((prev) => [...prev, ...incoming])
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addOrder({
      customerName: customerName.trim(),
      contact: contact.trim(),
      furnitureType: furnitureType.trim(),
      size: size.trim(),
      quotedPrice: Number.parseFloat(quotedPrice) || 0,
      orderDate,
      expectedDelivery,
      requiresApproval,
      referenceImages: images.map((i) => i.url).filter(Boolean),
    })
    toast.success("Order created", {
      description: requiresApproval
        ? `${furnitureType} sent for Director approval.`
        : `${furnitureType} sent to the workshop.`,
    })
    resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus data-icon="inline-start" />
            New Order
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create new order</DialogTitle>
          <DialogDescription>
            Capture the customer&apos;s details and quote. The order is sent to
            the workshop unless it needs Director price approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="customerName">Customer name</FieldLabel>
              <Input
                id="customerName"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Amina Yusuf"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact">Contact</FieldLabel>
              <Input
                id="contact"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone or email"
              />
            </Field>

            <Field orientation="responsive">
              <Field>
                <FieldLabel htmlFor="furnitureType">Furniture type</FieldLabel>
                <Input
                  id="furnitureType"
                  required
                  value={furnitureType}
                  onChange={(e) => setFurnitureType(e.target.value)}
                  placeholder="e.g. 6-Seater Dining Table"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="size">Size / dimensions</FieldLabel>
                <Input
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 180 x 90 x 76 cm"
                />
              </Field>
            </Field>

            <Field>
              <FieldLabel htmlFor="quotedPrice">Quoted customer price</FieldLabel>
              <Input
                id="quotedPrice"
                type="number"
                min="0"
                step="0.01"
                required
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="0.00"
              />
            </Field>

            <Field orientation="responsive">
              <Field>
                <FieldLabel htmlFor="orderDate">Order date</FieldLabel>
                <Input
                  id="orderDate"
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="expectedDelivery">
                  Expected delivery
                </FieldLabel>
                <Input
                  id="expectedDelivery"
                  type="date"
                  required
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </Field>
            </Field>

            <Field>
              <FieldLabel htmlFor="reference-upload">Reference photos</FieldLabel>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(false)
                  addMockImages(e.dataTransfer.files)
                }}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-6 text-center transition-colors hover:bg-muted/70",
                  dragActive && "border-primary bg-primary/5"
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <ImagePlus className="size-4" />
                </span>
                <span className="text-sm font-medium">
                  Drag &amp; drop or click to add photos
                </span>
                <span className="text-xs text-muted-foreground">
                  Mock upload — thumbnails are shown locally only
                </span>
              </button>
              <input
                ref={fileInputRef}
                id="reference-upload"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => addMockImages(e.target.files)}
              />

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative size-16 overflow-hidden rounded-md border border-border bg-muted"
                    >
                      {img.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.url || "/placeholder.svg"}
                          alt={img.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <ImagePlus className="size-4" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        aria-label={`Remove ${img.name}`}
                        className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <FieldLabel className="rounded-lg border border-border p-3">
              <Checkbox
                checked={requiresApproval}
                onCheckedChange={(checked) =>
                  setRequiresApproval(checked === true)
                }
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  Requires Director price approval
                </span>
                <FieldDescription>
                  Tick for bargained or non-catalogue pricing. The order waits as
                  Pending Approval instead of going straight to the workshop.
                </FieldDescription>
              </div>
            </FieldLabel>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Create order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

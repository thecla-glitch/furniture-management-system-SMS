"use client"

import { useMemo, useRef, useState } from "react"
import { ImagePlus, PackagePlus, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { branches, getBranchById } from "@/lib/mock-data"
import {
  useShowroom,
  type NewComponentInput,
} from "@/components/shop/showroom-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ComponentDraft {
  id: string
  label: string
  price: string
}

interface PhotoDraft {
  id: string
  name: string
  url: string
}

const today = () => new Date().toISOString().slice(0, 10)

// Deterministic counter (no Date.now) so server and client render identical
// initial IDs and avoid a hydration mismatch.
let counter = 0
const uid = (prefix: string) => `${prefix}-${counter++}`

function newComponent(): ComponentDraft {
  return { id: uid("comp"), label: "", price: "" }
}

export function EnterStockScreen() {
  const { sets, addSet } = useShowroom()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [branchId, setBranchId] = useState(branches[0].id)
  const [fullSetPrice, setFullSetPrice] = useState("")
  const [dateEntered, setDateEntered] = useState(today())
  const [components, setComponents] = useState<ComponentDraft[]>([
    newComponent(),
  ])
  const [photos, setPhotos] = useState<PhotoDraft[]>([])
  const [dragActive, setDragActive] = useState(false)

  const branchItems = Object.fromEntries(
    branches.map((b) => [b.id, `Branch ${b.code} — ${b.name}`])
  )

  // Preview the ID the store will mint for the chosen branch.
  const previewSetId = useMemo(() => {
    const code = getBranchById(branchId)?.code ?? "X"
    const prefix = `SET-${code}-`
    const maxSeq = sets
      .filter((s) => s.id.startsWith(prefix))
      .reduce((max, s) => {
        const seq = Number.parseInt(s.id.slice(prefix.length), 10)
        return Number.isNaN(seq) ? max : Math.max(max, seq)
      }, 0)
    return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`
  }, [branchId, sets])

  const isStandalone = components.length === 1

  function updateComponent(id: string, patch: Partial<ComponentDraft>) {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    )
  }

  function addMockPhotos(files: FileList | null) {
    const incoming: PhotoDraft[] = []
    const count = files?.length ?? 1
    for (let i = 0; i < count; i++) {
      const file = files?.[i]
      incoming.push({
        id: uid("photo"),
        name: file?.name ?? `photo-${photos.length + i + 1}.jpg`,
        url: file ? URL.createObjectURL(file) : "",
      })
    }
    setPhotos((prev) => [...prev, ...incoming])
  }

  const canSubmit =
    name.trim().length > 0 &&
    Number.parseFloat(fullSetPrice) > 0 &&
    components.length > 0 &&
    components.every(
      (c) => c.label.trim().length > 0 && Number.parseFloat(c.price) >= 0
    )

  function reset() {
    setName("")
    setDescription("")
    setBranchId(branches[0].id)
    setFullSetPrice("")
    setDateEntered(today())
    setComponents([newComponent()])
    setPhotos([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const cleanComponents: NewComponentInput[] = components.map((c) => ({
      label: c.label.trim(),
      individualPrice: Number.parseFloat(c.price) || 0,
    }))

    const id = addSet({
      name,
      description,
      branchId,
      fullSetPrice: Number.parseFloat(fullSetPrice) || 0,
      components: cleanComponents,
      photos: photos.map((p) => p.url).filter(Boolean),
      dateEntered,
    })

    toast.success("Stock entered into showroom", {
      description: `${name.trim()} added as ${id} (${getBranchById(branchId)?.name}).`,
    })
    reset()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <PackagePlus className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Enter ready-made stock
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Register furniture moved from the workshop into a showroom. Define
            its components and pricing — the set and item IDs are generated
            automatically.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set details</CardTitle>
            <CardDescription>
              Generated ID:{" "}
              <span className="font-mono font-medium text-foreground">
                {previewSetId}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="set-name">Set / item name</FieldLabel>
              <Input
                id="set-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal 6-Seater Dining Set"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="set-description">Description</FieldLabel>
              <Textarea
                id="set-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of the piece"
                rows={2}
              />
            </Field>
            <Field orientation="responsive">
              <Field>
                <FieldLabel>Branch assigned to</FieldLabel>
                <Select
                  items={branchItems}
                  value={branchId}
                  onValueChange={(v) => setBranchId(v as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        Branch {b.code} — {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="set-price">Full set price</FieldLabel>
                <Input
                  id="set-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fullSetPrice}
                  onChange={(e) => setFullSetPrice(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="set-date">Date entered</FieldLabel>
                <Input
                  id="set-date"
                  type="date"
                  value={dateEntered}
                  onChange={(e) => setDateEntered(e.target.value)}
                />
              </Field>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Components</CardTitle>
            <CardDescription>
              Add a row per piece. A single component means a standalone item.
              {isStandalone && (
                <Badge variant="secondary" className="ml-2">
                  Standalone item
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {components.map((comp, index) => (
              <div key={comp.id} className="flex items-end gap-2">
                <div className="w-10 shrink-0">
                  <span className="flex h-9 items-center text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>
                <Field className="flex-1">
                  {index === 0 && (
                    <FieldLabel htmlFor={`${comp.id}-label`}>
                      Component label
                    </FieldLabel>
                  )}
                  <Input
                    id={`${comp.id}-label`}
                    aria-label={`Component ${index + 1} label`}
                    value={comp.label}
                    onChange={(e) =>
                      updateComponent(comp.id, { label: e.target.value })
                    }
                    placeholder="e.g. Table, Chair 1"
                  />
                </Field>
                <Field className="w-32">
                  {index === 0 && (
                    <FieldLabel htmlFor={`${comp.id}-price`}>
                      Individual price
                    </FieldLabel>
                  )}
                  <Input
                    id={`${comp.id}-price`}
                    aria-label={`Component ${index + 1} price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={comp.price}
                    onChange={(e) =>
                      updateComponent(comp.id, { price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove component ${index + 1}`}
                  disabled={components.length === 1}
                  onClick={() =>
                    setComponents((prev) =>
                      prev.filter((c) => c.id !== comp.id)
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Separator />
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setComponents((prev) => [...prev, newComponent()])
                }
              >
                <Plus data-icon="inline-start" />
                Add component
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reference photos</CardTitle>
            <CardDescription>
              Mock upload — thumbnails are shown locally only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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
                addMockPhotos(e.dataTransfer.files)
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
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => addMockPhotos(e.target.files)}
            />

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative size-16 overflow-hidden rounded-md border border-border bg-muted"
                  >
                    {photo.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.url || "/placeholder.svg"}
                        alt={photo.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="size-4" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos((prev) =>
                          prev.filter((p) => p.id !== photo.id)
                        )
                      }
                      aria-label={`Remove ${photo.name}`}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={reset}>
            Reset
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            <PackagePlus data-icon="inline-start" />
            Add to showroom
          </Button>
        </div>
      </form>
    </div>
  )
}

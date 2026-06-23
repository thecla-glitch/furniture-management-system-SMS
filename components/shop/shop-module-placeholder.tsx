"use client"

import { Store, MapPin, PackagePlus, Globe } from "lucide-react"

import { showroomSets } from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ShopVariant = "front-desk" | "director" | "operations"

const COPY: Record<
  ShopVariant,
  { title: string; description: string; features: string[] }
> = {
  "front-desk": {
    title: "Shop",
    description:
      "Sell ready-made furniture off the showroom floor, reserve sets for customers and raise transfer requests.",
    features: [
      "Browse showroom stock",
      "Sell full set or components",
      "Reserve a set",
      "Request a transfer",
    ],
  },
  director: {
    title: "Shop",
    description:
      "Monitor ready-made stock, reservations and partial-sale approvals across every branch.",
    features: [
      "All-branch stock overview",
      "Approve partial sales",
      "Approve transfers",
      "Showroom revenue",
    ],
  },
  operations: {
    title: "Showroom Stock",
    description:
      "Enter new ready-made furniture into the showroom and assign it to a branch.",
    features: [
      "Add a new set",
      "Define set components",
      "Set full & component pricing",
      "Assign to branch",
    ],
  },
}

export function ShopModulePlaceholder({ variant }: { variant: ShopVariant }) {
  const { activeBranch } = useBranch()
  const copy = COPY[variant]

  // Front Desk is scoped to one branch; everyone else sees all stock.
  const scopedSets =
    variant === "front-desk"
      ? showroomSets.filter((s) => s.branchId === activeBranch.id)
      : showroomSets

  const Icon = variant === "operations" ? PackagePlus : Store

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              {copy.description}
            </p>
          </div>
        </div>

        {variant === "front-desk" ? (
          <Badge variant="secondary" className="gap-1.5 self-start">
            <MapPin className="size-3.5" />
            Branch {activeBranch.code} — {activeBranch.name}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5 self-start">
            <Globe className="size-3.5" />
            All branches
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            {variant === "operations"
              ? "Sets currently in the showroom"
              : variant === "front-desk"
                ? `Sets at ${activeBranch.name}`
                : "Sets across all branches"}
          </CardDescription>
          <CardTitle className="text-3xl tabular-nums">
            {scopedSets.length}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {copy.features.map((feature) => (
          <Card key={feature} className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base text-balance">{feature}</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        This is the foundation of the shop module. We&apos;ll build out these
        screens next.
      </p>
    </div>
  )
}

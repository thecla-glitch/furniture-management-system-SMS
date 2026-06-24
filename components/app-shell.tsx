"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Armchair, Check, ChevronsUpDown, MapPin } from "lucide-react"

import { roles, getRoleByHref, type RoleId } from "@/lib/roles"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BranchProvider, useBranch } from "@/components/shop/branch-store"
import { ShowroomProvider } from "@/components/shop/showroom-store"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      <ShowroomProvider>
        <AppShellContent>{children}</AppShellContent>
      </ShowroomProvider>
    </BranchProvider>
  )
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activeRole = getRoleByHref(pathname) ?? roles[0]
  // Only the Front Desk operates against a single, selected branch.
  const isFrontDesk = activeRole.id === "front-desk"

  function handleSelectRole(href: string) {
    router.push(href)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Armchair className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight sm:text-base">
                Furniture Management
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Workshop operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFrontDesk && <BranchSelector />}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2">
                    <activeRole.icon data-icon="inline-start" />
                    <span className="max-w-24 truncate sm:max-w-none">
                      {activeRole.label}
                    </span>
                    <ChevronsUpDown
                      data-icon="inline-end"
                      className="opacity-60"
                    />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Preview as role</DropdownMenuLabel>
                  {roles.map((role) => (
                    <DropdownMenuItem
                      key={role.id}
                      onClick={() => handleSelectRole(role.href)}
                      className="gap-2"
                    >
                      <role.icon />
                      <span className="flex-1 truncate">{role.label}</span>
                      {role.id === activeRole.id && (
                        <Check className="text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <p className="px-1.5 py-1 text-xs text-muted-foreground">
                  Dev preview only — not real authentication.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="border-t border-border/60 bg-card">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {activeRole.nav.map((item) => {
              const isActive = item.href ? pathname === item.href : false

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <span
                  key={item.label}
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                >
                  {item.label}
                  <Badge variant="secondary" className="text-[10px]">
                    Soon
                  </Badge>
                </span>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}

function BranchSelector() {
  const { branches, activeBranch, activeBranchId, setActiveBranchId } =
    useBranch()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <MapPin data-icon="inline-start" />
            <span className="max-w-24 truncate sm:max-w-none">
              Branch {activeBranch.code}
            </span>
            <ChevronsUpDown data-icon="inline-end" className="opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Active branch</DropdownMenuLabel>
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => setActiveBranchId(branch.id)}
              className="gap-2"
            >
              <span className="flex size-6 items-center justify-center rounded bg-secondary text-xs font-semibold text-secondary-foreground">
                {branch.code}
              </span>
              <span className="flex-1 truncate">{branch.name}</span>
              {branch.id === activeBranchId && (
                <Check className="text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <p className="px-1.5 py-1 text-xs text-muted-foreground">
          Front Desk views are scoped to this branch.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type { RoleId }

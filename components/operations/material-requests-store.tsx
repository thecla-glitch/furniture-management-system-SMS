"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import {
  materialRequests as seedRequests,
  type MaterialRequest,
  type MaterialRequestStatus,
} from "@/lib/mock-data"

interface MaterialRequestsContextValue {
  requests: MaterialRequest[]
  pendingCount: number
  setStatus: (id: string, status: MaterialRequestStatus) => void
}

const MaterialRequestsContext =
  createContext<MaterialRequestsContextValue | null>(null)

export function MaterialRequestsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [requests, setRequests] = useState<MaterialRequest[]>(seedRequests)

  const setStatus = useCallback(
    (id: string, status: MaterialRequestStatus) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
    },
    []
  )

  const value = useMemo<MaterialRequestsContextValue>(
    () => ({
      requests,
      pendingCount: requests.filter((r) => r.status === "Pending").length,
      setStatus,
    }),
    [requests, setStatus]
  )

  return (
    <MaterialRequestsContext.Provider value={value}>
      {children}
    </MaterialRequestsContext.Provider>
  )
}

export function useMaterialRequests(): MaterialRequestsContextValue {
  const ctx = useContext(MaterialRequestsContext)
  if (!ctx) {
    throw new Error(
      "useMaterialRequests must be used within a MaterialRequestsProvider"
    )
  }
  return ctx
}

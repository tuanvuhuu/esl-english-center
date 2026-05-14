import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getBranches, getAcademicYears } from '../services'
import type { Branch, AcademicYear } from '../types/database'

interface AppContextValue {
  branches: Branch[]
  years: AcademicYear[]
  selectedBranch: Branch | null
  selectedYear: AcademicYear | null
  setSelectedBranchId: (id: string) => void
  setSelectedYearId: (id: string) => void
  loading: boolean
}

const Ctx = createContext<AppContextValue | null>(null)

const LS_BRANCH = 'esl_branch'
const LS_YEAR   = 'esl_year'

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedBranchId, setSelectedBranchIdRaw] = useState<string>(() => localStorage.getItem(LS_BRANCH) ?? '')
  const [selectedYearId, setSelectedYearIdRaw]     = useState<string>(() => localStorage.getItem(LS_YEAR)   ?? '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBranches(), getAcademicYears()])
      .then(([b, y]) => {
        setBranches(b)
        setYears(y)
        // Default: first branch, current year (or first year)
        if (!localStorage.getItem(LS_BRANCH) && b.length > 0) {
          setSelectedBranchIdRaw(b[0].id)
          localStorage.setItem(LS_BRANCH, b[0].id)
        }
        if (!localStorage.getItem(LS_YEAR) && y.length > 0) {
          const cur = y.find(x => x.is_current) ?? y[0]
          setSelectedYearIdRaw(cur.id)
          localStorage.setItem(LS_YEAR, cur.id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const setSelectedBranchId = useCallback((id: string) => {
    setSelectedBranchIdRaw(id)
    localStorage.setItem(LS_BRANCH, id)
  }, [])

  const setSelectedYearId = useCallback((id: string) => {
    setSelectedYearIdRaw(id)
    localStorage.setItem(LS_YEAR, id)
  }, [])

  const selectedBranch = branches.find(b => b.id === selectedBranchId) ?? null
  const selectedYear   = years.find(y => y.id === selectedYearId) ?? null

  return (
    <Ctx.Provider value={{ branches, years, selectedBranch, selectedYear, setSelectedBranchId, setSelectedYearId, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}

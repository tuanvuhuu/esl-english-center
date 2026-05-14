import { useReducer, useCallback } from 'react'

// ─── State ────────────────────────────────────────────────────────────────────

export interface CRUDState<T> {
  search: string
  filters: Record<string, string>
  viewMode: 'table' | 'grid'
  showForm: boolean
  editItem: T | null
  deleteTarget: T | null
  detailItem: T | null
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type CRUDAction<T> =
  | { type: 'SEARCH'; payload: string }
  | { type: 'FILTER'; key: string; value: string }
  | { type: 'VIEW_MODE'; payload: 'table' | 'grid' }
  | { type: 'OPEN_ADD' }
  | { type: 'OPEN_EDIT'; payload: T }
  | { type: 'CLOSE_FORM' }
  | { type: 'SET_DETAIL'; payload: T | null }
  | { type: 'SET_DELETE'; payload: T | null }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer<T>(state: CRUDState<T>, action: CRUDAction<T>): CRUDState<T> {
  switch (action.type) {
    case 'SEARCH':
      return { ...state, search: action.payload }
    case 'FILTER':
      return { ...state, filters: { ...state.filters, [action.key]: action.value } }
    case 'VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'OPEN_ADD':
      return { ...state, showForm: true, editItem: null }
    case 'OPEN_EDIT':
      // also close detail so it doesn't stack with the form
      return { ...state, showForm: true, editItem: action.payload, detailItem: null }
    case 'CLOSE_FORM':
      return { ...state, showForm: false, editItem: null }
    case 'SET_DETAIL':
      return { ...state, detailItem: action.payload }
    case 'SET_DELETE':
      return { ...state, deleteTarget: action.payload }
    default:
      return state
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCRUDPage<T>(defaultFilters: Record<string, string> = {}) {
  const initial: CRUDState<T> = {
    search: '',
    filters: defaultFilters,
    viewMode: 'table',
    showForm: false,
    editItem: null,
    deleteTarget: null,
    detailItem: null,
  }

  const [state, dispatch] = useReducer(
    reducer as (s: CRUDState<T>, a: CRUDAction<T>) => CRUDState<T>,
    initial,
  )

  const setSearch        = useCallback((v: string)             => dispatch({ type: 'SEARCH',    payload: v }), [])
  const setFilter        = useCallback((k: string, v: string)  => dispatch({ type: 'FILTER',    key: k, value: v }), [])
  const setViewMode      = useCallback((v: 'table' | 'grid')   => dispatch({ type: 'VIEW_MODE', payload: v }), [])
  const openAdd          = useCallback(()                       => dispatch({ type: 'OPEN_ADD' }), [])
  const openEdit         = useCallback((item: T)               => dispatch({ type: 'OPEN_EDIT', payload: item }), [])
  const closeForm        = useCallback(()                       => dispatch({ type: 'CLOSE_FORM' }), [])
  const setDetail        = useCallback((item: T | null)        => dispatch({ type: 'SET_DETAIL', payload: item }), [])
  const setDeleteTarget  = useCallback((item: T | null)        => dispatch({ type: 'SET_DELETE', payload: item }), [])

  return {
    state,
    dispatch,
    setSearch,
    setFilter,
    setViewMode,
    openAdd,
    openEdit,
    closeForm,
    setDetail,
    setDeleteTarget,
  }
}

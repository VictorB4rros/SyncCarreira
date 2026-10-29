/**
 * @file useAsync.ts
 * @description Carrega dados assíncronos com estados de loading/erro e recarga manual.
 * Ignora respostas antigas (corrida entre requisições) e respostas após desmontar.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react'

export interface AsyncState<T> {
  data: T | null
  error: unknown
  loading: boolean
  reload: () => Promise<void>
  setData: Dispatch<SetStateAction<T | null>>
}

export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList, options: { enabled?: boolean } = {}): AsyncState<T> {
  const enabled = options.enabled ?? true
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState<boolean>(enabled)
  const requestId = useRef(0)
  const mounted = useRef(true)

  // As dependências são as informadas por quem chama (mesmo contrato do useEffect).
  const run = useCallback(loader, deps)

  const reload = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await run()
      if (mounted.current && id === requestId.current) setData(result)
    } catch (err) {
      if (mounted.current && id === requestId.current) setError(err)
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false)
    }
  }, [run])

  useEffect(() => {
    mounted.current = true
    if (enabled) void reload()
    else setLoading(false)
    return () => {
      mounted.current = false
    }
  }, [reload, enabled])

  return { data, error, loading, reload, setData }
}

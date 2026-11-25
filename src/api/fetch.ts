import type { ApiErrorBody } from '@/types/api'

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
  const res = await fetch(path, init)
  const data = (await res.json()) as T | ApiErrorBody
  if (!res.ok) {
    throw new ApiError(res.status, data as ApiErrorBody)
  }
  return data as T
}
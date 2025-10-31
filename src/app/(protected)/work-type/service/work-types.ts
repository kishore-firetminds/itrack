import api from "@/utils/api"
import { URLS } from "@/utils/urls"

export type WorkType = {
  id: string
  name: string
  status?: "active" | "inactive" | string
  remarks?: string | null
  createdAt?: string
  updatedAt?: string
}

export type WorkTypeListResponse = {
  data: WorkType[]
  page: number
  limit: number
  total: number
}

// GET list (server pagination-friendly)
export async function fetchWorkTypes(
  params: {
    page?: number
    limit?: number
    statusId?: string
    search?: string
  } = {},
): Promise<WorkTypeListResponse> {
  const { page = 1, limit = 10, statusId, search } = params
  const res = await api.get(URLS.WORK_TYPES, {
    params: {
      page,
      limit,
      statusId: statusId || undefined,
      search: search || undefined,
    },
  })
  const payload = res.data || {}
  return {
    data: payload.data ?? [],
    page: Number(payload.page ?? page),
    limit: Number(payload.limit ?? limit),
    total: Number(payload.total ?? payload.data?.length ?? 0),
  }
}

// POST create
export async function createWorkType(payload: {
  name: string
  remarks?: string
  status?: "active" | "inactive" | string
}) {
  const body = {
    name: payload.name,
    remarks: payload.remarks ?? "",
    status: payload.status ?? "active",
  }
  const res = await api.post(URLS.CREATE_WORK_TYPE, body)
  return res.data
}

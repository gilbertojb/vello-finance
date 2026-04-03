export const queryKeys = {
  tenants: {
    all: ['tenants'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.tenants.all, 'list', filters] as const,
    detail: (id: string) =>
      [...queryKeys.tenants.all, 'detail', id] as const,
  },
  plans: {
    all: ['plans'] as const,
    list: () => [...queryKeys.plans.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.plans.all, 'detail', id] as const,
  },
} as const

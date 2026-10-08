import { useQuery } from '@tanstack/react-query'
import { request } from './request'

export const useQuota = () => {
  const { data } = useQuery({
    queryKey: ['quota'],
    queryFn: () => request<{ isQuotaExhausted: boolean }>('/api/quota')
  })
  return { isQuotaExhausted: !!data?.isQuotaExhausted }
}

import { z } from 'zod'

export const checkinSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .transform((v) => v.trim()),
  last4: z.string().regex(/^\d{4}$/, '휴대폰 뒤 4자리를 입력하세요.'),
})

export const checkinConfirmSchema = z.object({
  candidate_id: z.string().min(1),
})

export type CheckinInput = z.infer<typeof checkinSchema>
export type CheckinConfirmInput = z.infer<typeof checkinConfirmSchema>

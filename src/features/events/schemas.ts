import { z } from 'zod'

export const eventBaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  checkin_opens_at: z.string().datetime().optional(),
  checkin_closes_at: z.string().datetime().optional(),
  survey_mode: z.enum(['none', 'self', 'google_forms']).default('none'),
  google_forms_url: z.string().url().optional().nullable(),
})

export const createEventSchema = eventBaseSchema
  .refine((d) => new Date(d.end_at) > new Date(d.start_at), {
    message: '종료 시간은 시작 시간 이후여야 합니다.',
    path: ['end_at'],
  })
  .refine(
    (d) =>
      !d.google_forms_url ||
      /^https:\/\/(docs\.google\.com\/forms|forms\.gle)/.test(d.google_forms_url),
    {
      message: 'Google Forms URL 형식이 올바르지 않습니다.',
      path: ['google_forms_url'],
    },
  )

export type CreateEventInput = z.infer<typeof eventBaseSchema>

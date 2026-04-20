import { z } from 'zod'

export const submitSurveySchema = z.object({
  answers: z.array(
    z.object({
      question_id: z.string().uuid(),
      value: z.union([z.string(), z.array(z.string()), z.null()]),
    }),
  ),
})

export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>

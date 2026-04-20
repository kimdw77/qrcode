import { z } from 'zod'

export const submitQuestionSchema = z.object({
  body: z.string().min(1).max(1000),
  is_anonymous: z.boolean().default(true),
  author_name: z.string().min(1).max(20).optional(),
}).refine(
  (d) => d.is_anonymous || !!d.author_name,
  { message: '기명 질문 시 이름을 입력하세요.', path: ['author_name'] },
)

export type SubmitQuestionInput = z.infer<typeof submitQuestionSchema>

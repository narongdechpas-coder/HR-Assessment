import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

const s = () => useStore.getState()

describe('manager review', () => {
  beforeEach(() => s().resetDemo())

  it('cannot review before the employee submits', () => {
    s().setReview('E1010', 'CORE01', { level: 2 })
    expect(s().assessments.E1010.review.CORE01).toBeUndefined()
  })

  it('review → confirm locks the result', () => {
    expect(s().assessments.E1007.status).toBe('submitted')
    s().setReview('E1007', 'CORE01', { level: 1, note: 'ยังต้องดูแล' })
    s().confirmReview('E1007')
    expect(s().assessments.E1007.status).toBe('confirmed')
    s().setReview('E1007', 'CORE01', { level: 4 })
    expect(s().assessments.E1007.review.CORE01.level).toBe(1)
  })

  it('return to employee clears review, keeps self answers, allows resubmit', () => {
    const selfBefore = s().assessments.E1007.self
    s().setReview('E1007', 'CORE01', { level: 1 })
    s().returnToEmployee('E1007', 'ใส่ตัวอย่างงาน')
    const a = s().assessments.E1007
    expect(a.status).toBe('draft')
    expect(a.review).toEqual({})
    expect(a.self).toEqual(selfBefore)
    expect(a.returnReason).toBe('ใส่ตัวอย่างงาน')
    s().submitSelf('E1007')
    expect(s().assessments.E1007.status).toBe('submitted')
    expect(s().assessments.E1007.returnReason).toBeUndefined()
  })
})

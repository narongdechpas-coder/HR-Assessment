import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

const s = () => useStore.getState()

describe('manager review', () => {
  beforeEach(() => s().resetDemo())

  it('cannot review before the employee submits', () => {
    s().setReview('E0105', 'CORE01', { level: 2 })
    expect(s().assessments.E0105.review.CORE01).toBeUndefined()
  })

  it('review → confirm locks the result', () => {
    expect(s().assessments.E0104.status).toBe('submitted')
    s().setReview('E0104', 'CORE01', { level: 1, note: 'ยังต้องดูแล' })
    s().confirmReview('E0104')
    expect(s().assessments.E0104.status).toBe('confirmed')
    s().setReview('E0104', 'CORE01', { level: 4 })
    expect(s().assessments.E0104.review.CORE01.level).toBe(1)
  })

  it('return to employee clears review, keeps self answers, allows resubmit', () => {
    const selfBefore = s().assessments.E0104.self
    s().setReview('E0104', 'CORE01', { level: 1 })
    s().returnToEmployee('E0104', 'ใส่ตัวอย่างงาน')
    const a = s().assessments.E0104
    expect(a.status).toBe('draft')
    expect(a.review).toEqual({})
    expect(a.self).toEqual(selfBefore)
    expect(a.returnReason).toBe('ใส่ตัวอย่างงาน')
    s().submitSelf('E0104')
    expect(s().assessments.E0104.status).toBe('submitted')
    expect(s().assessments.E0104.returnReason).toBeUndefined()
  })
})

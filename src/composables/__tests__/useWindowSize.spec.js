import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useWindowSize } from '../useWindowSize'

describe('useWindowSize', () => {
  let wrapper

  beforeEach(() => {
    // 设置初始窗口大小
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
  })

  it('应该返回正确的初始窗口大小', () => {
    wrapper = mount({
      template: '<div></div>',
      setup() {
        const { width, height } = useWindowSize()
        return { width, height }
      }
    })
    expect(wrapper.vm.width).toBe(1024)
    expect(wrapper.vm.height).toBe(768)
  })

  it('窗口改变时应触发更新', async () => {
    wrapper = mount({
      template: '<div></div>',
      setup() {
        const { width, height } = useWindowSize()
        return { width, height }
      }
    })

    // 模拟窗口大小改变
    window.innerWidth = 500
    window.innerHeight = 800
    window.dispatchEvent(new Event('resize'))

    // 等待 Vue 的响应式更新
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.width).toBe(500)
    expect(wrapper.vm.height).toBe(800)
  })
})

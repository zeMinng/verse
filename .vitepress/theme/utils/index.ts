import {
  ref,
  getCurrentInstance,
  onMounted,
  toValue,
  computed,
  watch,
  onBeforeUnmount,
  // onUnmounted,
  // useSlots,
  // reactive,
  // Text,
  // Comment
} from 'vue'
// Reactive, VNode 类型
import type { Ref, ComputedRef, } from 'vue'

/**
 * 用于判断组件是否已挂载的自定义钩子
 *
 * 在组件的生命周期中，我们经常需要知道组件是否已经挂载，特别是在异步操作或者动态渲染的场景中
 * 此钩子通过在组件挂载时设置一个 Ref 对象的状态来帮助我们进行判断
 *
 * @returns { Ref<boolean> } 返回一个 Ref 对象，用于指示组件是否已挂载
 */
export function useMounted(): Ref<boolean> {
  const isMounted = ref(false)
  // 获取当前组件的实例
  const instance = getCurrentInstance()
  if (instance) {
    onMounted(() => {
      isMounted.value = true
    }, instance)
  }
  return isMounted
}

/**
 * 检查 api 是否支持
 *
 * 用于检查给定的回调函数是否在组件挂载期间被支持
 *
 * @param {() => unknown} callback 回调函数，用于执行某些操作，并返回用于计算的值
 * @returns {ComputedRef<boolean>} 返回一个计算属性，该属性在组件挂载时会触发回调函数，并根据回调函数的返回值计算支持状态
 */
export function useSupported(callback: () => unknown): ComputedRef<boolean> {
  const isMounted = useMounted()
  return computed(() => {
    // to trigger the ref
    void isMounted.value
    return Boolean(callback())
  })
}

/**
 * 组合式函数
 * 使用 MutationObserver 观察 DOM 元素的变化
 *
 * 该函数提供了一个便捷的方式来订阅 DOM 元素的变动，当元素发生指定的变化时，调用提供的回调函数
 * 使用者可以指定要观察的一个或多个 DOM 元素，以及观察的选项和回调函数
 *
 * @param {Ref | Ref[] | HTMLElement | HTMLElement[]} target 要观察的目标，可以是 Ref 对象、Ref 数组、HTMLElement 或 HTMLElement 数组
 * @param {MutationCallback} callback 当观察到变化时调用的回调函数
 * @param {object} [options = {}] MutationObserver 的观察选项，默认为空对象；例如:
 *          subtree: 是否监听以 target 为根节点的整个子树，包括子树中所有节点的属性
 *          childList: 是否监听 target 节点中发生的节点的新增与删除
 *          attributes: 是否观察所有监听的节点属性值的变化
 *          attributeFilter: 声明哪些属性名会被监听的数组；如果不声明该属性，所有属性的变化都将触发通知
 * @returns {start: () => void, stop: () => void} 返回一个对象，包含停止和开始观察的方法，使用者可以调用 start 方法开始观察，调用 stop 方法停止观察
 */
export function useMutationObserver(
  target: Ref | Ref[] | HTMLElement | HTMLElement[],
  callback: MutationCallback,
  options: object = {}
): { start: () => void; stop: () => void } {
  const isSupported = useSupported(() => window && 'MutationObserver' in window)
  const stopObservation = ref(false)
  let observer: MutationObserver | undefined
  const targets = computed(() => {
    const targetsValue = toValue(target)
    if (targetsValue) {
      if (Array.isArray(targetsValue)) {
        return targetsValue.map((el: any) => toValue(el)).filter((el: any) => el)
      } else {
        return [targetsValue]
      }
    }
    return []
  })
  // 定义清理函数，用于断开 MutationObserver 的连接
  const cleanup = () => {
    if (observer) {
      observer.disconnect()
      observer = undefined
    }
  }
  // 初始化 MutationObserver，开始观察目标元素
  const observeElements = () => {
    if (isSupported.value && targets.value.length && !stopObservation.value) {
      observer = new MutationObserver(callback)
      targets.value.forEach((element: HTMLElement) => observer!.observe(element, options))
    }
  }
  // 监听 targets 的变化，当 targets 变化时，重新建立 MutationObserver 观察
  watch(
    () => targets.value,
    () => {
      cleanup()
      observeElements()
    },
    {
      immediate: true, // 立即触发回调，以便初始状态也被观察
      flush: 'post'
    }
  )
  const start = () => {
    stopObservation.value = false
    observeElements()
  }
  const stop = () => {
    stopObservation.value = true
    cleanup()
  }
  // 在组件卸载前清理 MutationObserver
  onBeforeUnmount(() => cleanup())
  return {
    start,
    stop
  }
}

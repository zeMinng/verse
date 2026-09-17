# Vue3 核心 API 概览

## 概要

[Vue3](https://cn.vuejs.org/guide/introduction) 采用 Proxy 实现更完善的响应式系统，主推组合式 API (Composition API)，不仅让代码组织更灵活、性能与体积表现更优，还更适配复杂项目的逻辑组织与复用。

## 一、响应式数据

ref 是最简单的响应式数据管理方式之一，它允许直接修改值或整体替换数据。相比之下，reactive 主要用于创建深层响应式对象，适用于管理复杂的状态。

:::code-group
``` ts [响应式数据]
/** reactive使用 */
const car = reactive({ brand: '奔驰', price: 1 })
// 整体替换car对象应该使用
Object.assign(car, { brand: '奥迪', price: 2 })

/** ref使用 */
const user = ref({ name: '大大' })
user.value.name = '小小'
console.log(unref(user))

/**
 * 若需要一个基本类型的响应式数据，必须使用 `ref`;
 * 若需要一个响应式对象，层级不深，`ref、reactive` 都可以;
 * 若需要一个响应式对象，且层级较深，推荐使用 `reactive`。
 */
```

``` ts [toRefs]
let person = reactive({
  name: '张三',
  age: 20,
})

// 使用 toRefs 来解构对象保持响应式
let { name, age } = toRefs(person)
console.log(name.value)
```
:::

## 二、计算属性与侦听器

### 1. 计算属性（computed）
推荐使用 [计算属性](https://cn.vuejs.org/guide/essentials/computed.html) 来描述依赖响应式状态的复杂逻辑。

``` ts
// 进阶写法
const a = computed(() => {
  get() { },
  set(val) { }
})
```

### 2. 侦听器（watch）
使用 [watch](https://cn.vuejs.org/guide/essentials/watchers.html) 函数在每次响应式状态发生变化时触发回调函数。

::: warning 注意：监视ref定义的对象数据类型
若修改的是 `ref` 定义的对象中的属性， `newValue` 和 `oldvalue` 都是新值，因为它们是同一个对象。

若修改整个 `ref` 定义的对象，`newValue` 是新值，`oldValue` 是旧值，因为不是同一个对象了。
:::

::: code-group

```ts [监视 ref]
/** 监视 ref 基本数据类型 */
let sum = ref(0)
const stopWatch = watch(sum, (newVal, oldVal) => {
  // 停止监听
  if (newVal >= 3) stopWatch()
})

/** 监视 ref 对象数据类型 */
let person = ref({ name: '张三' })
// 监听的是对象的地址值。若想监听对象内部属性的变化，需要手动开启深度监听！
watch(person, (newVal, oldVal) => {}, {
  deep: true,
})
// 监视ref对象的name属性
watch(() => person.value.name,
  (newVal, oldVal) => {
    console.log(`ref对象的name属性变化: 从${oldVal}变为${newVal}`);
  }
)

// person.car:更改某一个可以监听到，整体修改监听不到
// () => person.car: 整体修改可以，更改某一个需要deep
// watch(person.car, () => {})
```

```ts [监视 reactive]
// 默认是开启深度监听的
const userReactive = reactive({
  name: '李四',
  age: 25,
  address: {
    city: '北京',
    street: '长安街'
  }
})

// 监视reactive对象的age属性
watch(() => userReactive.age,
  (newVal, oldVal) => {
    console.log(`reactive对象的age属性变化: 从${oldVal}变为${newVal}`);
  }
)
// 监视reactive对象的嵌套属性
watch(() => userReactive.address.city,
  (newVal, oldVal) => {
    console.log(`reactive对象的嵌套city属性变化: 从${oldVal}变为${newVal}`);
  }
)

// 3. 使用watchEffect监视（自动追踪依赖）
watchEffect(() => {
  console.log(`watchEffect监测到name变化: ${userReactive.name}`);
})
```

:::

## 三、小结

::: info 📖 相关资源
- [Vue CLI](https://cli.vuejs.org/zh/guide/) - Vue CLI 项目脚手架
:::
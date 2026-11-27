# 集合框架

## 概要

集合分两大体系：**Collection**（List、Set、Queue）管单个元素，**Map** 按键值对存储。所有集合只能装引用类型，基本类型要靠包装类装箱——`List<int>` 编译不过，`List<Integer>` 可以。

选型只需回答三个问题：要不要索引、要不要去重、要不要排序。

## 一、体系总览

```plaintext
Collection（单元素）
├── List   有序、可重复、有索引
├── Set    不可重复
│   ├── HashSet        无序，最快
│   ├── LinkedHashSet  保留插入顺序
│   └── TreeSet        按元素排序
└── Queue  队列 / 双端队列
    ├── ArrayDeque     双端队列，当队列或栈用（最常用）
    ├── LinkedList     也实现了 Deque
    └── PriorityQueue  按优先级出队（堆实现）

Map（键值对，不属于 Collection）
├── HashMap        无序，最快
├── LinkedHashMap  保留插入顺序，或按访问顺序
└── TreeMap        按 key 排序
```

| 接口 | 能否重复 | 是否有序 | 核心实现                          |
| ---- | -------- | -------- | --------------------------------- |
| List | 可以     | 按插入   | ArrayList / LinkedList            |
| Set  | 不可以   | 看实现   | HashSet / LinkedHashSet / TreeSet |
| Map  | key 唯一 | 看实现   | HashMap / LinkedHashMap / TreeMap |

## 二、List

差异只在底层结构：ArrayList 是 `Object[]`，LinkedList 是双向链表。

| 维度     | ArrayList           | LinkedList                   |
| -------- | ------------------- | ---------------------------- |
| 底层     | 数组                | 双向链表                     |
| 随机访问 | O(1)                | O(n)                         |
| 头部插入 | O(n)（要整体挪）    | O(1)                         |
| 尾部插入 | 摊还 O(1)           | O(1)                         |
| 内存     | 连续内存 + 扩容冗余 | 每个节点多两个指针，更占内存 |
| 适用     | 绝大多数场景        | 频繁头插、当队列或栈用       |

::: code-group
```java [ArrayList 常用操作]
List<String> list = new ArrayList<>();
list.add("a");          // 尾部追加
list.add(1, "b");       // 指定位置插入
list.get(0);            // 按索引取
list.set(0, "c");       // 替换
list.remove(0);         // 按索引删
list.remove("c");       // 按元素删，走 equals
list.size();
list.contains("b");
```

```java [LinkedList 双端操作]
LinkedList<String> deque = new LinkedList<>();
deque.addFirst("a");
deque.addLast("b");
deque.getFirst();
deque.removeLast();
```

```java [两种"假 List"]
List<String> of = List.of("a", "b");              // 不可变：add 抛 UnsupportedOperationException
List<String> fixed = Arrays.asList("a", "b");     // 定长：能 set，不能 add / remove
```
:::

两个高频坑：

- **循环里删元素**：`list.remove(i)` 按索引删会漏掉后一个元素；按对象删又要小心重载选错方法（`remove(Integer.valueOf(1))` 才是按元素）。
- **subList 是视图不是副本**，改子列表会影响原列表，原列表结构一变还会抛异常。要独立副本就 `new ArrayList<>(list.subList(1, 3))`。

ArrayList 默认容量 10，满了按 1.5 倍扩容（`old + (old >> 1)`），所以能预估数量时直接在构造器里给容量，省掉多次数组拷贝。

## 三、队列: Queue / Deque

Queue 是**单端**队列：队尾进、队头出，先进先出。Deque 是**双端**队列，两头都能进出，所以既能当队列也能当栈。

最常用的是 ArrayDeque——比 LinkedList 更快、内存更紧凑；LinkedList 虽然也实现了 Deque，但每个元素都要多带两个指针。

Queue 的每个操作都有两套版本：失败时抛异常的，和失败时返回特殊值的。日常代码优先用后者，省掉 try-catch。

| 操作           | 抛异常       | 返回特殊值               |
| -------------- | ------------ | ------------------------ |
| 队尾插入       | add(e)       | offer(e)，失败返回 false |
| 队头取出并删除 | remove()     | poll()，空队列返回 null  |
| 队头查看       | element()    | peek()，空队列返回 null  |
| 队头插入       | addFirst(e)  | offerFirst(e)            |
| 队尾取出       | removeLast() | pollLast()               |

::: code-group
```java [当队列用（先进先出）]
Deque<String> queue = new ArrayDeque<>();
queue.offer("a");     // 入队，加在队尾
queue.offer("b");
queue.poll();         // 出队，取队头，返回 "a"；空队列返回 null
queue.peek();         // 只看队头，不出队
```

```java [当栈用（后进先出）]
Deque<String> stack = new ArrayDeque<>();
stack.push("a");      // 等价于 addFirst
stack.push("b");
stack.pop();          // 等价于 removeFirst，返回 "b"
stack.peek();         // 只看栈顶，不出栈
// 不要用 Stack 类：它是同步的遗留实现，官方推荐用 Deque 代替
```

```java [按优先级出队]
Queue<Task> pq = new PriorityQueue<>(Comparator.comparingInt(Task::getPriority));
pq.offer(new Task(3));
pq.offer(new Task(1));
pq.poll();            // 拿到优先级最小的那个，不是最先放进去的
```
:::

三个坑：

- **ArrayDeque 不允许 null**，所以 poll 返回 null 可以放心当“队列为空”的哨兵；LinkedList 允许 null，判断空的时候要小心。
- **PriorityQueue 只有 poll 是有序的**，直接遍历或 forEach 看到的是堆内部数组的顺序，显得杂乱是正常的。
- **PriorityQueue 不保证相等元素的顺序**，需要稳定排序就别指望它。

选型：先进先出用 ArrayDeque；后进先出（栈）也用 ArrayDeque；按优先级取最小用 PriorityQueue；只有在生产者消费者、线程池任务队列这类场景才需要 BlockingQueue（ArrayBlockingQueue / LinkedBlockingQueue）。

## 四、Map

HashMap 的结构是**数组 + 链表 + 红黑树**：

- 定位桶靠 `hash(key)`（内部还有 `h ^ (h >>> 16)` 扰动，把高位的差异混进低位）。
- 默认容量 16，负载因子 0.75，超过阈值就 2 倍扩容并重新分配桶。
- 单个桶链表长度到 8 且总容量 ≥ 64 时转红黑树，缩减到 6 退化回链表（这两个数值就是为了避免频繁互转）。

::: code-group
```java [常用操作]
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.get("a");
map.getOrDefault("b", 0);
map.putIfAbsent("c", 3);
map.containsKey("a");
map.remove("a");
map.size();
```

```java [三种遍历]
// entrySet：一次拿到 key 和 value，最通用
for (Map.Entry<String, Integer> e : map.entrySet()) {
  System.out.println(e.getKey() + " = " + e.getValue());
}

// keySet 再 get：多一次查找，不推荐
for (String key : map.keySet()) {
  System.out.println(key + " = " + map.get(key));
}

// forEach
map.forEach((k, v) -> System.out.println(k + " = " + v));
```

```java [统计与合并]
map.merge("a", 1, Integer::sum);                       // 存在就累加，不存在就放入
map.computeIfAbsent("b", k -> new ArrayList<>()).add("x");
map.computeIfPresent("a", (k, v) -> v + 1);
```
:::

| 实现          | 顺序           | 查找     | 典型用途                  |
| ------------- | -------------- | -------- | ------------------------- |
| HashMap       | 无序           | O(1)     | 默认选择                  |
| LinkedHashMap | 插入序／访问序 | O(1)     | 要保持顺序，或做 LRU 缓存 |
| TreeMap       | 按 key 排序    | O(log n) | 需要范围查找（`subMap`）  |

TreeMap 的排序规则来自 `Comparable` 或 `Comparator`，和 TreeSet 是同一套（详见泛型和比较器那页）。

三个必须记住的点：

1. **作为 key 的对象必须重写 hashCode 和 equals**，只重写其中一个会导致 put 进去却 get 不到。
2. **key 不要用可变对象**，改掉字段后哈希值变了，这个条目等于找不回来了。
3. **HashMap 不是线程安全的**，多线程读写用 ConcurrentHashMap，别用 `Collections.synchronizedMap` 硬扛。

## 五、Set

HashSet 内部就是一个只用 key 的 HashMap，所以“去重”本质是哈希判重；TreeSet 内部是 TreeMap，排序能力来自红黑树（旋转与平衡规则见[二叉树](/server/java/treeSet)）。

::: code-group
```java [HashSet 去重]
Set<String> set = new HashSet<>();
set.add("a");
set.add("a");         // 返回 false，没进去
set.contains("a");    // O(1)
set.remove("a");
```

```java [TreeSet 排序]
Set<Integer> sorted = new TreeSet<>(Comparator.reverseOrder());
sorted.addAll(List.of(3, 1, 2));   // 结果：3, 2, 1
```

```java [去重且保留顺序]
Set<String> ordered = new LinkedHashSet<>();
```
:::

坑：**TreeSet 判重靠 compare 返回 0，不是 equals**。两个对象 equals 为 false 但比较结果为 0 时，会被当成同一个元素丢掉。HashSet 则相反，依赖 hashCode。

## 六、遍历与删除

::: code-group
```java [四种遍历]
// 1. 索引循环：需要在过程中用下标时用
for (int i = 0; i < list.size(); i++) {
  System.out.println(list.get(i));
}

// 2. 增强 for：只读遍历首选
for (String s : list) {
  System.out.println(s);
}

// 3. 迭代器：需要在遍历中安全删除时用
Iterator<String> it = list.iterator();
while (it.hasNext()) {
  if (it.next().isEmpty()) it.remove();
}

// 4. forEach：Lambda 写法
list.forEach(System.out::println);
```

```java [遍历中修改的后果]
for (String s : list) {
  if (s.isEmpty()) list.remove(s);   // ConcurrentModificationException
}

list.removeIf(String::isEmpty);      // 正确写法，内部走迭代器
```
:::

增强 for 底层就是迭代器，所以只要在遍历期间增删集合本身（不是迭代器 remove），modCount 变了就抛 ConcurrentModificationException。要删就 `removeIf` 或 `Iterator.remove`，要改结构就先收集再批量处理。

## 七、工具类与选型速查

`Collections` 提供的是静态工具方法：`sort`、`reverse`、`unmodifiableList`、`emptyList`、`singletonList`。按 key 排序查得快时用 `EnumMap`，枚举做元素时用 `EnumSet`，两者比 HashMap、HashSet 更省内存、迭代有序。

| 需求                  | 选                                    |
| --------------------- | ------------------------------------- |
| 要索引、要随机访问    | ArrayList                             |
| 频繁在头部增删        | LinkedList                            |
| 先进先出队列          | ArrayDeque                            |
| 栈（后进先出）        | ArrayDeque                            |
| 按优先级出队          | PriorityQueue                         |
| 线程安全队列          | BlockingQueue / ConcurrentLinkedQueue |
| 只去重                | HashSet                               |
| 去重且保留插入顺序    | LinkedHashSet                         |
| 元素要自动排序        | TreeSet                               |
| 键值查找              | HashMap                               |
| 键值 + 顺序           | LinkedHashMap                         |
| 键值 + 排序／范围查找 | TreeMap                               |
| 多线程读写            | ConcurrentHashMap                     |

## 小结

::: info 📖 相关资源
- [Java 集合框架官方教程](https://docs.oracle.com/javase/tutorial/collections/) - Oracle 的 Interfaces 与 Implementations
- [JavaGuide · 集合](https://javaguide.cn/java/collection/java-collection-questions-01.html) - HashMap 扩容与红黑树的常见面试追问
:::

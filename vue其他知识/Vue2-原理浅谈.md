# Vue2-原理

本文重点讲述Vue2渲染的整体流程,包括
- 数据响应的实现（双向绑定）、
- 模板编译、
- virtual dom原理等

## 前端主流框架部分特点
参考尤雨溪的live [不吹不黑聊聊前端框架](https://www.zhihu.com/lives/846356429794336768)

现代主流框架均使用一种`数据=>视图`的方式，隐藏了繁琐的dom操作，采用了声明式编程（Declarative Programming）替代了过去的类jquery的命令式编程（Imperative Programming)

    $("#xxx").text("xxx");
    // 变为下者
    view = render(state);

前者我们详细地写了如何去操作dom节点的过程，我们命令什么，它就操作什么；  
后者则是我们输入了数据状态，输出视图（我们不关心中间的过程，它们均由框架帮助我们实现）；

前者固然直接，但是当应用变得复杂则代码将难以维护，而后者框架帮我们实现了一系列的操作，无需管理过程，优势显然可见。

**我们需要做：**
1. 数据输出

    为了实现这一点，就是实现如何输入数据，输出视图，我们就会注意到上面的render函数，render函数的实现，主要在对dom性能的优化上，当然实现方式也多种多样，
    - 直接的innerHTML、
    - 使用documentFragment、
    - 还有virtual dom，  

    在不同场景下性能上有所不同，但是框架追求的是在大部分场景中框架已经满足你的优化需求。

2. 监控数据变化

    当然还有数据变化侦测，从而re-render视图

    数据变化侦测中，值得一提的是数据生产者（Producer）和数据消费者（Consumer）之间的联系，这里，我们可以暂且将系统（视图）作为一个数据的消费者，我们的代码设置数据的变化，作为数据的生产者。
    我们这里可以分为`系统不可感知数据变化`和`系统可感知数据变化`。

    - 系统不可感知数据变化

      像React／Angular这类框架并不知道数据什么时候变了，但是它视图什么时候更新呢，比如React就是通过`setState`发信号告诉系统有可能数据变了,然后通过`virtual dom diff`去渲染视图，angular则是有一个脏值检查流程，遍历比对

    - 系统可感知数据变化

      Rx.js ／ vue这一类响应式的，通过`观察者模式`，使用`Observable (可观察对象)，Observer (观察者)(或者是watcher)去订阅`（比如视图渲染这一类，其实也可以当成一个观察者去订阅数据了，后面会提到），系统是可以很准确知道哪里数据变了的，从而也就能实现视图更新渲染。

      **总结：**

      上者系统不可感知数据变化,粒度粗，有时候还得手动优化（比如pureComponet和shouldComponentUpdate)去跳过一些数据不会更新的视图从而提升性能

      下者系统可感知数据变化,粒度细，但是绑定大量观察者，有大量的依赖追踪的内存开销

      Vue2，它采用了`折中粒度`的方式，`粒度到组件级别上`，由`watcher订阅`数据，当数据变化我们可以得知哪个组件数据变了，然后采用`virtual dom diff`的方式去更新相应组件。

### 一个简单的应用

    <div id="app">
    {{ message }}
    </div>

    var app = new Vue({
    el: '#app',
      data: {
        message: 'Hello Vue!'
      }
    })
    app.message = `xxx`; // 发现视图发生了变化

从这里我们也可以提出几个问题，让后面原理的解析更有针对性。
- 数据响应？如何得知数据变化？

  > 还有一个小细节，app.message如何拿到vue data中的message?

- 数据变动如何和视图联系在一起？
- virtual dom是什么？virtual dom diff又是什么？

### 数据响应原理

[**Object.defineProperty**](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性， 并返回这个对象。

Vue数据响应核心是使用了Object.defineProperty方法（IE9+)在对象中定义属性或者修改属性，其中存取描述符很关键的就是get和set,提供给属性getter和setter方法.

可以看下面例子,我们拦截到了数据获取以及设置

      var obj = {};
      Object.defineProperty(obj, 'msg', {
        get () {
          console.log('get')
        },
        set (newValue) {
          console.log('set', newValue)
        }
      });
      obj.msg // get
      obj.msg = 'hello world' // set hello world

      作者：小深刻的秋鼠
      链接：https://juejin.im/post/59f2845e6fb9a0451a759e85
      来源：掘金
      著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

顺便提到那个小细节的问题

  > app.message如何拿到vue data中的message?

其实也是跟Object.defineProperty有关  
Vue在初始化数据的时候会遍历data代理这些数据

      function initData (vm) {
          let data = vm.$options.data
          vm._data = data
          const keys = Object.keys(data)
          let i = keys.length
          while (i--) {
              const key = keys[i]
              proxy(vm, `_data`, key)
          }
          observe(data)
      }

proxy做了哪些操作呢？

      function proxy (target, sourceKey, key) {
        Object.defineProperty(target, key, {
          enumerable: true,
          configurable: true,
          get () {
            return this[sourceKey][key]
          }
          set () {
            this[sourceKey][key] = val
          }
        })
      }

其实就是用Object.defineProperty多加了一层的访问  
因此我们就可以用app.message访问到app.data.message

#### Vue是如何实现数据响应
其实就是解决下面的问题，如何实现$watch?

    const vm = new Vue({
      data:{
        msg: 1,
      }
    })
    vm.$watch("msg", () => console.log("msg变了"));
    vm.msg = 2; //输出「msg变了」

###### 观察者模式（Observer, Watcher, Dep)
Vue实现响应式有三个很重要的类，
- Observer类 -- 主要用于给Vue的数据 `defineProperty`增加getter/setter方法，并且在getter/setter中收集依赖或者通知更新
- Watcher类 -- 用于观察数据（或者表达式）变化然后执行回调函数（其中也有收集依赖的过程），主要用于$watch API和指令上
- Dep类 -- 一个可观察对象，可以有不同指令订阅它（它是多播的）

观察者模式,跟发布／订阅模式有点像

但是其实略有不同，发布／订阅模式是由统一的事件分发调度中心，on则往中心中数组加事件（订阅），emit则从中心中数组取出事件（发布），发布和订阅以及发布后调度订阅者的操作都是由中心统一完成

但是观察者模式则没有这样的中心，观察者订阅了可观察对象，当可观察对象发布事件，则就直接调度观察者的行为，所以这里观察者和可观察对象其实就产生了一个依赖的关系，这个是发布／订阅模式上没有体现的。

> 其实Dep就是dependence依赖的缩写


.... 此处省略一大段，待以后查看

##### 数据与视图如何联系
我这里摘出一段关键的Vue代码

    class Watcher () {
      constructor (vm, expOrFn, cb, options) {
      }
    }
    updateComponent = () => {
       // hydrating有关ssr本文不涉及
        vm._update(vm._render(), hydrating)
    }
    vm._watcher = new Watcher(vm, updateComponent, noop)
    // noop是回调函数，它是空函数

这个其实就是Watcher和Render的核心关系
还记得我们上面所说的，在执行new Watcher会有一个求值的操作，这里的求值是一个函数表达式,也就是执行updateComponent，执行updateComponent后，会再执行vm._render(),传参数给vm._update(vm._render(), hydrating),收集完依赖以后才结束，这里有两个关键的点，vm._render在做什么？vm._update在做什么？

`vm._rende`

我们看下`Vue.prototype._render`是何方神圣（以下为删减代码）

    Vue.prototype._render = function (): VNode {
       const vm: Component = this
       const {
         render,
         staticRenderFns,
         _parentVnode
       } = vm.$options
       // ...
       let vnode
       try {
         // vm._renderProxy我们直接当成vm，其实就是为了开发环境报warning用的
         vnode = render.call(vm._renderProxy, vm.$createElement)
       } catch (e) {

       }

       // set parent
       vnode.parent = _parentVnode
       return vnode
     }

 所以它这里我们可以看到里面是执行了render函数，render函数来自options，然后返回了vnode
 所以到这里我们可以把我们的目光移到这个render函数从哪里来的
 如果熟悉Vue2的朋友可能知道，Vue提供了一个选项是render就是作为这个函数的，假如没有提供这个选项呢我们不妨看看生命周期

![](https://user-gold-cdn.xitu.io/2017/10/27/9295bd54f93e952dd73147d3ce6692b3?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

我们可以看到`Compile template into render function`（没有template会将el的outerHTML当成template),所以这里就有一个模板编译的过程

### 模板编译
再摘一段核心代码

    const ast = parse(template.trim(), options) // 构建抽象语法树
    optimize(ast, options) // 优化
    const code = generate(ast, options) // 生成代码
    return {
        ast,
        render: code.render,
        staticRenderFns: code.staticRenderFns
    }

上面分成三部分
- 将模板转化为抽象语法树
- 优化抽象语法树
- 根据抽象语法树生成代码

那里面具体做了什么呢？这里我简略讲一下

- 第一部分其实就是各种正则了，对左右开闭标签的匹配以及属性的收集，通过栈的形式，不断出栈入栈去匹配以及更换父节点，最后生成一个对象，包含children,children又包含children的对象
- 第二部分则是以第一部分为基础，根据节点类型找出一些静态的节点并标记
- 第三部分就是生成render函数代码了

所以最后会产生这样的效果

模板

      <div id="container">
        <p>Message is: {{ message }}</p>
      </div>

生成render函数

    (function() {
        with (this) {
            return _c('div', {
                attrs: {
                    "id": "container"
                }
            }, [_c('p', [_v("Message is: " + _s(message))])])
        }
    })

这里我们又可以结合上面的代码了
  > vnode = render.call(vm._renderProxy, vm.$createElement

其中`_c`就是`vm.$createElement`

> 我们将virtual dom具体实现移到下一节，以防影响我们Vue2主线

vm.$createElement其实就是一个创建vnode的一个API

知道了`vm._render()`创建了vnode返回，接下来就是`vm._update`了

`vm._update`

`vm._update`部分也是跟virtual dom有关，下一节具体介绍，我们可以先透露下函数的功能，顾名思义，就是更新视图，根据传入的vnode更新到视图中。


######数据到视图的整体流程

所以到这里我们就可以得出一个数据到视图的整体流程的结论了

- 在组件级别，vue会执行一个new Watcher
- new Watcher首先会有一个求值的操作，它的求值就是执行一个函数，这个函数会执行render，其中可能会有编译模板成render函数的操作，然后生成vnode(virtual dom)，再将virtual dom应用到视图中
- 其中将virtual dom应用到视图中（这里涉及到diff后文会讲），一定会对其中的表达式求值(比如{{message}},我们肯定会取到它的值再去渲染的），这里会触发到相应的getter操作完成依赖的收集
- 当数据变化的时候，就会notify到这个组件级别的Watcher,然后它还会去求值，从而重新收集依赖，并且重新渲染视图

我们再一次来看看Vue官网的这张图

![](https://user-gold-cdn.xitu.io/2017/10/27/1cd367080449d32f74dc780d592170eb?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

一切顺理成章！


### Virtual DOM

##### 为什么会有Virtual DOM?
做过前端性能优化的朋友应该都知道，DOM操作都是很慢的，我们要减少对它的操作
###### 为啥慢呢？
我们可以尝试打出一层DOM的key

![](https://user-gold-cdn.xitu.io/2017/10/27/1f2dc0ff89ddb239ce270277d4200828?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

我们可以看出它的属性是庞大，更何况这只是一层

同时直接对DOM的操作，就必须很注意一些有可能触发重排的操作。

那Virtual DOM是什么角色呢？它其实就是我们代码到操作DOM的一层缓冲，既然操作DOM慢，那我操作js对象快吧，我就操作js对象，然后最后把这个对象再一起转换成真正的DOM就行了

所以就变成

> 代码 => Virtual DOM( 一个特殊的js对象） => DOM

##### 什么是Virtual DOM
上文其实我们就解答了什么是虚拟DOM,它就是一个特殊的js对象
我们可以看看Vue中的Vnode是怎么定义的？

    export class VNode {
      constructor (
        tag?: string,
        data?: VNodeData,
        children?: ?Array<VNode>,
        text?: string,
        elm?: Node,
        context?: Component,
        componentOptions?: VNodeComponentOptions,
        asyncFactory?: Function
      ) {
        this.tag = tag
        this.data = data
        this.children = children
        this.text = text
        this.elm = elm
        this.ns = undefined
        this.context = context
        this.functionalContext = undefined
        this.key = data && data.key
        this.componentOptions = componentOptions
        this.componentInstance = undefined
        this.parent = undefined
        this.raw = false
        this.isStatic = false
        this.isRootInsert = true
        this.isComment = false
        this.isCloned = false
        this.isOnce = false
        this.asyncFactory = asyncFactory
        this.asyncMeta = undefined
        this.isAsyncPlaceholder = false
      }
    }

用以上这些属性就能来表示一个DOM节点

#### Virtual DOM算法

这里我们讲的就是涉及上面`vm.update`的操作

- 首先是js对象（Virtual DOM）描述树（vm._render)，转换dom插入(第一次渲染）
- 状态变化，生成新的js对象（Virtual DOM），比对新旧对象
- 将变更应用到DOM上，并保存新的js对象（Virtual DOM），重复第二步操作

#### 参考链接
- [Vue2 原理浅谈](https://juejin.im/post/59f2845e6fb9a0451a759e85)

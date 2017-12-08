# vue 实例 知识点归纳

### 列表渲染

![](./images/Jietu20171207-150833.jpg)

### 事件处理

![](./images/Jietu20171207-151051.jpg)

### 事件修饰符

![](./images/Jietu20171207-152046.jpg)

### 条件渲染

![](./images/Jietu20171207-153416.jpg)

### 动态CSS

![](./images/Jietu20171207-154140.jpg)

### 自定义指令

![](./images/Jietu20171207-164434.jpg)

### watch 监控数据 （深度监控，浅度监控）

    var vm = new Vue({
      data: {
        a: 1,
        b: 2,
        c: 3,
        d: 4
      },
      watch: {
        a: function (val, oldVal) {
          console.log('new: %s, old: %s', val, oldVal)
        },
        // 方法名
        b: 'someMethod',
        // 深度 watcher
        c: {
          handler: function (val, oldVal) { /* ... */ },
          deep: true
        },
        // 该回调将会在侦听开始之后被立即调用
        d: {
          handler: function (val, oldVal) { /* ... */ },
          immediate: true
        }
      }
    })
    vm.a = 2 // => new: 2, old: 1
    
注意，不应该使用箭头函数来定义 watcher 函数 (例如 searchQuery: newValue => this.updateAutocomplete(newValue))。理由是箭头函数绑定了父级作用域的上下文，所以 this 将不会按照期望指向 Vue 实例，this.updateAutocomplete 将是 undefined。


# 数据存储

    var  store = {
    	save (key,value){
    		localStorage.setItem(key, JSON.stringify(value))
    	},
    	fetch (key){
    		return JSON.parse(localStorage.getItem(key))||[];
    	}
    }

### [Window.localStorage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage)
localStorage 属性允许你访问一个 local Storage 对象。localStorage 与 sessionStorage 相似。不同之处在于，存储在 localStorage 里面的数据没有过期时间（expiration time），而存储在 sessionStorage 里面的数据会在浏览器会话（browsing session）结束时被清除，即浏览器关闭时。

应该注意的是，无论是 localStorage 还是 sessionStorage 中保存的数据都仅限于该页面的协议。

    localStorage.setItem('myCat', 'Tom');

### [JSON.stringify()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
JSON.stringify() 方法是将一个JavaScript值(对象或者数组)转换为一个 JSON字符串，如果指定了replacer是一个函数，则可以替换值，或者如果指定了replacer是一个数组，可选的仅包括指定的属性。

    JSON.stringify(value[, replacer [, space]])
    
例子：

    JSON.stringify({});                        // '{}'
    JSON.stringify(true);                      // 'true'
    JSON.stringify("foo");                     // '"foo"'
    JSON.stringify([1, "false", false]);       // '[1,"false",false]'
    JSON.stringify({ x: 5 });                  // '{"x":5}'

### [JSON.parse()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

JSON.parse() 方法用来解析JSON字符串，构造由字符串描述的JavaScript值或对象。提供可选的reviver函数用以在返回之前对所得到的对象执行变换(操作)。

    JSON.parse(text[, reviver])

例子：

    JSON.parse('{}');              // {}
    JSON.parse('true');            // true
    JSON.parse('"foo"');           // "foo"
    JSON.parse('[1, 5, "false"]'); // [1, 5, "false"]
    JSON.parse('null');            // null


### [window.location.hash](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/location) 值

尽管 window.location 是一个只读 Location 对象，你仍然可以赋给它一个 DOMString。这意味着您可以在大多数情况下处理 location，就像它是一个字符串一样：window.location = 'http://www.example.com'，是 window.location.href = 'http://www.example.com'的同义词 。

    let oldLocation = location;
    location = newLocation;

### 字符串操作 

 [String.prototype.slice()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/slice) 
 
 slice() 方法提取一个字符串的一部分，并返回一新的字符串。

 
    str.slice(beginSlice[, endSlice])

使用 slice() 创建一个新的字符串

- 下面例子使用 slice() 来创建新字符串:

        var str1 = 'The morning is upon us.';
        var str2 = str1.slice(4, -2);

        console.log(str2); // OUTPUT: morning is upon u
给 slice() 传入负值索引

- 下面的例子在 slice() 使用了负值索引:

        var str = 'The morning is upon us.';
        str.slice(-3);     // returns 'us.'
        str.slice(-3, -1); // returns 'us'
        str.slice(0, -1);  // returns 'The morning is upon us'

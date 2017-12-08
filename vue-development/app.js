
//存取localStorage中的数据
var  store = {
	save (key,value){
		localStorage.setItem(key, JSON.stringify(value))
	},
	fetch (key){
		return JSON.parse(localStorage.getItem(key))||[];
	}
}

// var list = [
// 	{
// 		title : '吃饭',
// 		isChecked : false
// 	},{
// 		title : '睡觉',
// 		isChecked : true
// 	}
// ];

var list = store.fetch('exam');

//过滤有三种情况  all undone done
var filters = {
	all : function(list){
		return list;
	},

	done : function(list){ 
		return list.filter(function(item){
			return item.isChecked;
		});
	},

	undone : function(list){
		return list.filter(function(item){
			return !item.isChecked;
		});
	},
}

var vm = new Vue({
	el : '.main',
	data : {
		list : list,
		todo : '',
		edtorToDos : '' , //记录正在编辑的数据
		visibility : 'all' // 通过这个值进行数据筛选
	},
	watch : {
		// list : function(){ //监控list这个属性，当这个属性发生变化时候 执行这个函数
		// 	store.save('exam',this.list);
		// }
		 
		list : {
			handler : function(){
				store.save('exam',this.list);
			},
			deep : true
		}
	},
	computed : {
		noCheckeLength : function(){
			return this.list.filter(function(item){
                return !item.isChecked
            }).length
		},
		filterList : function(){
			

			return filters[this.visibility](list) ? filters[this.visibility](list) : list;
		}
	},
	methods : {
		addToDo (ev) { // 添加
			// 事件处理函数指向的是当前的根实例
			this.list.push({
				title : this.todo,
				isChecked : false
			})
			this.todo = '';
		},

		deleteToDo (item){ //删除
			var index = this.list.indexOf(item);
			this.list.splice(index,1)
		},

		edtorToDo (todo){ // 编辑
			this.edtorToDos = todo;
		},

		editedToDo (dd){ //
			this.edtorToDos = '';
		}
	},
	directives : {
		"focus":{
			update(el,binding){
				if(binding.value){
					el.focus()
				}
			}
		}
	}
});

function watchHashChange(){
	var hash = window.location.hash.slice(1);
	vm.$data.visibility = hash;
}

window.addEventListener('hashchange',watchHashChange);
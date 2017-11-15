window.onload = function(){
	var socket = new Socket('ws://192.168.10.200:9001');
	socket.connect();

	//获取tab id 
	var tabId = '';
	function getTabId() {
		chrome.tabs.getAllInWindow(function(d){
			d.forEach(function(item, i){
				if (item.title == '匹配人物') {
					tabId = item.id;
				};
			});
		});
	}

	//收到需要处理的消息
	socket.on('new_item', function(data){
		_showDataOnPage("有一个新的图片需要处理");
	});

	//将data数据以桌面通知的方式显示给用户  
	function _showDataOnPage(data){ 
		//获取tab id 
	  	getTabId();

	    //显示一个桌面通知  
	    if(chrome.notifications){  
	        var opt = {  
	            type: 'basic',  
	            title: '通知的title!',  
	            message: data,  
	            iconUrl: '../img/icon.png',  
	        }  
	        chrome.notifications.create('', opt, function(id){ 
	        	chrome.notifications.onClicked.addListener(function(){
					chrome.tabs.update(tabId, {"selected":true});
			  	}); 
	            setTimeout(function(){  
	            chrome.notifications.clear(id, function(){});  
	            }, 3000);  
	        });  
	    }else{  
	        alert('亲，你的浏览器不支持啊！');  
	    }  
	    
	} 
}

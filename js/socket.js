function Socket(url) {
    this.url = url;
    this.ws = null;
    this.invokeObj = {};
    this.commonFunc = {};
    //this.heartbeatTimeoutCount = 0; //心跳超时次数
    this.reconnectCount = 1; //重连次数
    this.reconnectTime = 5000;//重连时间
    this.checkPeriod = 10000; //心跳间隔
    this.isConnection = false; //是否成功连接
    this.connectionSuccessCallbackList = [];
    this.heartbeatInterVal = null; //心跳循环
    this.startReconnection = false; //是否开启重连
    this.message = null;
}
//设置钩子
Socket.prototype.setPushHook = function(func) {
    if (typeof func == 'function') {
        this.pushHook = func;
    }
};
Socket.prototype.send = function(data) {
    if (typeof data != 'string') {
        data = JSON.stringify(data);
    }
    if (this.ws && this.ws.readyState == 1) {
        this.ws.send(data);
    } else {
        if (!this.startReconnection) {
            this.reconnection(data);
        }
    }
};
Socket.prototype.successFunc = function(data) {
    console.group('websocket接受数据');
    var data = JSON.parse(data);
    var type = data.data_type;
    try{
        if (type) {
            //返回的msg
            this.callFunc(data, type);
        }
    } catch(e) {
        console.error(e)
    }
    console.groupEnd();
};
Socket.prototype.callFunc = function(curData, type) {
    //调用全局方法
    if (typeof this.commonFunc[type] == 'function') {
        console.info('调用全局回调方法 类型：' + type);
        this.commonFunc[type](curData.message);
    }
    //根据当前的url找到对应的调用方法
    var obj = this.invokeObj;
    //判断是否是方法
    if (typeof obj == 'object' && typeof obj[type] == 'function') {
        console.info('调用当前页面回调方法 类型：' + type);
        obj[type](curData.data);
    } else {
        delete this.invokeObj[type];
    }
};
//心跳检测
Socket.prototype.heartbeat = function() {
    var that = this;
    var headerbeatData = {type: "heartbeat", message: "ok"};
    function heartbeat() {
        console.count('心跳包')
        that.send(headerbeatData);
    }
    this.heartbeatInterVal = setInterval(heartbeat, that.checkPeriod);
    return false;
};
//开启websocket
Socket.prototype.connect = function(msg) {
    var that = this;
    if(!that.url) {
        console.error('socket url 不存在');
        return false;
    }
    try {
        this.startReconnection = false;
        this.ws = new WebSocket(this.url);
    } catch(e) {
        if (!this.startReconnection) {
            this.reconnection();
        }
        return false;
    }
    console.info('连接字符串：' + this.url);
    this.ws.onopen = function() {
        that.reconnectCount = 1; //重连次数
        that.startReconnection = false; //初始化
        console.info('WebSocket连接成功');
        if (!that.isConnection) {
            that.isConnection = true;
        }
        //链接的时候需要发送消息给服务器
        if (msg) {
            that.send(msg);
        }
        that.heartbeat();
    };
    this.ws.onclose = function() {
        console.warn("WebSocket断开连接");
        if (!that.startReconnection) {
            that.reconnection();
        }
        that.clearHeartbeatInterVal();
    };
    this.ws.onerror = function() {
        console.error('WebSocket错误');
    };
    this.ws.onmessage = function(e) {
        var data = e && e.data;
        if (data) {
            that.successFunc(data);
        }
    }
};
Socket.prototype.clearHeartbeatInterVal = function() {
    clearInterval(this.heartbeatInterVal); //停止心跳连接;
};
Socket.prototype.reconnection = function(msg) {
    this.clearHeartbeatInterVal();
    console.info('间隔：' + this.reconnectTime + 'ms，次数：' + this.reconnectCount);
    var that = this;
    setTimeout(function() {
        that.connect(msg);
    }, this.reconnectTime);
    this.reconnectCount += 1;
    this.startReconnection = true; //标记开启重连
};
Socket.prototype.onConnectionSuccessCallback = function(func) {
    this.connectionSuccessCallbackList.push(func);
};
Socket.prototype.on = function(key, func) {
    if (key && typeof func == 'function') {
        this.invokeObj[key] = func
    }
};
Socket.prototype.off = function(key) {
    delete this.invokeObj[key];
};
Socket.prototype.offAll = function() {  
    this.invokeObj = {};
};
Socket.prototype.onCommon = function(key, func) {
    if (typeof func == 'function') {
        this.commonFunc[key] = func;
    }
};
Socket.prototype.offCommon = function(key) {
    delete this.commonFunc[key];
};
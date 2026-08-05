// ============================================================
// 统一时间指针引擎（公共）：轨迹 / 视频 / 数据视图通过 currentTime 同步
// - 监听者用 on(fn) 注册，T 变化时回调收到 (time, source)
// - source 标识发起方('trajectory'|'video')，监听者据此跳过自身回写，避免循环触发
// ============================================================
var TimeClock={
  currentTime:null,
  source:null,
  _listeners:[],
  set:function(t,src){
    this.currentTime=t;
    this.source=src||null;
    for(var i=0;i<this._listeners.length;i++){
      try{this._listeners[i](t,this.source)}catch(e){}
    }
  },
  on:function(fn){this._listeners.push(fn);return fn},
  off:function(fn){var i=this._listeners.indexOf(fn);if(i>-1)this._listeners.splice(i,1)}
};

// "HH:mm" 转分钟数，供按时间定位使用
function timeToMinutes(t){var p=String(t||'').split(':');return(parseInt(p[0])||0)*60+(parseInt(p[1])||0)}

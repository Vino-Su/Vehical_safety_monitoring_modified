// ============================================================
// 公共视频工作台组件（monitor-map / running 两页共用）
// 能力：面板态/全屏态、摄像头切换、截图、本地录像、全屏、多路宫格(1/4/9)、进度条、T驱动
// 时间轴：实时 T=now（无进度条）；回放 T 由进度条驱动，与轨迹/数据通过 TimeClock 联动
// ============================================================

var VideoWorkbench=(function(){
  // 每个挂载实例的状态
  var instances={};

  function findVehicle(vidOrPlate){
    var v=(typeof vehicleData!=='undefined')?vehicleData.find(function(d){return d.id===vidOrPlate||d.plate===vidOrPlate}):null;
    return v||((typeof vehicleData!=='undefined')?vehicleData[0]:null);
  }

  function getInstance(containerId){return instances[containerId]}

  // 构建录像段伪数据（按时间轴生成，演示用）
  function buildSegments(v,timeFrom,timeTo){
    var fromMin=timeToMinutes(timeFrom),toMin=timeToMinutes(timeTo);
    var segs=[],start=fromMin;
    while(start<toMin){
      var end=Math.min(start+5,toMin);
      segs.push({
        from:String(Math.floor(start/60)).padStart(2,'0')+':'+String(start%60).padStart(2,'0'),
        to:String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0'),
        size:(200+Math.floor(Math.random()*320))+'MB'
      });
      start=end;
    }
    return segs;
  }

  // 渲染单个摄像头占位画面（演示态）
  function camStageHtml(cam,v){
    var isOffline=v&&v.status==='offline';
    if(isOffline){
      return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5)"><div style="text-align:center"><div style="font-size:24px;margin-bottom:4px">⚠</div><p style="font-size:11px;font-weight:600;color:#ff4d4f">视频流不可用</p><p style="font-size:10px;margin-top:2px;color:rgba(255,255,255,.4)">车辆离线</p></div></div>';
    }
    return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.45)"><div style="text-align:center"><div style="font-size:22px;margin-bottom:4px">'+cam.icon+'</div><p style="font-size:11px">'+cam.name+'</p><p style="font-size:10px;margin-top:2px">RTSP/RTMP · H.264/H.265</p></div></div>';
  }

  // 摄像头标签条（贴在画面左上）
  function camTagHtml(cam){return '<div style="position:absolute;top:6px;left:6px;padding:1px 6px;background:'+cam.color+';color:#fff;font-size:10px;border-radius:3px;z-index:2">'+cam.name+'</div>'}

  function cameraActionsHtml(st,cam,camIndex){
    return '<div class="vw-camera-actions">'+
      '<button type="button" class="vw-camera-action" title="截图 '+cam.name+'" aria-label="截图 '+cam.name+'" onclick="event.stopPropagation();VideoWorkbench.snapshot(\''+st.id+'\','+camIndex+')">📷</button>'+
      '<button type="button" class="vw-camera-action" title="录制 '+cam.name+'" aria-label="录制 '+cam.name+'" onclick="event.stopPropagation();VideoWorkbench.record(\''+st.id+'\','+camIndex+')">⏺</button>'+
    '</div>';
  }

  // 主舞台：单路大画面
  function renderMainStage(st){
    var cam=VEHICLE_CAMERAS[st.camIndex];
    var v=findVehicle(st.vehicleId);
    var modeTag=st.mode==='live'?'<span style="color:#52c41a;font-size:10px">● 实时</span>':'<span style="color:#fa8c16;font-size:10px">⏪ 回放 '+(st.currentTime||'--:--')+'</span>';
    return '<div class="vw-main-stage">'+
      camTagHtml(cam)+
      '<div class="vw-stage-status">'+modeTag+'</div>'+
      camStageHtml(cam,v)+cameraActionsHtml(st,cam,st.camIndex)+
    '</div>';
  }

  // 多路宫格（1/4/9）
  function renderGrid(st){
    var v=findVehicle(st.vehicleId);
    var count=st.gridCount;
    var cols=count===1?1:count===4?2:3;
    var cams=VEHICLE_CAMERAS.slice(0,count);
    return '<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:6px;flex:1;min-height:0">'+
      cams.map(function(cam,i){
        return '<div style="position:relative;background:#000;border-radius:6px;overflow:hidden;cursor:pointer" onclick="VideoWorkbench.selectCam(\''+st.id+'\','+i+')">'+
          camTagHtml(cam)+camStageHtml(cam,v)+cameraActionsHtml(st,cam,i)+'</div>';
      }).join('')+
    '</div>';
  }

  // 摄像头缩略图条
  function renderThumbs(st){
    return '<div class="vw-thumb-grid">'+
      VEHICLE_CAMERAS.map(function(cam,i){
        var active=i===st.camIndex?' active':'';
        return '<button type="button" class="vw-thumb'+active+'" onclick="VideoWorkbench.selectCam(\''+st.id+'\','+i+')" aria-label="切换至'+cam.name+'">'+
          '<span class="vw-thumb-label" style="background:'+cam.color+'">'+cam.name.slice(0,2)+'</span>'+
          '<span class="vw-thumb-icon">'+cam.icon+'</span>'+
          '<span class="vw-thumb-name">'+cam.name+'</span>'+
        '</button>';
      }).join('')+
    '</div>';
  }

  // 进度条（仅回放模式显示，贴在视频下方）
  function renderProgressBar(st){
    if(st.mode!=='playback')return '';
    var pts=st.segments||[];
    var total=timeToMinutes(st.endTime)-timeToMinutes(st.startTime)||1;
    var cur=timeToMinutes(st.currentTime)-timeToMinutes(st.startTime);
    var pct=Math.max(0,Math.min(100,cur/total*100));
    var segMarks=pts.map(function(s){
      var sp=(timeToMinutes(s.from)-timeToMinutes(st.startTime))/total*100;
      return '<div style="position:absolute;left:'+sp+'%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.15)"></div>';
    }).join('');
    return '<div class="vw-playback">'+
      renderPlaybackQuery(st)+
      '<div class="vw-progress-wrap">'+
        '<input type="range" class="vw-range" min="'+timeToMinutes(st.startTime)+'" max="'+timeToMinutes(st.endTime)+'" value="'+timeToMinutes(st.currentTime)+'" style="width:100%" oninput="VideoWorkbench.seekPlayback(\''+st.id+'\',parseInt(this.value))">'+
        '<div class="vw-progress-track">'+
          '<div class="vw-progress-value" style="width:'+pct+'%"></div>'+
          segMarks+
        '</div>'+
      '</div>'+
      '<div class="vw-time-labels"><span>'+st.startTime+'</span><span id="vwCurTime_'+st.id+'">'+(st.currentTime||'--:--')+'</span><span>'+st.endTime+'</span></div>'+
      '<div class="vw-playback-actions">'+
        '<button class="ant-btn ant-btn-xs" onclick="VideoWorkbench.togglePlay(\''+st.id+'\')" id="vwPlay_'+st.id+'">▶ 播放</button>'+
        '<button class="ant-btn ant-btn-xs" onclick="VideoWorkbench.backToLive(\''+st.id+'\')">回到实时</button>'+
        '<select class="ant-input" style="height:20px;font-size:11px;padding:0 2px" onchange="VideoWorkbench.setSpeed(\''+st.id+'\',this.value)"><option value="1">1x</option><option value="2">2x</option><option value="4">4x</option><option value="8">8x</option></select>'+
      '</div>'+
    '</div>';
  }

  function renderPlaybackQuery(st){
    return '<div class="vw-history-query">'+
      '<input class="ant-input" type="date" value="'+st.playbackDate+'" aria-label="回放日期" onchange="VideoWorkbench.setPlaybackDate(\''+st.id+'\',this.value)">'+
      '<div class="vw-history-times"><input class="ant-input" type="time" value="'+st.startTime+'" aria-label="回放开始时间" onchange="VideoWorkbench.setPlaybackRange(\''+st.id+'\',this.value,null)"><span>至</span><input class="ant-input" type="time" value="'+st.endTime+'" aria-label="回放结束时间" onchange="VideoWorkbench.setPlaybackRange(\''+st.id+'\',null,this.value)"></div>'+
      '<button class="ant-btn ant-btn-xs ant-btn-primary vw-query-button" onclick="VideoWorkbench.queryRecordings(\''+st.id+'\')">查询</button>'+
    '</div>';
  }

  function renderVehicleSelector(st,plate){
    if(!st.onSelectVehicle)return '<span>'+plate+'</span>';
    return '<select class="ant-input vw-vehicle-select" aria-label="选择视频车辆" onchange="VideoWorkbench.selectVehicle(\''+st.id+'\',this.value)">'+
      vehicleData.map(function(item){return '<option value="'+item.id+'"'+(item.id===st.vehicleId?' selected':'')+'>'+item.plate+'</option>'}).join('')+
    '</select>';
  }

  function render(st){
    var v=findVehicle(st.vehicleId);
    var plate=v?v.plate:'未选择';
    var el=document.getElementById(st.id);
    if(!el)return;
    var stageHtml=st.layout==='multi'?renderGrid(st):renderMainStage(st);
    var html=
      '<div class="vw-workbench vw-layout-'+st.layout+'">'+
      '<div class="vw-toolbar">'+
        '<div class="vw-vehicle-title">'+renderVehicleSelector(st,plate)+(v?'<em>'+v.company+' | '+v.level+'</em>':'')+'</div>'+
        '<div class="vw-tool-actions">'+
          (st.layout==='multi'?'<button class="ant-btn ant-btn-xs" onclick="VideoWorkbench.setGrid(\''+st.id+'\',1)">单路</button><button class="ant-btn ant-btn-xs" onclick="VideoWorkbench.setGrid(\''+st.id+'\',4)">4路</button><button class="ant-btn ant-btn-xs" onclick="VideoWorkbench.setGrid(\''+st.id+'\',9)">9路</button>':'')+
          (st.mode==='live'?'<button class="ant-btn ant-btn-xs" onclick="VideoWorkbench.enterPlayback(\''+st.id+'\')">历史回放</button>':'')+
          (st.isFullscreen?'<button class="ant-btn ant-btn-xs ant-btn-primary vw-exit-fullscreen" onclick="VideoWorkbench.exitFullscreen(\''+st.originId+'\')">退出全屏</button>':'<button class="ant-btn ant-btn-xs" onclick="VideoWorkbench.enterFullscreen(\''+st.id+'\')">⛶ 全屏</button>')+
        '</div>'+
      '</div>'+
      stageHtml+
      (st.layout==='single'?'<div style="margin-top:6px">'+renderThumbs(st)+'</div>':'')+
      renderProgressBar(st)+
      '</div>';
    el.innerHTML=html;
  }

  // ============ 实例方法 ============
  function mount(opts){
    var st={
      id:opts.container.id,
      vehicleId:opts.vehicleId,
      camIndex:0,
      layout:opts.layout||'single',
      gridCount:opts.gridCount||4,
      mode:opts.mode||'live',       // 'live' | 'playback'
      currentTime:opts.currentTime||'08:00',
      startTime:opts.startTime||'08:00',
      endTime:opts.endTime||'14:32',
      segments:opts.segments||[],
      playbackDate:opts.playbackDate||'2026-08-04',
      timeSource:opts.timeSource||'now', // 'now' | 'external'
      onSelectVehicle:opts.onSelectVehicle,
      playing:false,
      speed:1,
      timer:null,
      _listener:null
    };
    instances[st.id]=st;
    // 注册时间监听：外部(轨迹)T变化时，若处于回放则跟随
    st._listener=TimeClock.on(function(t,src){
      if(st.timeSource==='external'&&src!=='video'){
        st.currentTime=t;
        if(st.mode!=='playback'){st.mode='playback'}
        render(st);
      }
    });
    render(st);
    return st;
  }

  function unmount(id){
    var st=instances[id];
    if(!st)return;
    if(st.timer){clearInterval(st.timer);st.timer=null}
    if(st._listener)TimeClock.off(st._listener);
    delete instances[id];
  }

  function setVehicle(id,vid){
    var st=instances[id];if(!st)return;
    st.vehicleId=vid;
    render(st);
  }

  function selectVehicle(id,vid){
    var st=instances[id];if(!st)return;
    st.vehicleId=vid;
    st.camIndex=0;
    if(st.onSelectVehicle)st.onSelectVehicle(vid);
    render(st);
  }

  function selectCam(id,idx){
    var st=instances[id];if(!st)return;
    st.camIndex=idx;
    if(st.layout==='multi')st.gridCount=1; // 点某路时切回单路精看
    st.layout='single';
    render(st);
  }

  function setGrid(id,count){
    var st=instances[id];if(!st)return;
    st.gridCount=count;st.layout='multi';
    render(st);
  }

  // 进入回放模式（由"历史回放"按钮或地图轨迹回放触发）
  function enterPlayback(id,opts){
    var st=instances[id];if(!st)return;
    var v=findVehicle(st.vehicleId);
    st.mode='playback';
    st.startTime=(opts&&opts.startTime)||st.startTime||'08:00';
    st.endTime=(opts&&opts.endTime)||st.endTime||'14:32';
    st.currentTime=(opts&&opts.currentTime)||st.currentTime||st.startTime;
    st.timeSource=(opts&&opts.timeSource)||(st.timeSource==='external'?'external':'internal');
    st.segments=buildSegments(v,st.startTime,st.endTime);
    render(st);
  }

  function setPlaybackDate(id,date){var st=instances[id];if(!st)return;st.playbackDate=date;}

  function setPlaybackRange(id,start,end){
    var st=instances[id];if(!st)return;
    if(start)st.startTime=start;
    if(end)st.endTime=end;
    if(timeToMinutes(st.endTime)<=timeToMinutes(st.startTime)){showFeedback('结束时间应晚于开始时间','error');return}
    if(timeToMinutes(st.currentTime)<timeToMinutes(st.startTime)||timeToMinutes(st.currentTime)>timeToMinutes(st.endTime))st.currentTime=st.startTime;
  }

  function queryRecordings(id){
    var st=instances[id];if(!st)return;
    if(timeToMinutes(st.endTime)<=timeToMinutes(st.startTime)){showFeedback('结束时间应晚于开始时间','error');return}
    st.currentTime=st.startTime;
    st.segments=buildSegments(findVehicle(st.vehicleId),st.startTime,st.endTime);
    render(st);
    showFeedback('已加载 '+st.segments.length+' 段录像');
  }

  function showFeedback(message,type){
    if(typeof showToast==='function'){showToast(message);return}
    if(type==='error'&&typeof console!=='undefined')console.warn(message);
  }

  function seekPlayback(id,minutes){
    var st=instances[id];if(!st)return;
    var tStr=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
    st.currentTime=tStr;
    TimeClock.set(tStr,'video');  // 广播给轨迹等外部视图
    var ct=document.getElementById('vwCurTime_'+id);
    if(ct)ct.textContent=tStr;
    render(st);
  }

  function togglePlay(id){
    var st=instances[id];if(!st)return;
    if(st.mode!=='playback')enterPlayback(id);
    st.playing=!st.playing;
    var btn=document.getElementById('vwPlay_'+id);
    if(st.playing){
      if(btn)btn.innerHTML='⏸ 暂停';
      st.timer=setInterval(function(){
        var m=timeToMinutes(st.currentTime)+1;
        if(m>=timeToMinutes(st.endTime)){st.playing=false;if(btn)btn.innerHTML='▶ 播放';clearInterval(st.timer);st.timer=null;return}
        seekPlayback(id,m);
      },1000/st.speed);
    }else{
      if(btn)btn.innerHTML='▶ 播放';
      if(st.timer){clearInterval(st.timer);st.timer=null}
    }
  }

  function setSpeed(id,s){var st=instances[id];if(!st)return;st.speed=parseInt(s);if(st.playing){if(st.timer)clearInterval(st.timer);togglePlay(id);togglePlay(id)}}

  function backToLive(id){
    var st=instances[id];if(!st)return;
    st.mode='live';st.playing=false;
    if(st.timer){clearInterval(st.timer);st.timer=null}
    st.timeSource='now';
    render(st);
  }

  function snapshot(id,camIndex){
    var st=instances[id];if(!st)return;
    var cam=VEHICLE_CAMERAS[typeof camIndex==='number'?camIndex:st.camIndex]||VEHICLE_CAMERAS[0];
    var message='已保存'+cam.name+'截图';
    if(typeof showToast==='function')showToast(message);else alert(message);
  }

  function record(id,camIndex){
    var st=instances[id];if(!st)return;
    var cam=VEHICLE_CAMERAS[typeof camIndex==='number'?camIndex:st.camIndex]||VEHICLE_CAMERAS[0];
    var message='已开始录制'+cam.name;
    if(typeof showToast==='function')showToast(message);else alert(message);
  }

  // 全屏：撑满视口，承载多路
  function enterFullscreen(id){
    var st=instances[id];if(!st)return;
    var overlay=document.createElement('div');
    overlay.id='vwFullscreen';
    overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:#1a1a2e;display:flex;flex-direction:column;padding:16px';
    var fsState={
      id:'vwFullscreen',
      vehicleId:st.vehicleId,
      camIndex:st.camIndex,
      layout:'multi',
      gridCount:st.gridCount,
      mode:st.mode,
      currentTime:st.currentTime,
      startTime:st.startTime,endTime:st.endTime,
      playbackDate:st.playbackDate,
      segments:st.segments,
      timeSource:st.timeSource,
      isFullscreen:true,
      originId:id,
      playing:false,speed:st.speed,timer:null,_listener:null
    };
    instances['vwFullscreen']=fsState;
    fsState._listener=TimeClock.on(function(t,src){
      if(fsState.timeSource==='external'&&src!=='video'){fsState.currentTime=t;if(fsState.mode!=='playback')fsState.mode='playback';render(fsState)}
    });
    document.body.appendChild(overlay);
    render(fsState);
  }

  function exitFullscreen(id){
    var fs=instances['vwFullscreen'];
    if(fs){if(fs.timer){clearInterval(fs.timer);fs.timer=null}if(fs._listener)TimeClock.off(fs._listener);delete instances['vwFullscreen']}
    var overlay=document.getElementById('vwFullscreen');if(overlay)overlay.remove();
  }

  return {
    mount:mount,unmount:unmount,setVehicle:setVehicle,selectVehicle:selectVehicle,selectCam:selectCam,setGrid:setGrid,
    enterPlayback:enterPlayback,seekPlayback:seekPlayback,togglePlay:togglePlay,setSpeed:setSpeed,
    setPlaybackDate:setPlaybackDate,setPlaybackRange:setPlaybackRange,queryRecordings:queryRecordings,
    backToLive:backToLive,snapshot:snapshot,record:record,
    enterFullscreen:enterFullscreen,exitFullscreen:exitFullscreen,
    getInstance:getInstance,findVehicle:findVehicle
  };
})();

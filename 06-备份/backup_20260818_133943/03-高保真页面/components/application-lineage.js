(function(window){
  'use strict';

  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function toDate(value){return String(value||'').replace('T',' ');}
  function relationLabel(type){return type==='renewal'?'延期':type==='change'?'变更':type==='add_vehicle'?'新增车辆':'初次申请';}
  function statusTone(statusClass,status){
    if(String(statusClass||'').indexOf('success')>-1||status==='active'||status==='passed')return 'success';
    if(String(statusClass||'').indexOf('error')>-1||status==='rejected'||status==='terminated')return 'error';
    if(String(statusClass||'').indexOf('processing')>-1||String(status||'').indexOf('pending_')===0)return 'processing';
    return 'default';
  }
  function family(records,id,getId,getParent,getType,getTime){
    var byId={},current,root,guard=0,all=[],seen={};
    records.forEach(function(record){byId[getId(record)]=record;});
    current=byId[id];
    if(!current)return {current:null,main:[],children:{},count:0};
    root=current;
    while(getParent(root)&&byId[getParent(root)]&&guard++<records.length)root=byId[getParent(root)];
    function visit(record){
      if(!record||seen[getId(record)])return;
      seen[getId(record)]=true;
      all.push(record);
      records.filter(function(item){return getParent(item)===getId(record);}).sort(function(a,b){return getTime(a).localeCompare(getTime(b));}).forEach(visit);
    }
    visit(root);
    var children={};
    all.forEach(function(record){
      if(getType(record)!=='add_vehicle')return;
      var parent=getParent(record);
      (children[parent]||(children[parent]=[])).push(record);
    });
    Object.keys(children).forEach(function(parent){children[parent].sort(function(a,b){return getTime(a).localeCompare(getTime(b));});});
    return {current:current,main:all.filter(function(record){return getType(record)!=='add_vehicle';}).sort(function(a,b){return getTime(a).localeCompare(getTime(b));}),children:children,count:all.length};
  }
  function node(record,current,options,child){
    var id=options.getId(record),type=options.getType(record),status=options.getStatus(record),statusClass=options.getStatusClass(record),tone=statusTone(statusClass,status),isCurrent=id===options.getId(current),parent=options.getParent(record),effect=type==='initial'&&!parent?'':options.getEffect(record,parent),period=options.getPeriod(record),classes='application-lineage-node is-'+tone;
    if(type==='change')classes+=' is-change';
    if(isCurrent)classes+=' is-current';
    if(child)classes+=' application-lineage-child';
    return '<div class="'+classes+'"><div class="application-lineage-node-head"><button type="button" class="ant-btn-link application-lineage-id" data-application-lineage-id="'+esc(id)+'" title="查看申请详情">'+esc(id)+'</button><span class="application-lineage-time">'+esc(toDate(options.getTime(record)))+'</span></div><div class="application-lineage-tags"><span class="ant-tag application-lineage-type">'+esc(options.getTypeLabel(record)||relationLabel(type))+'</span><span class="ant-tag '+esc(statusClass||'ant-tag-default')+'">'+esc(options.getStatusLabel(record)||status||'-')+'</span>'+(isCurrent?'<span class="application-lineage-current-tag">当前查看</span>':'')+'</div>'+(effect?'<div class="application-lineage-effect">'+esc(effect)+'</div>':'')+(period?'<div class="application-lineage-period">有效期 '+esc(period)+'</div>':'')+'</div>';
  }
  function bindNavigation(options){
    var modals=document.querySelectorAll('.ant-modal-mask'),modal=modals.length?modals[modals.length-1]:null;
    if(!modal)return;
    Array.prototype.slice.call(modal.querySelectorAll('[data-application-lineage-id]')).forEach(function(button){
      button.addEventListener('click',function(){
        var target=options.records.filter(function(record){return options.getId(record)===button.getAttribute('data-application-lineage-id');})[0];
        if(target&&typeof options.onView==='function')options.onView(target);
      });
    });
  }
  function open(options){
    var required=['id','records','getId','getParent','getType','getTime','getStatus','getStatusClass','getStatusLabel','getTypeLabel','getEffect','getPeriod'];
    if(!options||required.some(function(key){return typeof options[key]==='undefined';}))return;
    var tree=family(options.records,options.id,options.getId,options.getParent,options.getType,options.getTime);
    if(!tree.current)return;
    var current=tree.current;
    var content='<div class="application-lineage"><div class="application-lineage-summary"><div class="application-lineage-title">申请谱系 <span class="application-lineage-count">关联申请 '+tree.count+' 条</span></div><div class="application-lineage-current">当前查看：<b>'+esc(options.getId(current))+'</b> · '+esc(options.getTypeLabel(current)||relationLabel(options.getType(current)))+' · '+esc(options.getStatusLabel(current)||options.getStatus(current))+'</div></div><div class="application-lineage-family">';
    if(!tree.main.length){content+='<div class="application-lineage-empty">暂无关联申请</div>';}else{
      tree.main.forEach(function(record){
        content+=node(record,current,options,false);
        var children=tree.children[options.getId(record)]||[];
        if(children.length){content+='<div class="application-lineage-children">';children.forEach(function(child){content+=node(child,current,options,true);});content+='</div>';}
      });
    }
    content+='</div></div>';
    if(typeof window.openModal==='function'){
      window.openModal('版本演进 - '+esc(options.id),content,{width:600,footer:'<button class="ant-btn" onclick="closeModal()">关闭</button>'});
      window.setTimeout(function(){bindNavigation(options);},0);
    }
  }
  window.ApplicationLineage={open:open,relationLabel:relationLabel};
})(window);

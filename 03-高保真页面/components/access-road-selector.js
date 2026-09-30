(function () {
  'use strict';

  function roadScenes(road, index) {
    return typeof window.getRoadApplicationScenes === 'function'
      ? window.getRoadApplicationScenes(road, index)
      : [];
  }

  function addCell(row, value) {
    var cell = document.createElement('td');
    cell.textContent = value || '—';
    row.appendChild(cell);
    return cell;
  }

  window.AccessRoadSelector = {
    open: function (options) {
      var roads = (options.roads || []).map(function (road, index) {
        return { road: road, index: index };
      }).filter(function (entry) {
        var detail = (options.details || {})[entry.road.name] || {};
        return entry.road.status === '开放' &&
          (detail.code ? /^RD/.test(detail.code) : !/区域/.test(entry.road.type || ''));
      });
      var body = '<div class="flex items-center gap-2 mb-3"><input id="roadSearchInput" class="ant-input" placeholder="请输入道路名称搜索" style="width:240px" aria-label="搜索道路名称"><span class="text-xs text-[#00000073]" id="roadSelectCount"></span></div>' +
        '<div style="overflow-x:auto;max-height:400px"><table class="ant-table" style="width:100%;min-width:780px;font-size:13px"><thead><tr><th style="width:40px"><input id="roadSelectAll" type="checkbox" class="ant-checkbox" aria-label="全选道路"></th><th>道路名称</th><th>道路等级</th><th>开放时段</th><th>适用应用场景</th><th>适用业务类型</th></tr></thead><tbody id="roadSelectBody"></tbody></table></div>' +
        '<div id="roadSelectEmpty" class="text-center text-[#00000073] text-sm py-6" style="display:none">暂无符合条件的道路</div>';
      openModal(options.title, body, {
        wide: true,
        width: 960,
        footer: '<button type="button" class="ant-btn" onclick="closeModal()">取消</button><button type="button" class="ant-btn ant-btn-primary" onclick="confirmRoadSelect()">确认选择</button>',
        onOpen: function () {
          var modal = document.getElementById('modal-mask');
          if (!modal) return;
          var tableBody = modal.querySelector('#roadSelectBody');
          var search = modal.querySelector('#roadSearchInput');
          var selectAll = modal.querySelector('#roadSelectAll');
          var count = modal.querySelector('#roadSelectCount');
          var empty = modal.querySelector('#roadSelectEmpty');
          var rows = [];
          roads.forEach(function (entry) {
            var road = entry.road;
            var detail = (options.details || {})[road.name] || {};
            var row = document.createElement('tr');
            var choice = document.createElement('td');
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ant-checkbox ' + options.checkboxClass;
            checkbox.dataset.idx = entry.index;
            checkbox.checked = (options.selected || []).indexOf(entry.index) !== -1;
            choice.appendChild(checkbox);
            row.appendChild(choice);
            addCell(row, road.name);
            addCell(row, detail.level);
            addCell(row, detail.openPeriod);
            addCell(row, roadScenes(road, entry.index).join(' / '));
            addCell(row, detail.availBiz || detail.businessType);
            tableBody.appendChild(row);
            rows.push(row);
          });
          function update() {
            var keyword = search.value.trim();
            var visible = 0;
            rows.forEach(function (row) {
              var matches = !keyword || row.cells[1].textContent.indexOf(keyword) !== -1;
              row.style.display = matches ? '' : 'none';
              if (matches) visible++;
            });
            count.textContent = '共 ' + visible + ' 条开放道路';
            empty.style.display = visible ? 'none' : '';
            selectAll.checked = visible > 0 && rows.filter(function (row) { return row.style.display !== 'none'; }).every(function (row) { return row.querySelector('input').checked; });
          }
          search.addEventListener('input', update);
          tableBody.addEventListener('change', update);
          selectAll.addEventListener('change', function () {
            rows.forEach(function (row) {
              if (row.style.display !== 'none') row.querySelector('input').checked = selectAll.checked;
            });
          });
          update();
        }
      });
    }
  };
})();

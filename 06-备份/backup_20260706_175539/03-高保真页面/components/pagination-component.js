/**
 * Pagination 分页组件（符合 2.10 规范）
 * 用法：
 *   1. 在页面引入：<script src="../../components/pagination-component.js"></script>
 *   2. HTML 中放置容器：<div id="paginationBar"></div>
 *   3. JS 中初始化：
 *      var pager = new Pagination({
 *        container: 'paginationBar',   // 容器 ID
 *        pageSize: 10,                 // 每页条数（默认10）
 *        pageSizeOptions: [10, 20, 50, 100], // 可切换条数选项
 *        size: 'medium',               // 尺寸档位：'medium'(32px) 或 'small'(24px)，默认 'medium'
 *        onPageChange: function(page, size) {
 *          renderMyList(page, size);
 *        },
 *        onPageSizeChange: function(size) {
 *          // 每页条数变化时的单独回调（可选）
 *        }
 *      });
 *
 *   4. 更新总数据量：pager.setTotal(totalCount);
 *   5. 重置到第一页：pager.reset();
 *   6. 销毁：pager.destroy();
 */
(function (global) {
  'use strict';

  // ========== 设计令牌映射（项目中未定义 CSS 变量，硬编码色值） ==========
  var TOKENS = {
    primary: '#1677ff',
    primaryHover: '#4096ff',
    textGrey3: '#00000073',
    textGrey4: '#00000040',
    textWhite1: '#ffffff',
    neutral1: '#f2f3f5',
    borderDefault: '#DCDFE4',
    borderHover: '#86909C',
    radiusS: '2px',
    btnHeightMd: '32px',
    btnHeightSm: '24px',
    iconSizeMd: 20,
    iconSizeSm: 16,
    fontSizePrompt: '12px',
    fontSizeNormal: '14px',
    fontSizeOption: '12px',
    gap: '8px'
  };

  // ========== 尺寸档位配置 ==========
  var SIZE_CONFIG = {
    medium: {
      height: TOKENS.btnHeightMd,
      iconSize: TOKENS.iconSizeMd,
      pageBtnPadding: '0 12px',
      fontSize: TOKENS.fontSizeNormal,
      arrowBtnSize: TOKENS.btnHeightMd,
      arrowPadding: '0 8px',
      selectHeight: TOKENS.btnHeightMd,
      selectFontSize: TOKENS.fontSizeOption
    },
    small: {
      height: TOKENS.btnHeightSm,
      iconSize: TOKENS.iconSizeSm,
      pageBtnPadding: '0 8px',
      fontSize: TOKENS.fontSizePrompt,
      arrowBtnSize: TOKENS.btnHeightSm,
      arrowPadding: '0 6px',
      selectHeight: TOKENS.btnHeightSm,
      selectFontSize: TOKENS.fontSizeOption
    }
  };

  // ========== 箭头 SVG 图标 ==========
  var SVG_LEFT = '<svg viewBox="0 0 24 24" width="{{iconSize}}" height="{{iconSize}}" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
  var SVG_RIGHT = '<svg viewBox="0 0 24 24" width="{{iconSize}}" height="{{iconSize}}" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';

  // ========== 页码范围计算（含省略号折叠） ==========
  function computePageRange(current, total) {
    if (total <= 7) {
      var pages = [];
      for (var i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    // 总页数 > 7 时折叠显示
    var pages = [1];
    var left = Math.max(2, current - 2);
    var right = Math.min(total - 1, current + 2);

    if (left > 2) pages.push('...');
    for (var j = left; j <= right; j++) pages.push(j);
    if (right < total - 1) pages.push('...');
    pages.push(total);
    return pages;
  }

  function Pagination(options) {
    if (!options || !options.container) {
      throw new Error('Pagination: container is required');
    }

    var self = this;
    self._container = document.getElementById(options.container);
    if (!self._container) {
      throw new Error('Pagination: container element #' + options.container + ' not found');
    }

    self._pageSize = options.pageSize || 10;
    self._pageSizeOptions = options.pageSizeOptions || [10, 20, 50, 100];
    self._currentPage = 1;
    self._total = 0;
    self._size = options.size === 'small' ? 'small' : 'medium';
    self._onPageChange = options.onPageChange || function() {};
    self._onPageSizeChange = options.onPageSizeChange || function() {};
    self._destroyed = false;

    self._render();
  }

  Pagination.prototype._getSizeConfig = function() {
    return SIZE_CONFIG[this._size] || SIZE_CONFIG.medium;
  };

  Pagination.prototype._render = function() {
    var self = this;
    if (self._destroyed) return;

    var totalPages = self._getTotalPages();
    var cfg = self._getSizeConfig();
    var cid = self._container.id;

    self._container.style.display = '';

    // 翻页箭头按钮
    var leftArrow = SVG_LEFT.replace(/\{\{iconSize\}\}/g, cfg.iconSize);
    var rightArrow = SVG_RIGHT.replace(/\{\{iconSize\}\}/g, cfg.iconSize);

    // 数字页码按钮
    var pageRange = computePageRange(self._currentPage, totalPages);
    var pageBtnsHtml = '';
    for (var i = 0; i < pageRange.length; i++) {
      var p = pageRange[i];
      if (p === '...') {
        pageBtnsHtml += '<span class="pg-ellipsis" style="display:inline-flex;align-items:center;justify-content:center;height:' + cfg.height + ';padding:' + cfg.pageBtnPadding + ';font-size:' + cfg.fontSize + ';color:' + TOKENS.textGrey3 + ';cursor:default;user-select:none">···</span>';
      } else if (p === self._currentPage) {
        pageBtnsHtml += '<button class="pg-page-item pg-page-active" data-page="' + p + '" style="display:inline-flex;align-items:center;justify-content:center;min-width:' + cfg.height + ';height:' + cfg.height + ';padding:' + cfg.pageBtnPadding + ';font-size:' + cfg.fontSize + ';background:' + TOKENS.primary + ';color:' + TOKENS.textWhite1 + ';border:none;border-radius:' + TOKENS.radiusS + ';cursor:pointer;transition:all .2s;outline:none;font-weight:500">' + p + '</button>';
      } else {
        pageBtnsHtml += '<button class="pg-page-item" data-page="' + p + '" style="display:inline-flex;align-items:center;justify-content:center;min-width:' + cfg.height + ';height:' + cfg.height + ';padding:' + cfg.pageBtnPadding + ';font-size:' + cfg.fontSize + ';background:transparent;color:' + TOKENS.textGrey3 + ';border:1px solid ' + TOKENS.borderDefault + ';border-radius:' + TOKENS.radiusS + ';cursor:pointer;transition:all .2s;outline:none">' + p + '</button>';
      }
    }

    // 每页条数选择器
    var sizeSelectHtml = '<select id="' + cid + '-size" style="height:' + cfg.selectHeight + ';font-size:' + cfg.selectFontSize + ';padding:0 8px 0 12px;border:1px solid #d9d9d9;border-radius:6px;outline:none;background:#fff;cursor:pointer;min-width:80px">';
    for (var s = 0; s < self._pageSizeOptions.length; s++) {
      var opt = self._pageSizeOptions[s];
      sizeSelectHtml += '<option value="' + opt + '"' + (opt === self._pageSize ? ' selected' : '') + '>' + opt + '</option>';
    }
    sizeSelectHtml += '</select>';

    // 数据统计文本
    var statsHtml = '<span class="pg-stats" style="font-size:' + TOKENS.fontSizePrompt + ';color:' + TOKENS.textGrey4 + '">共 <b style="color:' + TOKENS.textGrey4 + '">' + self._total + '</b> 条</span>';

    // 组装完整 HTML
    var html =
      '<div class="pg-wrapper" style="display:flex;align-items:center;justify-content:flex-end;gap:' + TOKENS.gap + ';margin-top:16px;font-size:' + cfg.fontSize + ';color:' + TOKENS.textGrey3 + '">' +
        statsHtml +
        sizeSelectHtml +
        '<span style="font-size:' + TOKENS.fontSizePrompt + ';color:' + TOKENS.textGrey4 + '">条/页</span>' +
        '<button id="' + cid + '-prev" class="pg-arrow" style="display:inline-flex;align-items:center;justify-content:center;height:' + cfg.arrowBtnSize + ';width:' + cfg.arrowBtnSize + ';padding:' + cfg.arrowPadding + ';border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;transition:all .2s;outline:none">' + leftArrow + '</button>' +
        pageBtnsHtml +
        '<button id="' + cid + '-next" class="pg-arrow" style="display:inline-flex;align-items:center;justify-content:center;height:' + cfg.arrowBtnSize + ';width:' + cfg.arrowBtnSize + ';padding:' + cfg.arrowPadding + ';border:1px solid #d9d9d9;border-radius:6px;background:#fff;cursor:pointer;transition:all .2s;outline:none">' + rightArrow + '</button>' +
      '</div>';

    self._container.innerHTML = html;
    self._bindEvents();
    self._updateButtons();
  };

  Pagination.prototype._bindEvents = function() {
    var self = this;
    if (self._destroyed) return;

    var cid = self._container.id;

    // 每页条数切换
    var sizeEl = document.getElementById(cid + '-size');
    if (sizeEl) {
      sizeEl.addEventListener('change', function() {
        if (self._destroyed) return;
        self._pageSize = parseInt(this.value);
        self._currentPage = 1;
        self._render();
        self._onPageSizeChange(self._pageSize);
        self._onPageChange(self._currentPage, self._pageSize);
      });
    }

    // 上一页箭头
    var prevEl = document.getElementById(cid + '-prev');
    if (prevEl) {
      prevEl.addEventListener('click', function() {
        if (self._destroyed) return;
        if (self._currentPage > 1) {
          self._currentPage--;
          self._render();
          self._onPageChange(self._currentPage, self._pageSize);
        }
      });
    }

    // 下一页箭头
    var nextEl = document.getElementById(cid + '-next');
    if (nextEl) {
      nextEl.addEventListener('click', function() {
        if (self._destroyed) return;
        var totalPages = self._getTotalPages();
        if (self._currentPage < totalPages) {
          self._currentPage++;
          self._render();
          self._onPageChange(self._currentPage, self._pageSize);
        }
      });
    }

    // 数字页码按钮
    var pageItems = self._container.querySelectorAll('.pg-page-item');
    for (var i = 0; i < pageItems.length; i++) {
      pageItems[i].addEventListener('click', function() {
        if (self._destroyed) return;
        var page = parseInt(this.getAttribute('data-page'));
        if (page && page !== self._currentPage) {
          self._currentPage = page;
          self._render();
          self._onPageChange(self._currentPage, self._pageSize);
        }
      });
      // Hover 效果（非 Active 态）
      if (!pageItems[i].classList.contains('pg-page-active')) {
        pageItems[i].addEventListener('mouseenter', function() {
          if (self._destroyed) return;
          this.style.background = TOKENS.neutral1;
          this.style.color = TOKENS.textGrey3;
          this.style.borderColor = TOKENS.borderHover;
        });
        pageItems[i].addEventListener('mouseleave', function() {
          if (self._destroyed) return;
          this.style.background = 'transparent';
          this.style.color = TOKENS.textGrey3;
          this.style.borderColor = TOKENS.borderDefault;
        });
      }
    }

    // 箭头按钮 Hover 效果
    var arrows = self._container.querySelectorAll('.pg-arrow');
    for (var a = 0; a < arrows.length; a++) {
      arrows[a].addEventListener('mouseenter', function() {
        if (self._destroyed || this.disabled) return;
        this.style.borderColor = TOKENS.primary;
        this.style.color = TOKENS.primary;
      });
      arrows[a].addEventListener('mouseleave', function() {
        if (self._destroyed) return;
        this.style.borderColor = '#d9d9d9';
        this.style.color = '';
      });
    }
  };

  Pagination.prototype._updateButtons = function() {
    var self = this;
    if (self._destroyed) return;

    var totalPages = self._getTotalPages();
    var cid = self._container.id;

    var prevEl = document.getElementById(cid + '-prev');
    var nextEl = document.getElementById(cid + '-next');

    // 首页时上一页禁用
    if (prevEl) {
      var isPrevDisabled = self._currentPage <= 1;
      prevEl.disabled = isPrevDisabled;
      prevEl.style.opacity = isPrevDisabled ? '0.5' : '1';
      prevEl.style.cursor = isPrevDisabled ? 'not-allowed' : 'pointer';
      if (isPrevDisabled) {
        prevEl.style.pointerEvents = 'none';
      } else {
        prevEl.style.pointerEvents = '';
      }
    }

    // 末页时下一页禁用
    if (nextEl) {
      var isNextDisabled = self._currentPage >= totalPages;
      nextEl.disabled = isNextDisabled;
      nextEl.style.opacity = isNextDisabled ? '0.5' : '1';
      nextEl.style.cursor = isNextDisabled ? 'not-allowed' : 'pointer';
      if (isNextDisabled) {
        nextEl.style.pointerEvents = 'none';
      } else {
        nextEl.style.pointerEvents = '';
      }
    }
  };

  Pagination.prototype._getTotalPages = function() {
    return Math.ceil(this._total / this._pageSize) || 1;
  };

  /** 设置总数据条数，自动刷新分页栏 */
  Pagination.prototype.setTotal = function(total) {
    if (this._destroyed) return;
    this._total = total || 0;
    var totalPages = this._getTotalPages();
    if (this._currentPage > totalPages) {
      this._currentPage = totalPages || 1;
    }
    this._render();
  };

  /** 获取当前页码 */
  Pagination.prototype.getCurrentPage = function() {
    return this._currentPage;
  };

  /** 获取每页条数 */
  Pagination.prototype.getPageSize = function() {
    return this._pageSize;
  };

  /** 重置到第一页 */
  Pagination.prototype.reset = function() {
    if (this._destroyed) return;
    this._currentPage = 1;
    this._render();
    this._onPageChange(this._currentPage, this._pageSize);
  };

  /** 销毁组件，释放事件绑定 */
  Pagination.prototype.destroy = function() {
    this._destroyed = true;
    this._container.innerHTML = '';
  };

  global.Pagination = Pagination;
})(window);
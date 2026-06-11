Add-Type -AssemblyName System.Web

$base = 'D:\claude_code_coding\智能网联汽车安全监测平台\03-高保真页面'
$utf8 = New-Object System.Text.UTF8Encoding $false

# ================= R08+R09+R10: control.html =================
$ctrl = Join-Path $base 'road\catalog\control.html'
$c = [IO.File]::ReadAllText($ctrl, $utf8)

# R08: Change wide:true to width:600 in access config modal (openAccessConfig)
$c = $c.Replace(
  "openModal('差异化准入配置',",
  "openModal('差异化准入配置' + (roadName ? ' - ' + roadName : ''),"
)
# R08: Change {wide:true, footer in openAccessConfig to {width:600, footer
# Target the specific occurrence after openModal('差异化准入配置
$old1 = "    {wide:true, footer:'<button class=`"ant-btn`" onclick=`"closeModal()`">取消</button><button class=`"ant-btn ant-btn-primary`" onclick=`"closeModal()`">保存</button>'})"
$new1 = "    {width:600, footer:'<button class=`"ant-btn`" onclick=`"closeModal()`">取消</button><button class=`"ant-btn ant-btn-primary`" onclick=`"closeModal()`">保存</button>'})"
# Use regex-based replacement for the wide:true in openAccessConfig only
$c = $c -replace '(function openAccessConfig[^}]+)wide:true', '$1width:600'

# R09: Update openAccessConfig to accept roadName param and display it
$c = $c -replace 'function openAccessConfig\(\)', 'function openAccessConfig(roadName)'

# Add road name display field in the access config form
$roadNameField = "'<div class=`"ant-form-item`"><div class=`"ant-form-label`">道路名称</div><div class=`"ant-form-control`"><input class=`"ant-input`" value=`"' + (roadName || '') + '`" disabled></div></div>' +"
$c = $c -replace "(openModal\('差异化准入配置' \+ \(roadName \? ' - ' \+ roadName : ''\),)\s*'", ('$1' + "`n    " + $roadNameField + "`n    '")

# R10: Fix warning logic in openStatusModal
$c = $c -replace 'var hasTasks=action===.暂停..||action===.关闭..;', 'var hasTasks = (action === "暂停" || action === "关闭") && (currentRoadProcessCount > 0);'

[IO.File]::WriteAllText($ctrl, $c, $utf8)
Write-Host 'control.html: R08, R09, R10 done'

# ================= R11+R12: result.html =================
$result = Join-Path $base 'road\evaluation\result.html'
$r = [IO.File]::ReadAllText($result, $utf8)

# R11: Custom tag colors for 条件开放 and 限制开放
$r = $r.Replace("'条件开放':'ant-tag-warning'", "'条件开放':'ant-tag-custom-warning'")
$r = $r.Replace("'限制开放':'ant-tag-error'", "'限制开放':'ant-tag-custom-danger'")

# Add custom tag CSS (if not already present)
$customCSS = @'
    .ant-tag-custom-warning{color:#fa8c16 !important;background:#fff7e6 !important;border-color:#ffd591 !important}
    .ant-tag-custom-danger{color:#ff7a45 !important;background:#fff2e8 !important;border-color:#ffbb96 !important}
'@
if ($r -notmatch 'ant-tag-custom-warning') {
  $r = $r -replace '(</style>)', ($customCSS + '$1')
}

# R12: Add onclick to 手动发起评估 button
$r = $r.Replace('+ 手动发起评估</button>', '+ 手动发起评估</button>').Replace(
  '<button class="ant-btn ant-btn-primary">+ 手动发起评估</button>',
  '<button class="ant-btn ant-btn-primary" onclick="showToast(\'已发起评估请求，评估完成后将自动刷新列表\')">+ 手动发起评估</button>'
)

[IO.File]::WriteAllText($result, $r, $utf8)
Write-Host 'result.html: R11, R12 done'

# ================= R14+R15: log.html =================
$log = Join-Path $base 'road\evaluation\log.html'
$l = [IO.File]::ReadAllText($log, $utf8)

# R14: Fix detail modal score color (add >=50 blue range)
$l = $l -replace "l\.score >= 85 \? '#52c41a' : l\.score >= 70 \? '#fa8c16' : '#ff4d4f'", "l.score >= 85 ? '#52c41a' : l.score >= 70 ? '#fa8c16' : l.score >= 50 ? '#1677ff' : '#ff4d4f'"

# R15: Change detail modal from wide:true to width:700
$l = $l -replace "(openModal\('日志详情 - ' \+ l\.id,[^}]+)\{ wide: true", '$1{ width:700'

[IO.File]::WriteAllText($log, $l, $utf8)
Write-Host 'log.html: R14, R15 done'

Write-Host 'All fixes applied!'
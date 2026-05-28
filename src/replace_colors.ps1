$files = Get-ChildItem -Path "c:\code\New folder (2)\accseo\src\features" -Filter *.tsx -Recurse
$changedFiles = 0
foreach ($file in $files) {
    $original = Get-Content $file.FullName -Raw
    $content = $original
    
    $content = $content -replace "(?i)(bg|background|backgroundColor|bgcolor):\s*'(#ffffff|#fff)'", '$1: ''background.paper'''
    $content = $content -replace "(?i)(bg|background|backgroundColor|bgcolor):\s*'(#f8fafc|#f0f2f5|#f9fafb)'", '$1: ''background.default'''
    $content = $content -replace "(?i)(bg|background|backgroundColor|bgcolor):\s*'(#f1f5f9|#f3f4f6)'", '$1: ''action.hover'''
    
    $content = $content -replace "(?i)(color):\s*'(#334155|#1e293b|#111827|#374151)'", '$1: ''text.primary'''
    $content = $content -replace "(?i)(color):\s*'(#64748b|#6b7280|#94a3b8|#475569|#9ca3af)'", '$1: ''text.secondary'''
    $content = $content -replace "(?i)(color):\s*'(#ffffff|#fff)'", '$1: ''primary.contrastText'''
    
    $content = $content -replace "(?i)border:\s*'1px solid (#e2e8f0|#cbd5e1|#e5e7eb)'", "border: '1px solid', borderColor: 'divider'"
    $content = $content -replace "(?i)borderBottom:\s*'1px solid (#e2e8f0|#cbd5e1|#e5e7eb)'", "borderBottom: '1px solid', borderColor: 'divider'"
    $content = $content -replace "(?i)borderTop:\s*'1px solid (#e2e8f0|#cbd5e1|#e5e7eb)'", "borderTop: '1px solid', borderColor: 'divider'"
    $content = $content -replace "(?i)borderRight:\s*'1px solid (#e2e8f0|#cbd5e1|#e5e7eb)'", "borderRight: '1px solid', borderColor: 'divider'"
    $content = $content -replace "(?i)borderLeft:\s*'1px solid (#e2e8f0|#cbd5e1|#e5e7eb)'", "borderLeft: '1px solid', borderColor: 'divider'"
    $content = $content -replace "(?i)borderBottom:\s*'2px solid (#e2e8f0|#cbd5e1|#e5e7eb)'", "borderBottom: '2px solid', borderColor: 'divider'"
    
    $content = $content -replace "(?i)(borderColor):\s*'(#e2e8f0|#cbd5e1|#e5e7eb)'", '$1: ''divider'''

    if ($original -ne $content) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $changedFiles++
    }
}
Write-Output "Replaced hex colors in $changedFiles files."

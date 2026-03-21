Get-ChildItem -Recurse -File | ForEach-Object {
    try {
        $content = Get-Content $_.FullName -Raw -ErrorAction Stop
        if ($null -ne $content) {
            [regex]::Matches($content, '(?ims)^dcl-.*?^end-.*') |
            ForEach-Object {
                $_.Value
            }
        }
    }
    catch {
        Write-Warning "Skipped file: $($_.FullName)"
    }
} | Out-File "C:/Users/nianv/Documents/Git/tree-sitter-rpgle/test_d_spec.rpgle"

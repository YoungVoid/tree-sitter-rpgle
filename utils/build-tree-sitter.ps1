# Step 1: Generate parser code
Write-Host "Running tree-sitter generate..."
tree-sitter generate

# Step 2: Build parser
Write-Host "Running tree-sitter build..."
tree-sitter build

# Step 3: Parse example.rpgle and save output
Write-Host "Parsing example.rpgle..."
tree-sitter parse example.rpgle > output_generate.txt

Write-Host "All steps completed."

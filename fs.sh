#!/bin/bash

# Create output directory
output_dir="files"
mkdir -p "$output_dir"

# Function to handle duplicate filenames
get_unique_filename() {
    local filepath="$1"
    local filename=$(basename "$filepath")
    local target="$output_dir/$filename"
    local counter=1
    
    # If file doesn't exist, use original name
    if [ ! -f "$target" ]; then
        echo "$filename"
        return
    fi
    
    # If file exists, add counter until we find a unique name
    while [ -f "$target" ]; do
        # Split filename and extension
        if [[ "$filename" == *.* ]]; then
            local name="${filename%.*}"
            local ext="${filename##*.}"
            filename="${name}_${counter}.${ext}"
        else
            filename="${filename}_${counter}"
        fi
        target="$output_dir/$filename"
        ((counter++))
    done
    
    echo "$filename"
}

# Main find command to locate and copy files
find . -type f \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path ".*/files/*" \
    ! -path ".*/.vscode/*" \
    ! -path ".*/build/*" \
    ! -path ".*/ui/*" \
    ! -path ".*/lib/*" \
    ! -path ".*/*.svg" \
    ! -path ".*/out/*" \
    ! -path ".*/resources/*" \
    ! -path ".*/dist/*" \
    ! -path ".*/package-lock.json" \
    ! -path ".*/pnpm-lock.yaml" \
    -print0 | while IFS= read -r -d $'\0' file; do
    
    # Skip the script itself
    if [ "$file" = "./$(basename "$0")" ]; then
        continue
    fi
    
    # Get unique filename for the destination
    unique_name=$(get_unique_filename "$file")
    
    # Copy file
    cp "$file" "$output_dir/$unique_name"
    echo "Copied: $file -> $output_dir/$unique_name"
done

echo "File copying complete. All files are in the '$output_dir' directory."
#!/bin/bash

# First, check if we have necessary conversion tools
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found! Please install it with:"
    echo "brew install imagemagick"
    exit 1
fi

# Convert favicon
echo "Converting favicon.svg to favicon.png..."
convert -background none favicon.svg favicon.png

# Convert Open Graph image
echo "Converting og-image.svg to og-image.jpg..."
convert -background "#2c3e50" og-image.svg og-image.jpg

# Convert all icons
echo "Converting icon files..."
cd icons
for icon in icon-*.svg; do
    output_file="${icon%.svg}.png"
    echo "Converting $icon to $output_file..."
    convert -background none "$icon" "$output_file"
done
cd ..

echo "All conversions complete!" 
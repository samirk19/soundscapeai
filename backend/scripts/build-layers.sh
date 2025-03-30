#!/bin/bash
set -e

echo "Building Lambda layers..."

# Create directory for Pillow layer
mkdir -p layers/pillow/python

# Install Pillow into the layer directory
echo "Installing Pillow..."
pip install pillow -t layers/pillow/python

echo "Layer build complete!"
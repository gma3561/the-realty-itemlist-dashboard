#!/bin/bash

# Prevent Mac from sleeping
# Usage: ./prevent-sleep.sh

echo "🚫 Preventing Mac from sleeping..."
echo "Press Ctrl+C to stop and allow sleep again"
echo ""

# caffeinate command prevents sleep
# -d: Prevent display from sleeping
# -i: Prevent system from idle sleeping
# -s: Prevent system from sleeping when plugged in
# -u: Declare that user is active
caffeinate -disu

# Alternative options:
# caffeinate -d     # Only prevent display sleep
# caffeinate -i     # Only prevent idle sleep
# caffeinate -t 3600  # Prevent sleep for 1 hour (3600 seconds)
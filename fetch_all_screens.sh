#!/bin/bash
PROJECT_ID="1644076438894891159"
API_KEY="AQ.Ab8RN6IoCAkjUlvnpb8EWvO-0ogu17CXSEKxReoCHsVPbKQ8nw"
OUTPUT_DIR=".stitch/designs"

mkdir -p "$OUTPUT_DIR"

declare -A SCREENS
SCREENS["login"]="dfd2550e269843a6a78bd6a2858b5a29"
SCREENS["dashboard"]="0fb973f9cf8149a7b65bf60ea39d5b08"
SCREENS["prd"]="ba573bd1393f41acb18e8b603ea2fabd"
SCREENS["matches"]="690d02b9eddf491b9fa59a44f43f2e2f"
SCREENS["chat"]="8db4db2adf504351a61cec4221f2b4f3"
SCREENS["dashboard_desktop"]="3d067444c146496fade7d05815d02438"
SCREENS["chat_desktop"]="b44e4d2062e44a69a277636447475327"
SCREENS["matches_desktop"]="f761ad521cff4db6b750cafdc522df6f"
SCREENS["login_desktop"]="a726cbe2ef9d4016a26032f5e111c82f"

for NAME in "${!SCREENS[@]}"; do
  ID="${SCREENS[$NAME]}"
  JSON_FILE="$OUTPUT_DIR/$NAME.json"
  
  if [ ! -f "$JSON_FILE" ]; then
    echo "Fetching JSON for $NAME ($ID)..."
    curl -L -s "https://stitch.googleapis.com/v1/projects/$PROJECT_ID/screens/$ID?key=$API_KEY" -o "$JSON_FILE"
  fi
  
  HTML_URL=$(jq -r '.htmlCode.downloadUrl // empty' "$JSON_FILE")
  PNG_URL=$(jq -r '.screenshot.downloadUrl // empty' "$JSON_FILE")
  
  if [ -n "$HTML_URL" ]; then
    echo "  Downloading HTML for $NAME..."
    curl -L -s "$HTML_URL" -o "$OUTPUT_DIR/$NAME.html"
  fi
  
  if [ -n "$PNG_URL" ]; then
    echo "  Downloading PNG for $NAME..."
    curl -L -s "$PNG_URL" -o "$OUTPUT_DIR/$NAME.png"
  fi
done

echo "Done!"

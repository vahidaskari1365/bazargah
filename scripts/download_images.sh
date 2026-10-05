#!/bin/bash
# Download images directly from image-search
cd /home/z/my-project/public/images

fetch() {
  local name=$1; local query=$2
  local out=$(z-ai image-search -q "$query" -c 2 --gl us --no-rank 2>/dev/null)
  local url=$(echo "$out" | python3 -c "
import json,sys
try:
    raw=sys.stdin.read()
    idx=raw.find('{')
    d=json.loads(raw[idx:])
    print(d['results'][0]['original_url'] if d.get('results') else '')
except Exception as e: print('')
" 2>/dev/null)
  if [ -n "$url" ]; then
    curl -sL "$url" -o "$name.jpg" && echo "$name.jpg OK <- $url"
  else
    echo "$name FAILED"
  fi
}

fetch cow "holstein dairy cow standing in green pasture"
fetch sheep "white sheep grazing on farm meadow"
fetch chicken "brown hen chicken farm yard"
fetch goat "black goat standing on grass farm"
fetch calf "brown white calf young cow meadow"
fetch farm "green farmland landscape with barn sunrise"
fetch vet "veterinarian examining cow in farm"
fetch feed "animal feed grain hay bales"
fetch horse "beautiful brown horse running in field"
fetch dog "golden retriever dog sitting on grass"

#!/bin/bash
# Download Bazargah images via image-search
cd /home/z/my-project/public/images

z-ai image-search -q "holstein dairy cow standing in green pasture farm" -c 3 --gl us --no-rank -o cow.json &
z-ai image-search -q "white sheep flock grazing on farm meadow" -c 3 --gl us --no-rank -o sheep.json &
wait
z-ai image-search -q "brown hen chicken rooster farm yard" -c 3 --gl us --no-rank -o chicken.json &
z-ai image-search -q "black goat standing on grass farm" -c 3 --gl us --no-rank -o goat.json &
wait
z-ai image-search -q "brown white calf young cow in meadow" -c 3 --gl us --no-rank -o calf.json &
z-ai image-search -q "beautiful green farmland landscape with barn at sunrise" -c 3 --gl us --no-rank -o farm.json &
wait
z-ai image-search -q "veterinarian examining livestock animal in barn" -c 3 --gl us --no-rank -o vet.json &
z-ai image-search -q "animal feed grain hay bales storage" -c 3 --gl us --no-rank -o feed.json &
wait
echo "ALL DONE"
ls -la

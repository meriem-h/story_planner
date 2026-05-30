#!/bin/bash
npm run make
sudo dpkg -i out/make/deb/x64/story-planner_1.0.0_amd64.deb
sudo cp .env /usr/lib/story-planner/resources/.env
echo "✅ Installation terminée !"

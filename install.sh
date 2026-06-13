#!/bin/bash
source .env
npm run make
echo "$SUDO_PASSWORD" | sudo -S dpkg -i out/make/deb/x64/story-planner_1.0.0_amd64.deb
echo "$SUDO_PASSWORD" | sudo -S cp .env /usr/lib/story-planner/resources/.env
echo "✅ Installation terminée !"

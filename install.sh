source .env

if [ -n "$1" ]; then
    commit_msg="$1"
else
    commit_msg="🚀 Release $(date '+%Y-%m-%d %H:%M')"
fi

git add .
git commit -m "$commit_msg"
git push

npm run make
echo "$SUDO_PASSWORD" | sudo -S dpkg -i out/make/deb/x64/story-planner_1.0.0_amd64.deb
echo "$SUDO_PASSWORD" | sudo -S cp .env /usr/lib/story-planner/resources/.env

echo "✅ Installation terminée !"

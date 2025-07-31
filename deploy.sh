#!/bin/bash
set -e

echo "🚀 GitHub Pages 배포 시작..."

# 빌드
echo "📦 빌드 중..."
npm run build

# 임시 디렉토리로 dist 복사
echo "📋 배포 파일 준비 중..."
rm -rf temp-deploy
cp -r dist temp-deploy

# gh-pages 브랜치로 전환 (없으면 생성)
echo "🌿 gh-pages 브랜치 설정..."
git checkout -B gh-pages

# 기존 파일 삭제 (git 파일 제외)
find . -maxdepth 1 ! -name '.git' ! -name '.gitignore' ! -name 'temp-deploy' ! -name '.' -exec rm -rf {} +

# 빌드 파일 복사
echo "📁 빌드 파일 복사 중..."
cp -r temp-deploy/* .
rm -rf temp-deploy

# .nojekyll 파일 생성 (GitHub Pages가 Jekyll을 사용하지 않도록)
touch .nojekyll

# 커밋 및 푸시
echo "📤 GitHub에 배포 중..."
git add .
git commit -m "Deploy to GitHub Pages - $(date)"
git push origin gh-pages --force

# main 브랜치로 복귀
git checkout main

echo "✅ 배포 완료! https://gma3561.github.io/the-realty-itemlist-dashboard/"
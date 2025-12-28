# 🍽️ 목요점심 사다리타기

매주 목요일 팀 점심 사다리타기 앱!

## ✨ 기능

- 🔢 출근 인원 선택 (6~15명)
- 👥 자동 팀 분배 (3~4명씩)
- 🎰 사다리타기 애니메이션
- 💰 예산 자동 계산 (1등 팀 보너스!)
- 🎊 Confetti & 이모지 축하 효과
- 📋 슬랙 공유용 메시지 복사

## 💵 예산 규칙

- 기본 식대: 12,000원/인
- 1등 팀: 기본 + (나머지 인원 × 2,000원)
- 나머지 팀: 10,000원/인

## 🚀 GitHub Pages 배포

### 1. GitHub 저장소 생성 & 푸시

```bash
# 프로젝트 폴더에서
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/[username]/thursday-lunch.git
git push -u origin main
```

### 2. GitHub Pages 활성화

1. GitHub 저장소 → **Settings** 탭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. **Source** → **GitHub Actions** 선택
4. 끝! 자동으로 배포됨 🎉

### 3. 접속

배포 완료 후 접속:
```
https://[username].github.io/thursday-lunch/
```

> ⚠️ 저장소 이름이 `thursday-lunch`가 아니라면 `next.config.js`의 `basePath`를 수정하세요!

## 🔧 로컬 개발

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인

## 📱 모바일 최적화

- 반응형 디자인 적용
- 터치 친화적 버튼

## 🔮 추가 예정 기능

- [ ] 슬랙 Webhook 직접 연동
- [ ] 매주 목요일 자동 알림
- [ ] 팀원 프리셋 저장
- [ ] 히스토리 기록

---

Made with ❤️ for 목요점심

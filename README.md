# 오늘한끼 웹사이트

정적 서비스 소개 사이트입니다. Android 앱은 Google Play에서 공개 중이며, 첫 화면과 Open Graph 메타데이터는 공개 Play 기능·소개 자료와 일치시킵니다. `privacy.html`과 `terms.html`은 **가입 동의용 최종 법률 문서가 아닙니다.**

링크 공유용 썸네일은 `assets/og-today-hankki.png`이며 `index.html`의 `og:image`와 `twitter:image`에서 사용합니다. Play 링크 자체의 미리보기는 메신저가 Google Play 페이지를 스크랩하는 정책/캐시에 따라 달라질 수 있으므로, 이미지 미리보기가 필요한 홍보 글에는 소개 페이지 `https://nyhoon.github.io/today-hankki-site/` 링크를 사용합니다. 소개 페이지의 설치 버튼은 Google Play로 연결됩니다.

개인정보 및 이용 안내는 실제 데이터 처리·위탁·국외 이전·보유 기간·법적 운영자 정보와 맞는지 계속 확인하고, Supabase `policy_documents`의 버전과 일치시킵니다. 웹사이트 URL은 별도의 HTTPS 주소로 사용하고, Supabase 모바일 인증 복귀 주소는 앱 딥링크를 사용합니다.


## 검색 노출 기반 — 2026-10-29

- 공식 표기: **오늘한끼 - 냉장고 관리**, 운영자: 뉴럴에이전트(NeuralAgent). 동명의 음식점/서비스와 구분하도록 홈페이지 제목·H1·소개·공식 채널 링크를 맞춘다.
- 홈: canonical, WebSite/Organization/SoftwareApplication JSON-LD, 공개 Android 설치 URL. 검증하지 않은 평점·리뷰 수·절약 금액을 넣지 않는다. 구조화 데이터만으로 리치 결과나 상위 노출이 보장되지 않는다.
- `/guides/`: 직접 쓴 재료 등록/중복 구매 전 확인/홈 위젯 사용법 3편. iPhone은 아직 공개 전이므로 공개 설치 링크를 만들지 않는다. 위젯의 iOS 페이지 방식과 Android 스크롤 차이를 구분한다.
- `/sitemap.xml`: 고유 공개 URL 8개. 운영자/인증/푸시 개인화 페이지는 제외.
- GitHub Pages의 프로젝트 경로는 도메인 루트가 아니므로 이 경로의 robots.txt를 루트 robots.txt처럼 사용하지 않는다. 색인 요청은 Search Console URL 접두어 속성과 네이버 서치어드바이저에서 소유권 확인 후 수행해야 한다. 소유권 확인 및 제출 성공 전에는 완료로 보고하지 않는다.
- 유튜브 공식 채널과 새 쇼츠 `HYhQKcIx3_o`를 공식 홈페이지와 연결했다. 영상 제목/설명은 아직 변경하지 않았다. 쇼츠/블로그 링크로부터의 설치 전환은 별도 지표가 필요하며 조회수로 설치 수를 추정하지 않는다.

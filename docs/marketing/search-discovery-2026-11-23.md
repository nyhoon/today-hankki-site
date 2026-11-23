# 알뜰한끼 SEO · GEO · AEO 점검 및 개선

확인일: 2026-11-23 (한국 시간). 대상: 뉴럴에이전트의 알뜰한끼 공식 사이트.

## 확인된 기준선

- Search Console URL 접두어 속성 소유권 및 네이버 호스트 소유권 확인 완료.
- Google 색인 보고서: 색인 4페이지. 실적 3개월 필터(차트 10/28–11/20): 클릭 0, 노출 8, CTR 0%, 평균 순위 12.1. 표본이 매우 작아 순위/전환 추세 판단 불가.
- 페이지별 노출: 영수증 가이드 5, 냉장고 파먹기 가이드 2, 절약 기록 가이드 1. 노출은 설치가 아니다.
- Google에 제출된 사이트맵 주소는 정확한 프로젝트 경로다. 화면의 `/sitemap.xml` 축약 표기를 잘못된 루트 제출로 해석하면 안 된다.
- Google sitemap.xml / sitemap.txt 상태는 '가져올 수 없음'. XML은 HTTP 200, application/xml, 파싱 정상이며 모든 기존 URL은 HTTP 200 및 self canonical을 확인했다.
- 11/23 09:30 Search Console의 sitemap.xml 실제 URL 테스트: Google 검사 도구 스마트폰, 크롤링 허용 예, 페이지 가져오기 성공, 색인 허용 예. 검사 도구 접근 성공은 사이트맵 처리 성공과 별개다. 원인 확정 및 해결 완료로 표기하지 않는다.
- 네이버 사이트맵은 정상 등록 상태(11/12 등록). 등록은 전체 색인 완료를 뜻하지 않는다.
- 동명 외부 서비스가 검색에 나타난다. 앱 이름, 개발사, 공식 스토어 ID를 함께 제시해 구분한다.

## 배포 내용

- `faq.html`: 사용자가 실제 묻는 8가지 질문에 바로 답하고 관련 상세 가이드·양대 스토어에 연결. 수량 입력 부담, 영수증 인식 한계/구매일과 소비기한 차이, 20% 추정 가정과 한계 명시.
- `about.html`: 앱·개발사·공식 연락처·Android 패키지 및 iPhone App Store ID 연결. 가짜 리뷰/평점/실적은 넣지 않음.
- 홈페이지: 처음부터 재료 전체를 입력하지 않아도 되는 시작 방법과 실제 앱 화면, 추정 절약 기능 설명, FAQ·공식 정보 연결.
- 기존 SoftwareApplication의 다운로드/설치 URL에 iOS를 함께 표시. 화면에 있는 기능만 구조화 데이터에 반영.
- `feed.xml`: 새 문서 2개와 기존 가이드 7개의 본문 전체를 포함한 RSS. 관련 이미지와 링크는 절대 주소.
- 사이트맵: 14개 canonical URL. 실제 이번에 수정/추가한 문서에만 lastmod.

## 검증

- 14페이지 canonical·H1, JSON-LD 파싱, 수정 페이지 로컬 링크/이미지, RSS 9개 본문 검증 통과.
- 기존 seasonal data 및 push landing 2개 테스트 통과.
- 공개 배포/검색엔진 제출 상태는 후속 기록에 실제 결과만 추가한다.

## 다음 판단 기준

1. Google 사이트맵 수집 성공 여부와 주요 URL 색인 수를 먼저 확인.
2. 브랜드(알뜰한끼 + 앱/개발사), 기능(영수증 재료 등록 / 냉장고 재료로 요리 / 식재료 관리) 검색어별 노출·클릭을 분리.
3. 노출이 생긴 페이지부터 질문 의도와 제목·첫 답변을 개선. 검색량 수치 미확인, 대량 유사 글 발행 금지.
4. 웹 GA4 연결은 현재 미확인. 사이트 방문 → 스토어 이동 → 실제 설치/첫 재료 등록은 각각 별도 지표로 연결해야 한다. Search Console 클릭을 다운로드로 보고하지 않는다.
5. 브랜드 검색이 약하므로 공식 블로그·스토어의 개발사/사이트 연결 일관성을 유지한다. 타인인 척 리뷰·외부 커뮤니티 게시 또는 무차별 좋아요는 하지 않는다.

## 근거

- Google AI 검색: https://developers.google.com/search/docs/appearance/ai-features — 기존 SEO 원칙 적용. 별도 AI 파일/특수 마크업 필수 아님. 노출 보장 없음.
- Google 사이트맵: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- 네이버 RSS/사이트맵: https://searchadvisor.naver.com/guide/request-feed — 본문 전체 RSS 및 소유 확인 도메인.
- FAQ 마크업은 실제 보이는 Q&A와 일치하도록 사용. Google/네이버 FAQ 검색 확장 표시를 보장하지 않는다.

## 배포·제출 후속 결과

- 사이트 커밋 `c01c021`, GitHub Pages 배포 실행 `45089267008` 성공. FAQ/공식 정보/RSS/사이트맵 공개 HTTP 200 확인, XML 파싱 통과.
- 공개 FAQ에서 실제 렌더링된 질문/답변과 FAQPage JSON-LD를 확인. 홈페이지 Organization/WebSite/SoftwareApplication 렌더링 확인. 390px 모바일 가로 넘침 없음, 스크린샷 원본 비율 유지.
- Google 사이트맵 재제출: '사이트맵이 제출됨' 접수 확인. 직후 보고서에는 여전히 '가져올 수 없음', 발견 0. 수집 성공으로 기록하지 않음.
- Google FAQ: '색인 생성 요청됨', 우선순위 크롤링 대기열 추가 확인. 실제 색인 완료와 별개.
- 네이버 RSS 제출은 사람 확인 보안문자 단계에서 사용자 입력 대기. CAPTCHA를 자동 해결하지 않음.
- 공식 정보 URL도 Google에서 ‘색인 생성 요청됨’, 우선순위 크롤링 대기열 추가 확인. FAQ와 함께 실제 색인 여부는 아직 미확인.

## 10:08 이후 재점검 및 제출 완료

- 네이버 RSS 등록 목록에 `https://nyhoon.github.io/today-hankki-site/feed.xml` 등록일 `26.11.23 10:08:44` 확인. 이전의 보안문자 대기는 해소됨.
- 네이버 FAQ 수집 요청 `10:11:09`, 공식 앱 정보 수집 요청 `10:11:23` 등록 목록 확인. 수집/색인 완료가 아니라 요청 접수임.
- Google 호스트 루트 속성(`https://nyhoon.github.io/`)은 미인증 상태였다. 공식 HTML 파일 `google232cb3467ad40f9a.html`을 루트 저장소에 배포해 소유권 확인 완료. 프로젝트 속성 인증은 원래 정상이며, 루트 미인증을 사이트맵 오류 원인으로 단정하지 않는다.
- 루트 배포 커밋 `dce5a1a`. 배포 실행 `45092941573` 첫 시도에서 산출물 조회 실패, 재실행 성공 및 공개 파일 HTTP 200 확인. 앱 링크 설정이나 루트의 PocoPet 리다이렉트는 변경하지 않음.
- 루트 크롤링 통계(최종 업데이트 11/21): 최근 90일 요청 67회, 평균 응답 61ms, 호스트 문제 없음, 성공200 88% / 301 7% / 404 4%. AdsBot 70%, 스마트폰 4%. 앱 전용이 아니라 동일 호스트 전체 통계다. 사이트맵 실패 응답의 서버 로그는 제공되지 않음.
- Google robots 보고서: 11/12 가져옴, 문제 없음. 재크롤링 요청 전송됨 확인.
- 프로젝트 직접 조치 및 보안 문제 보고서 모두 ‘감지된 문제 없음’.
- 홈페이지 URL 검사: Google에 등록됨, 최근 크롤링 11/20 01:17:25 Googlebot 스마트폰, 가져오기 성공, 자체 canonical과 Google 선택 canonical 일치. 사이트맵 미수집이어도 홈페이지 색인은 되어 있음.
- RSS를 Google의 지원 피드 형식으로 추가 제출했으나 XML/텍스트와 같이 ‘가져올 수 없음’. 형식 하나에 국한된 증상이 아님. 기존 14URL XML은 여전히 200/application/xml 및 파싱 정상, 브라우저와 Google 검사 도구에서도 접근 가능.

### 남은 한계와 처리 원칙

사이트맵 보고서의 성공 전환은 아직 미확인이다. 로컬 차단 설정, 형식 오류, 직접 조치, 알려진 호스트 장애는 확인되지 않았으며 근본 원인을 확정할 증거가 부족하다. Google 내부 재처리/수요 문제 가능성은 가설이다. 제출 접수나 robots 재크롤링 요청을 수집 성공으로 바꿔 말하지 않는다. 근거 없이 파일명 변경/반복 제출/도메인 이전을 하지 않는다.

Google 공식 디버깅 안내에 따라 상세 상태, 실제 URL 검사, robots, 직접 조치, 호스트 크롤링을 확인했다: https://support.google.com/webmasters/answer/7451001?hl=ko

증빙: `/tmp/hankki-seo-2026-11-23/naver-rss-registered.jpg` 및 `google-home-indexed.jpg`.

## 2026-11-23 post-deploy GEO check

- Website changes published in commit `2fdcbc1` (`Improve search content and seasonal discoverability`). GitHub Pages workflow `45139522485` completed successfully.
- Post-deploy GEO run `01M83RMTMWPQQP86VA4F26F5Z2`: `65/100 Fair`, evidence `CURRENT`, 11 pages scored, 0 failed. Prior recorded score was `58/100 Fair` over 14 pages, so the raw score rose by 7 points but the crawl sample differs; treat this as a positive diagnostic signal, not a strict apples-to-apples comparison or search-ranking evidence.
- Post-deploy categories: citability 86, technical 99, schema 75, content 62, platform 52, brand 18. Key updated signals: attribution 6.71, schema Article 11.43, organization 8.27. The tool still flags author expertise descriptions; do not invent credentials. Build expertise with verifiable authorship and cited sources.
- The crawler fetched 11 pages with 0 failures; seasonal.html was not in this sampled crawl. A score change for the new server-rendered seasonal content is therefore not yet demonstrated by this run.
- Tool-identified next evidence gaps: independent brand/entity references and stronger cited facts. Do not create Wikipedia/Wikidata records for self-promotion, fabricate expert credentials, or add llms.txt just to chase a score; Google's published guidance says it does not affect ranking.
- Full machine-readable audit JSON: `/Users/nam-younghoon/StudioProjects/today-hankki/output/seo-2026-11-23/geo-site-audit-post.json`.

The Google Search Console sitemap report remains separately unresolved; a successful website deployment does not imply Google has accepted or processed the sitemap.

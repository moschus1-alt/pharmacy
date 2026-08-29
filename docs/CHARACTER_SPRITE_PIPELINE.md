# 캐릭터 이미지·스프라이트 제작 표준

이 문서는 2D 게임 캐릭터를 새로 만들거나 교체할 때 반드시 따르는 기준이다. 목표는 **같은 화풍, 실제 투명 배경, 정확한 방향, 프레임 중심 고정, 잘림 없는 4방향 보행**이다.

## 1. 고정 규격

- 최종 파일: PNG, RGBA, 512×512
- 배열: 4열 × 4행, 셀당 128×128
- 행 순서: 0 정면(아래), 1 왼쪽, 2 오른쪽, 3 뒷면(위)
- 열 순서: 0 기본 접지, 1 왼발, 2 통과, 3 오른발
- 게임 재생 순서: `0 → 1 → 2 → 3 → 0`
- 모든 프레임의 발 기준선은 셀 아래쪽 같은 높이에 둔다.
- 머리카락, 무기, 가방, 지팡이를 포함한 실루엣 전체가 셀 안에 있어야 한다.
- 왼쪽 행을 기준으로 오른쪽 행은 정확한 수평 반전으로 만든다. 생성기의 방향 해석에 의존하지 않는다.

## 2. 공통 화풍

- 한국 약국 야간 생존 게임용 2D 치비 캐릭터
- 약 3등신, 큰 머리와 읽기 쉬운 전신 실루엣
- 짙고 깨끗한 외곽선, 선명한 셀 셰이딩, 과하지 않은 표정
- 같은 광원, 같은 선 굵기, 같은 채도와 명암 단계
- 캐릭터 간 외형은 머리 모양, 체형, 의상 색, 소품으로 확실히 구분

## 3. 현재 캐릭터 기준

| 파일 | 캐릭터 | 식별 요소 | 목표 높이 |
|---|---|---|---:|
| `minjun-walk.png` | 민준 | 헝클어진 짧은 검은 머리, 둥근 안경, 흰 가운, 남색 셔츠, 주황 캡슐 블래스터 | 108px |
| `seoyeon-walk.png` | 서연 | 긴 검은 로우 포니테일, 둥근 안경, 흰 가운, 청록 블라우스, 청록·코랄 블래스터 | 108px |
| `male-rude-customer-walk.png` | 남자 진상 | 차콜 정장, 느슨한 빨간 넥타이, 구겨진 영수증 | 104px |
| `female-rude-customer-walk.png` | 여자 진상 | 어깨 길이 갈색 머리, 버건디 카디건, 검정 치마, 가방과 영수증 | 104px |
| `grandfather-rude-customer-walk.png` | 할아버지 | 회색 가르마 머리, 안경, 베이지 카디건, 나무 지팡이 | 101px |
| `grandmother-rude-customer-walk.png` | 할머니 | 둥근 회색 파마, 안경, 보라색 꽃무늬 카디건, 갈색 가방 | 101px |
| `midboss-complaint-manager-walk.png` | 중간보스 | 큰 체형, 남색 정장, 빨간 사원증 줄, 민원 서류 뭉치 | 116px |
| `boss-summoned-minion-walk.png` | 호출몹 | 작은 체형, 단정한 검은 머리와 안경, 회색 재킷, 빨간 서류철 | 98px |

## 4. 이미지 생성 프롬프트

먼저 모든 캐릭터가 함께 나온 스타일 시트를 한 장 만들고, 이후 각 스프라이트 생성에서 그 시트를 참조 이미지로 사용한다.

### 스타일 시트 프롬프트

```text
Create one polished 2D character style bible lineup for a Korean pharmacy night-shift survival game. Show exactly eight distinct full-body chibi game characters in two neat rows, all at the same scale and in the exact same art style: clean dark outline, crisp cel shading, readable silhouettes, compact 3-head-tall proportions, expressive but not grotesque, rich jewel-tone palette. Include Minjun male pharmacist, Seoyeon female pharmacist, male rude customer, female rude customer, grandfather, grandmother, large midboss complaint manager, and smaller summoned complaint assistant. Pure transparent alpha background. No checkerboard, floor, shadow, text, labels, border, logo, extra characters, or cropped body parts.
```

### 개별 보행 시트 공통 프롬프트

```text
Use the exact chibi art style, proportions, linework, cel shading, colors, and character identity from the supplied style-bible reference. Create one production-ready walking sprite sheet: exactly 4 columns by 4 rows, sixteen equal square cells, one full-body character per cell, same scale and ground anchor in every cell. Row 1 faces DOWN/front. Row 2 faces LEFT. Row 3 faces RIGHT. Row 4 faces UP/back. Columns are neutral contact, left-foot step, passing pose, right-foot step. Motions must be subtle and loopable. Every frame centered with generous transparent padding; no body part crosses a cell edge. True transparent alpha only. No checkerboard, grid, labels, text, floor, shadow, particles, extra characters, cropping, duplicated limbs, or swapped directions. Square canvas.
```

공통 프롬프트 뒤에 위 표의 캐릭터 식별 요소를 정확히 붙인다. 머리카락·무기·가방·지팡이가 셀 밖으로 나가지 않도록 소품별 제한도 적는다.

## 5. 투명 배경 후처리

생성 결과가 투명해 보이더라도 RGB 파일에 체크무늬가 그려진 경우가 있으므로 다음을 반드시 검사한다.

1. 모드가 `RGBA`인지 확인한다.
2. 알파 채널 최솟값이 0, 최댓값이 255인지 확인한다.
3. 가장자리와 연결된 밝은 무채색 체크무늬만 flood-fill 방식으로 제거한다.
4. 흰 가운처럼 캐릭터 내부의 밝은 색은 가장자리와 연결되지 않으므로 보존한다.
5. 각 셀의 불투명 바운딩 박스를 구해 수평 중앙과 공통 발 기준선에 배치한다.
6. 뒷모습 머리가 행 경계를 넘는 경우 마지막 행을 위쪽으로 여유 있게 다시 읽은 뒤 축소·정렬한다.

## 6. 적용 전 필수 검사

- 8개 시트가 모두 존재한다.
- 각 파일이 정확히 512×512 RGBA다.
- 16개 셀이 모두 비어 있지 않다.
- 알파 채널에 0과 255가 모두 존재한다.
- 오른쪽 행의 각 프레임이 왼쪽 행의 정확한 수평 반전이다.
- 검정 배경과 흰 배경 양쪽의 통합 미리보기에서 체크무늬와 흰 사각형이 없다.
- 확대 미리보기에서 머리, 발, 포니테일, 무기, 가방, 지팡이가 잘리지 않는다.
- 게임 코드의 방향 매핑은 `아래=0, 왼쪽=1, 오른쪽=2, 위=3`을 사용한다.
- 실제 게임에서 네 방향으로 각각 3초 이상 이동해 방향과 루프를 확인한다.

검사를 하나라도 통과하지 못한 이미지는 게임에 연결하지 않는다.

## 7. 프로젝트 적용 원칙

- 새 버전은 `assets/characters-vN/`처럼 별도 폴더에 넣는다.
- 검증이 끝난 뒤 한 번에 게임 경로를 새 폴더로 변경한다.
- 기존 에셋은 즉시 삭제하지 않아 되돌릴 수 있게 둔다.
- 선택 화면 초상은 같은 스타일 시트에서 얼굴·상반신을 추출해 캐릭터 외형을 일치시킨다.
- 모든 캐릭터는 하나의 공통 방향 계산 함수와 하나의 공통 보행 프레임 함수를 사용한다.


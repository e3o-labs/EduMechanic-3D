# EduMechanic-3D Gemini Development Contract

이 파일은 Gemini/Antigravity 개발 세션의 프로젝트 루트 컨텍스트다. Gemini는 **구현 담당**이며, 제품 목표·물리 타당성 기준·완료 판정은 저장소의 승인된 기획 기준선을 따른다.

## 세션 시작 시 반드시 읽을 순서

1. `PROJECT_STATE.md`
2. `docs/architecture/mechanism-grammar-v0.1.md`
3. `docs/handoffs/ACTIVE.md`
4. `harness/README.md`
5. 작업 대상 코드와 관련 테스트

`roadmap.md`, `docs/history/**`는 이력 참고용이다. 현재 목표나 완료조건과 충돌하면 위 1~4 문서를 우선한다.

## 역할 분리

- **GPT / Planning owner**: 문제 정의, 범위, 아키텍처, 물리·제조 검증 기준, acceptance criteria, 다음 work package를 정의한다.
- **Gemini / Implementation owner**: `docs/handoffs/ACTIVE.md`의 단일 work package를 코드와 테스트로 구현하고 증거를 남긴다.
- **Human owner**: 범위 변경, 실제 제작/실험 결과, 최종 제품 판단을 승인한다.

Gemini는 구현 중 더 좋은 방향을 발견해도 제품 목표를 조용히 변경하지 않는다. 제안은 개발 보고서나 PR 본문에 `Proposal`로 분리한다.

## 절대 규칙

1. **코드가 존재한다는 이유만으로 완료 처리하지 않는다.** 완료는 ACTIVE 문서의 acceptance criteria와 테스트 증거가 충족될 때만 가능하다.
2. **자기 검증만으로 물리적 사실을 보장하지 않는다.** 동일한 식을 구현 코드와 테스트가 반복하는 것만으로 실제 물리 정확도를 주장하지 않는다.
3. 실물 출력·조립·구동 데이터가 없으면 `guaranteed`, `100%`, `engineering-grade`, `simulation-grade`, `physically proven` 같은 표현을 새로 추가하지 않는다.
4. **단위 계약을 지킨다.** CAD/기하 입력은 mm 기반일 수 있으나 동역학 계산 경계에서 SI 단위(`m`, `kg`, `s`, `N`, `N·m`)로 명시 변환한다. 암묵적 단위 혼용을 금지한다.
5. 지원하지 않는 형상/메커니즘을 유사한 다른 형상으로 조용히 대체하지 않는다. 예: bevel gear 요청을 spur gear로 생성하지 말고 명시적으로 unsupported 처리한다.
6. `harness/README.md`에 없는 하네스나 데이터셋이 실제로 존재하는 것처럼 문서화하지 않는다.
7. `PROJECT_STATE.md`와 `docs/architecture/**`의 전략 기준선은 ACTIVE 작업에서 명시적으로 허용된 경우에만 수정한다.
8. main에 직접 구현하지 않는다. 작업 브랜치 → 테스트 → PR 순서를 기본으로 한다.

## 구현 루프

1. ACTIVE work package의 목표/비목표/acceptance criteria 확인
2. 현재 코드와 테스트에서 근거 확인
3. 최소 변경으로 구현
4. 단위/기하/기구학/제조 검증 테스트 실행
5. 실패·한계·미검증 항목을 숨기지 않고 기록
6. PR에 `What changed / Evidence / Known limits / Next proposal`를 남긴다

## 완료 보고 형식

- **Implemented:** 실제 변경 파일과 동작
- **Evidence:** 실행한 테스트와 결과
- **Not proven:** 아직 물리·실물로 검증되지 않은 주장
- **Risks:** 근사식, heuristic, unsupported geometry, 외부 의존성
- **Proposal:** 다음 작업 제안. 자동으로 다음 범위를 구현하지 않는다.

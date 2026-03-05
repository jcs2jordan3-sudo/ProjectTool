// DB 한글 깨짐 수정 스크립트
// node --env-file=.env scripts/fix-encoding.mjs

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // 1. 멤버 이름 수정
    const memberFixes = [
      ["seoyeon@studio.com", "김서연"],
      ["junho@studio.com", "이준호"],
      ["minji@studio.com", "최민지"],
      ["taeyun@studio.com", "정태윤"],
      ["sohee@studio.com", "한소희"],
    ];
    for (const [email, name] of memberFixes) {
      await client.query("UPDATE members SET name = $1 WHERE email = $2", [name, email]);
      console.log(`Member: ${email} -> ${name}`);
    }

    // 2. 프로젝트 이름 수정
    const { rows: projects } = await client.query("SELECT id, name FROM projects");
    for (const p of projects) {
      if (p.name === "Dummy Project" || p.name.includes("�") || p.name.includes("\ufffd")) {
        await client.query(
          "UPDATE projects SET name = $1, description = $2 WHERE id = $3",
          ["Project Astra - 판타지 RPG", "차세대 오픈월드 판타지 RPG. 2027 글로벌 론칭 목표.", p.id]
        );
        console.log(`Project: ${p.id} -> Project Astra`);
        break; // 첫 번째 깨진 프로젝트만
      }
    }

    // 3. 이슈 제목/설명 수정 - 매핑 테이블
    const issueFixes = [
      // EPIC 1: 전투 시스템
      { type: "EPIC", order: 0, title: "전투 시스템", desc: "실시간 액션 전투. 기본 공격, 스킬, 회피, 콤보 시스템 구현." },
      { type: "STORY", order: 0, title: "기본 공격 시스템", desc: "근접/원거리 기본 공격 구현. 무기별 모션 차별화." },
      { type: "TASK", order: 0, title: "근접 무기 히트박스 구현", desc: "검, 도끼, 창 3종 히트박스 및 데미지 판정" },
      { type: "TASK", order: 1, title: "원거리 무기 투사체 구현", desc: "활, 마법 지팡이 투사체 생성 및 충돌 처리" },
      { type: "TASK", order: 2, title: "공격 모션 리타게팅", desc: "무기 타입별 공격 애니메이션 4종 리타게팅" },
      { type: "STORY", order: 1, title: "스킬 시스템", desc: "4슬롯 액티브 스킬. 쿨타임, 마나 소모, 레벨별 강화." },
      { type: "TASK", order: 3, title: "스킬 슬롯 UI 구현", desc: "4슬롯 스킬바 + 쿨타임 오버레이 + 마나 부족 시각 피드백" },
      { type: "TASK", order: 4, title: "스킬 이펙트 VFX 제작", desc: "화염구, 빙결, 번개, 힐 4종 VFX" },
      { type: "TASK", order: 5, title: "스킬 밸런스 시트 설계", desc: "레벨별 데미지 계수, 쿨타임, 마나 소모량 수치 기획" },
      { type: "TASK", order: 6, title: "스킬 쿨타임/마나 로직 구현", desc: "서버사이드 스킬 사용 검증 + 클라이언트 쿨타임 동기화" },
      { type: "STORY", order: 2, title: "회피 및 콤보 시스템", desc: "대쉬 회피 + 무적 프레임. 공격 연계 콤보 3단." },
      { type: "TASK", order: 7, title: "대쉬 회피 기획서 작성", desc: "무적 프레임 수, 스태미나 소모, 쿨타임 수치 기획" },
      { type: "TASK", order: 8, title: "콤보 입력 버퍼 구현", desc: "입력 큐잉 + 타이밍 윈도우 판정 로직" },
      { type: "TASK", order: 9, title: "회피 애니메이션 제작", desc: "전후좌우 4방향 대쉬 모션 + 블렌딩" },
      // EPIC 2: 캐릭터 커스터마이징
      { type: "EPIC", order: 1, title: "캐릭터 커스터마이징", desc: "캐릭터 생성 시 외형 커스터마이징. 얼굴, 체형, 헤어, 의상." },
      { type: "STORY", order: 3, title: "얼굴 커스터마이징", desc: "눈코입턱선 12개 파라미터." },
      { type: "TASK", order: 10, title: "얼굴 모프 타겟 12종 제작", desc: "블렌드셰이프 기반 얼굴 변형 12개 파라미터" },
      { type: "TASK", order: 11, title: "커스터마이징 UI 슬라이더", desc: "실시간 미리보기 + 랜덤 버튼 + 프리셋 저장/불러오기" },
      { type: "TASK", order: 12, title: "커스터마이징 데이터 직렬화", desc: "캐릭터 외형 데이터 JSON 직렬화 + 서버 저장" },
      { type: "STORY", order: 4, title: "의상 및 장비 외형", desc: "장비 착용 시 외형 변경. 염색 시스템." },
      { type: "TASK", order: 13, title: "장비 메시 교체 시스템", desc: "투구/갑옷/장갑/부츠 슬롯별 메시 스왑" },
      { type: "TASK", order: 14, title: "염색 셰이더 구현", desc: "마스크 텍스처 기반 부분 염색 (주/보조/포인트 3색)" },
      // EPIC 3: 월드맵 및 탐험
      { type: "EPIC", order: 2, title: "월드맵 및 탐험 시스템", desc: "오픈월드 3개 지역. 패스트트래블, 미니맵." },
      { type: "STORY", order: 5, title: "미니맵 및 월드맵 UI", desc: "HUD 미니맵 + 전체 월드맵 오버레이. 마커, 퀘스트 아이콘." },
      { type: "TASK", order: 15, title: "미니맵 렌더링 구현", desc: "탑다운 카메라 + 회전 미니맵 + 안개 효과" },
      { type: "TASK", order: 16, title: "월드맵 마커 시스템", desc: "퀘스트/NPC/던전 마커 + 필터링 + 사용자 핀" },
      { type: "TASK", order: 17, title: "패스트트래블 포인트 기획", desc: "3개 지역 각 5개 포인트. 해금 조건 설계" },
      { type: "STORY", order: 6, title: "시작의 숲 레벨 디자인", desc: "튜토리얼 지역. 안전한 숲 + 첫 던전 입구." },
      { type: "TASK", order: 18, title: "숲 지형 화이트박스", desc: "BSP 레벨 화이트박스 + 플레이어 동선 테스트" },
      { type: "TASK", order: 19, title: "환경 에셋 배치", desc: "폴리지 페인팅 + LOD 설정 + 최적화" },
      { type: "TASK", order: 20, title: "NPC 배치 및 동선 설정", desc: "마을 NPC 8명 배치 + AI 순찰 경로" },
      { type: "TASK", order: 21, title: "지역 BGM 및 앰비언스 적용", desc: "낮/밤 전환 BGM + 숲 환경음 레이어링" },
      // EPIC 4: QA
      { type: "EPIC", order: 3, title: "QA 및 성능 최적화", desc: "알파 빌드 QA. 크래시, 프레임, 메모리." },
      { type: "STORY", order: 7, title: "알파 빌드 QA 라운드 1", desc: "전투/탐험 핵심 루프 QA. 크래시, 게임플레이 버그 수집." },
      { type: "TASK", order: 22, title: "전투 밸런스 QA", desc: "레벨 1~10 전투 난이도 테스트. 데미지/HP 수치 검증" },
      { type: "TASK", order: 23, title: "메모리 프로파일링", desc: "지역 전환 시 메모리 누수 체크. 텍스처/메시 언로드 검증" },
      { type: "TASK", order: 24, title: "FPS 벤치마크 (최소사양)", desc: "GTX 1060 / RX 580 기준 30fps 이상 달성 목표" },
    ];

    // 프로젝트의 이슈를 created_at 순으로 가져오기
    const projectRes = await client.query(
      "SELECT id FROM projects WHERE name = $1 OR name LIKE $2",
      ["Project Astra - 판타지 RPG", "%Dummy%"]
    );

    if (projectRes.rows.length === 0) {
      // 새로 생성된 프로젝트 (이름이 이미 깨진 상태)
      const allProjects = await client.query("SELECT id, name FROM projects ORDER BY created_at DESC");
      var projectId = allProjects.rows[0]?.id;
    } else {
      var projectId = projectRes.rows[0].id;
    }

    if (!projectId) {
      console.log("No project found to fix");
      return;
    }

    console.log(`\nFixing issues for project: ${projectId}`);

    const { rows: issues } = await client.query(
      "SELECT id, type, title, created_at FROM issues WHERE project_id = $1 ORDER BY created_at ASC",
      [projectId]
    );

    console.log(`Found ${issues.length} issues to fix`);

    // 타입별로 분리
    const epics = issues.filter(i => i.type === "EPIC");
    const stories = issues.filter(i => i.type === "STORY");
    const tasks = issues.filter(i => i.type === "TASK");

    const epicFixes = issueFixes.filter(f => f.type === "EPIC");
    const storyFixes = issueFixes.filter(f => f.type === "STORY");
    const taskFixes = issueFixes.filter(f => f.type === "TASK");

    // 생성순 = issueFixes 순서와 동일
    for (let i = 0; i < epics.length && i < epicFixes.length; i++) {
      await client.query("UPDATE issues SET title = $1, description = $2 WHERE id = $3",
        [epicFixes[i].title, epicFixes[i].desc, epics[i].id]);
      console.log(`  EPIC: ${epics[i].id} -> ${epicFixes[i].title}`);
    }
    for (let i = 0; i < stories.length && i < storyFixes.length; i++) {
      await client.query("UPDATE issues SET title = $1, description = $2 WHERE id = $3",
        [storyFixes[i].title, storyFixes[i].desc, stories[i].id]);
      console.log(`  STORY: ${stories[i].id} -> ${storyFixes[i].title}`);
    }
    for (let i = 0; i < tasks.length && i < taskFixes.length; i++) {
      await client.query("UPDATE issues SET title = $1, description = $2 WHERE id = $3",
        [taskFixes[i].title, taskFixes[i].desc, tasks[i].id]);
      console.log(`  TASK: ${tasks[i].id} -> ${taskFixes[i].title}`);
    }

    console.log("\nDone! All Korean text fixed.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);

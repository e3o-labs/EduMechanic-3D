import { MechanicalPreset } from '../types';

export const MECHANICAL_PRESETS: MechanicalPreset[] = [
  {
    id: 'sharpener',
    title: '수동 연필깎이 메커니즘',
    subtitle: '유성 헬리컬 롤러 & 링 기어 구조',
    icon: 'fa-pencil',
    thumb: 'https://images.unsplash.com/photo-1585336261026-8f5786372969?auto=format&fit=crop&w=300&q=80',
    aiSummary: '손잡이를 돌리면 **회전 캐리어가 연필 주위를 공전**하고, 내부 고정 링 기어를 타고 도는 **18도 경사 헬리컬 롤러 칼날이 4배 빠르게 자전**하면서 연필을 원뿔형으로 정밀하게 깎아내요!',
    principles: [
      { title: '유성 헬리컬 밀링 (Epicyclic Milling)', desc: '칼날이 연필 둘레를 공전함과 동시에 고속으로 자전하여 매끄럽게 절삭합니다.' },
      { title: '18도 경사각과 원뿔형 팁 형성', desc: '칼날 롤러가 중심 축에 대해 18도 기울어져 있어 연필 끝이 뾰족한 원뿔 형태로 깎입니다.' }
    ],
    parts: [
      { id: 'housing', name: '본체 하우징 바디', function: '전체 구조 지지 및 보호', desc: '고정 링 기어와 톱밥 서랍함 레일이 일체형으로 설계된 메인 바디 프레임입니다.' },
      { id: 'drawer', name: '투명 톱밥 서랍함', function: '연필 찌꺼기 수집', desc: '깎여나간 나무 톱밥과 흑연 가루가 모이는 서랍식 투명 컨테이너입니다.' },
      { id: 'chuck', name: '전면 연필 고정 척', function: '연필 중심 정렬 및 클램핑', desc: '핀치 레버를 눌러 연필을 삽입하면 자동으로 중심을 잡아주는 클램프입니다.' },
      { id: 'ring_gear', name: '고정 내치 링 기어', function: '유성 피니언 기어 물림', desc: '하우징 내부에 고정되어 롤러 칼날 피니언 기어가 타고 회전할 수 있는 내치 기어입니다.' },
      { id: 'carrier', name: '회전 캐리어 프레임', function: '칼날 공전 축 지지', desc: '크랭크 손잡이와 직결되어 헬리컬 칼날 롤러를 회전시키는 캐리어입니다.' },
      { id: 'cutter_blade', name: '10-Flute 헬리컬 롤러 칼날', function: '고속 자전 절삭', desc: '10개의 나선형 홈이 파여진 강철 롤러로 연필을 미세하게 깎아냅니다.' },
      { id: 'crank', name: '후면 크랭크 핸들', function: '사람의 회전력 입력', desc: '손으로 잡고 돌려 캐리어에 동력을 전달하는 인체공학 핸들입니다.' }
    ],
    comments: [
      { author: '김민준', time: '10분 전', text: '칼날이 18도 기울어져 있어서 연필이 뾰족한 원뿔 모양으로 깎이는 거였구나!', part: '10-Flute 헬리컬 롤러 칼날' },
      { author: '🤖 AI 메카몽', time: '8분 전', text: '맞아요! 고정 링 기어(Z=24)와 피니언(Z=8)의 유성 기어비 덕분에 손잡이를 1바퀴 돌리면 칼날은 4바퀴나 자전해요!', part: '고정 내치 링 기어' },
      { author: '이서연', time: '2분 전', text: '전면 척 레버를 누르면 연필이 쏙 들어가고 딱 잡아주는 구조가 신기해!', part: '전면 연필 고정 척' }
    ],
    quiz: {
      q: '고정 링 기어(잇수 24개) 안에서 피니언 기어(잇수 8개)가 장착된 칼날이 1바퀴 공전하면, 칼날은 스스로 몇 바퀴 자전할까요?',
      options: ['1바퀴', '3바퀴', '4바퀴 (1 + 24/8)', '8바퀴'],
      correct: 2,
      explanation: '유성 기어 기구학 공식에 의해 자전수 = 1 + (링 기어 잇수 / 피니언 잇수) = 1 + 24/8 = 4바퀴 자전합니다!'
    }
  },

  {
    id: 'musicbox',
    title: '태엽 오르골 메커니즘',
    subtitle: '태엽 드럼 & 빗살 음판 구조',
    icon: 'fa-music',
    thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    aiSummary: '태엽에 저장된 스프링 힘이 풀어지면서 솟아난 돌기들이 금속 빗살을 튕겨서 아름다운 멜로디 소리를 만들어내요!',
    principles: [
      { title: '태엽 스프링 에너지 저장', desc: '돌려 감아놓은 태엽이 풀어지면서 운동 에너지로 출력됩니다.' },
      { title: '길이에 따른 소리의 높낮이', desc: '쇠 빗살의 길이가 길수록 낮은 음, 짧을수록 높은 음 소리가 납니다.' }
    ],
    parts: [
      { id: 'spring', name: '메인 태엽 드럼', function: '에너지 저축 및 풀림', desc: '강철 태엽이 꼬이면서 힘을 모아두는 곳이에요.' },
      { id: 'cylinder', name: '돌기 핀 드럼', function: '멜로디 악보 정보 저장', desc: '표면에 볼록한 핀들이 음악 악보처럼 박혀 있어요.' },
      { id: 'comb', name: '금속 빗살 음판', function: '진동을 통한 소리 발생', desc: '길이가 다른 쇠 빗살들이 튕겨질 때 소리를 만듭니다.' },
      { id: 'governor', name: '바람개비 감속기', function: '속도 일정하게 유지', desc: '공기 저항으로 오르골이 너무 빨리 풀리지 않게 막아줍니다.' }
    ],
    comments: [
      { author: '박준형', time: '15분 전', text: '바람개비 같은 팬이 계속 도는 이유가 뭔지 알겠다!', part: '바람개비 감속기' }
    ],
    quiz: {
      q: '오르골의 금속 빗살 중 가장 길고 두꺼운 빗살을 튕기면 어떤 소리가 날까요?',
      options: ['가장 높은 소리', '가장 낮은 소리', '소리가 안 남', '중간 소리'],
      correct: 1,
      explanation: '길이가 길수록 천천히 진동하기 때문에 묵직하고 낮은 음(Low Pitch)이 나게 됩니다!'
    }
  },
  {
    id: 'bicycle',
    title: '자전거 유성기어 변속기',
    subtitle: '중심 기어 & 공전 기어 동력 조절',
    icon: 'fa-bicycle',
    thumb: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=80',
    aiSummary: '태양 주위를 지구가 돌듯, 중심 기어 둘레를 유성 기어들이 돌면서 언덕길 힘과 평지 속도를 바꾸어 주는 변속 장치예요!',
    principles: [
      { title: '힘과 속도의 시소 관계', desc: '속도를 높이면 페달을 밝는 힘이 더 들고, 언덕에선 페달이 가벼워집니다.' },
      { title: '유성 기어 구조', desc: '작은 공간 안에 여러 개의 기어가 물리며 큰 힘을 냅니다.' }
    ],
    parts: [
      { id: 'sun', name: '중심 태양 기어', function: '중심 축 고정/구동', desc: '가운데 위치하여 다른 기어들의 중심축 역할을 합니다.' },
      { id: 'planet', name: '유성 피니언 기어 (x3)', function: '공전 및 힘 분배', desc: '태양 기어 주위를 회전하며 동력을 넘겨줍니다.' },
      { id: 'ring', name: '바깥 링 기어', function: '외곽 체결 및 출력', desc: '안쪽에 톱니가 새겨진 원형 링 기어예요.' }
    ],
    comments: [
      { author: '최민서', time: '5분 전', text: '언덕 올라갈 때 페달 가벼워지는 비밀이 유성기어였구나!', part: '중심 태양 기어' }
    ],
    quiz: {
      q: '자전거로 가파른 언덕을 올라갈 때는 어떤 상태로 변속해야 할까요?',
      options: ['속도 최우선', '큰 힘(토크) 최우선', '기어 작동 멈춤', '반대로 회전'],
      correct: 1,
      explanation: '언덕에서는 바퀴를 미는 큰 힘(토크)이 필요하므로 기어비를 높여 페달 힘을 크게 만듭니다!'
    }
  }
];

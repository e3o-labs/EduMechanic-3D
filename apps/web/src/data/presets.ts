import { MechanicalPreset } from '../types';

export const MECHANICAL_PRESETS: MechanicalPreset[] = [
  {
    id: 'sharpener',
    title: '수동 연필깎이 메커니즘',
    subtitle: '직각 기어 & 나선형 칼날 구조',
    icon: 'fa-pencil',
    thumb: 'https://images.unsplash.com/photo-1585336261026-8f5786372969?auto=format&fit=crop&w=300&q=80',
    aiSummary: '손잡이를 돌리면 **베벨 기어**가 힘을 90도로 꺾어주고, 나선형 칼날이 회전하면서 연필을 일정 각도로 예쁘게 깎아주는 구조예요!',
    principles: [
      { title: '돌아가는 방향 90도 전환', desc: '베벨 기어(Bevel Gear)를 이용해 손잡이와 칼날 축의 회전 방향을 직각으로 교차시킵니다.' },
      { title: '힘을 키우는 기어비', desc: '손잡이를 1바퀴 돌릴 때 칼날이 더 힘차게 돌 수 있도록 톱니 수 비율을 설계했습니다.' }
    ],
    parts: [
      { id: 'housing', name: '외부 투명 케이스', function: '내부 보호 및 연필 안내', desc: '내부 톱니바퀴가 어떻게 돌아가는지 훤히 들여다볼 수 있는 아크릴 케이스예요.' },
      { id: 'bevel', name: '중앙 경사 베벨 기어', function: '회전 방향 90도 전환', desc: '손잡이와 만나 돌아가는 힘을 90도 직각으로 꺾어주는 톱니바퀴예요.' },
      { id: 'cutter', name: '나선형 칼날 컷터', function: '연필 나무 깎아내기', desc: '경사각을 이루며 회전하여 연필 심이 부러지지 않게 깎아줍니다.' },
      { id: 'crank', name: '손잡이 레버', function: '사람의 힘 입력', desc: '손으로 잡고 크게 원을 그리며 돌려 힘을 전달하는 레버예요.' }
    ],
    comments: [
      { author: '김민준', time: '10분 전', text: '베벨 기어 톱니가 45도로 깎여 있어서 90도로 힘이 꺾이는 게 신기해!', part: '중앙 경사 베벨 기어' },
      { author: '🤖 AI 메카몽', time: '8분 전', text: '정답이에요! 두 기어의 깔때기 각도가 만나서 직각 전환을 만들어내요!', part: '중앙 경사 베벨 기어' },
      { author: '이서연', time: '2분 전', text: '칼날이 일자가 아니라 꼬여있어서 연필이 안 부러지는구나!', part: '나선형 칼날 컷터' }
    ],
    quiz: {
      q: '연필깎이 손잡이를 2바퀴 돌릴 때 칼날이 6바퀴 돌았습니다. 칼날은 손잡이보다 몇 배 더 빠를까요?',
      options: ['2배 빠름', '3배 빠름', '6배 빠름', '똑같음'],
      correct: 1,
      explanation: '입력 2회전에 출력 6회전이므로 6 ÷ 2 = 3배 더 빠르게 돌아요! 속도가 빨라지는 대신 회전 힘은 감속됩니다.'
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

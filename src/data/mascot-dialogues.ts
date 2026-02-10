import { EvolutionLevel } from '../types';

// 진화 레벨별 기운이의 한마디
export const levelQuotes: Record<EvolutionLevel, string> = {
  0: '아직은 작고 여린 씨앗이지만, 당신의 관심이 저를 키울 거예요.',
  1: '눈을 떴어요! 세상이 이렇게 아름다웠다니... 더 보고 싶어요!',
  2: '날개가 생겼어요! 당신과 함께라면 어디든 날아갈 수 있을 것 같아요.',
  3: '제가 빛나고 있나요? 이건 전부 당신이 보내준 기운 덕분이에요.',
  4: '완전체가 되었어요. 당신의 모든 관심이 지금의 저를 만들었답니다.',
};

// 대표 기운이 타입별 기운 받기 반응
export const feedingReactions: Record<number, string> = {
  1: '우와, 오늘 기운 맛있다! 힘이 불끈!',
  2: '오늘의 기운은... 이런 색이구나. 예뻐.',
  3: '짜릿해! 에너지 충전 완료!',
  4: '따뜻해~ 고마워, 오늘도 좋은 하루야!',
  5: '...고마워. (조용히 미소)',
  6: '감사히 잘 먹을게. 넉넉하게 받았어.',
  7: '후~ 오늘도 좋은 기운이다. 고마워.',
  8: '맛있다! 어디서 가져온 기운이야? 신기해!',
  9: '오! 이 기운에서 뭔가 떠오르는데...?',
  10: '와아! 반짝반짝해! 진짜 예쁘다!',
  11: '...냠. 든든하다. (묵묵히 씹는다)',
  12: '오늘도 기운 가져와줬구나. 항상 고마워.',
  13: '야호! 오늘도 기운 받았다! 기분 좋아~!',
  14: '...이 기운, 오늘 나에게 잘 어울려.',
  15: '기운 영양 분석 완료. 양호해. 감사.',
  16: '믿고 먹는 기운. 고마워, 약속 지켜줘서.',
  17: '두근두근! 오늘 기운은 뭔가 특별한 느낌!',
  18: '흠, 나쁘지 않아. ...맛있어. (안 보임)',
  19: '고마워~ 천천히 먹을게, 급할 거 없잖아~',
  20: '새로운 기운이 밝아오네. 오늘도 고마워.',
};

// 터치 반응 — 기운 미확인
export const touchIdleLines = [
  '기운 주세요...',
  '졸려요...',
  '오늘 기운은 언제 오나~',
  '배고파요...',
  '기운이 필요해요...',
];

// 터치 반응 — 기운 확인 후
export const touchFedLines = [
  '고마워요!',
  '기운이 넘쳐요!',
  '내일도 와줄 거죠?',
  '오늘 기분 좋아!',
  '히히, 간지러워~',
  '같이 있으니까 좋다!',
];

// 시간대별 홈 화면 멘트
export function getTimeBasedGreeting(mascotName: string, hasFedToday: boolean, streak: number): string {
  if (hasFedToday) {
    return '오늘의 기운을 받았어요! 내일도 와주실 거죠?';
  }

  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return '좋은 아침이에요! 오늘의 기운이 기다리고 있어요';
  }
  if (hour >= 12 && hour < 18) {
    return `${mascotName}이가 같이 놀고 싶대요`;
  }
  if (hour >= 18 && hour < 24) {
    return '오늘 하루도 수고했어요';
  }
  return `${mascotName}이가 꿈나라에서 기다리고 있어요`;
}

// 진화 메시지
export const evolutionMessages: Record<number, { title: string; message: string }> = {
  1: {
    title: '눈을 떴어요!',
    message: '당신의 관심이 이 아이를 깨워냈어요.\n이제 기운이가 당신을 볼 수 있어요.',
  },
  2: {
    title: '날개가 생겼어요!',
    message: '당신과 함께한 시간이\n이 아이에게 날개를 선물했나 봐요.',
  },
  3: {
    title: '빛나고 있어요!',
    message: '당신과 기운이 사이에\n특별한 유대가 만들어졌어요.',
  },
  4: {
    title: '완전체가 되었어요!',
    message: '당신이 보내준 모든 관심이\n이 순간을 만들었어요.\n이제 하나의 기운이에요.',
  },
};

// 도감 칭호
export function getCollectionTitle(count: number): string {
  if (count >= 20) return '기운 마스터';
  if (count >= 15) return '기운 현자';
  if (count >= 9) return '기운 수집가';
  if (count >= 4) return '기운 탐험가';
  return '기운 새내기';
}

import type { P2PQuakeRecord } from '../types/quake';
import type { AppLanguage } from './i18n';
import { getEEWMaxScale, getRecordMagnitude, getRecordMaxScale } from './quakeParser';

export type AdviceSeverityTier = 'critical' | 'strong' | 'moderate' | 'routine';

export interface AdviceChip {
  id: string;
  title: string;
  detail: string;
  priority: 'urgent' | 'high' | 'normal';
}

export interface EarthquakePreparednessAdvice {
  tier: AdviceSeverityTier;
  tierLabel: string;
  summary: string;
  hasTsunamiRisk: boolean;
  evacuationMindset: AdviceChip[];
  stockpileAdvice: AdviceChip[];
}

export function getEarthquakeSeverityTier(record: P2PQuakeRecord): {
  tier: AdviceSeverityTier;
  hasTsunamiRisk: boolean;
} {
  if (record.code === 552) {
    const hasActiveTsunami =
      !record.cancelled &&
      Boolean(
        record.areas?.some(
          (a) => a.grade === 'MajorWarning' || a.grade === 'Warning' || a.grade === 'Watch'
        )
      );
    const hasMajor =
      !record.cancelled &&
      Boolean(
        record.areas?.some((a) => a.grade === 'MajorWarning' || a.grade === 'Warning')
      );
    return {
      tier: hasMajor ? 'critical' : hasActiveTsunami ? 'strong' : 'routine',
      hasTsunamiRisk: hasActiveTsunami,
    };
  }

  if (record.code === 556) {
    if (record.cancelled) {
      return { tier: 'routine', hasTsunamiRisk: false };
    }
    const maxScale = getEEWMaxScale(record);
    const mag = getRecordMagnitude(record) ?? 0;
    if (maxScale >= 55 || mag >= 7.0) {
      return { tier: 'critical', hasTsunamiRisk: mag >= 6.5 };
    }
    if (maxScale >= 45 || mag >= 5.5) {
      return { tier: 'strong', hasTsunamiRisk: false };
    }
    return { tier: 'moderate', hasTsunamiRisk: false };
  }

  if (record.code === 554) {
    return { tier: 'strong', hasTsunamiRisk: false };
  }

  if (record.code === 561) {
    return { tier: 'routine', hasTsunamiRisk: false };
  }

  // Code 551
  const scale = getRecordMaxScale(record);
  const mag = getRecordMagnitude(record) ?? 0;
  const tsunami = record.earthquake.domesticTsunami;
  const hasTsunamiRisk = tsunami === 'Warning' || tsunami === 'Watch';

  if (scale >= 55 || mag >= 7.0 || tsunami === 'Warning') {
    return { tier: 'critical', hasTsunamiRisk };
  }
  if (scale >= 45 || mag >= 5.5 || tsunami === 'Watch') {
    return { tier: 'strong', hasTsunamiRisk };
  }
  if (scale >= 30 || mag >= 4.0) {
    return { tier: 'moderate', hasTsunamiRisk };
  }
  return { tier: 'routine', hasTsunamiRisk };
}

const TIER_LABELS: Record<AppLanguage, Record<AdviceSeverityTier, { label: string; summary: string }>> = {
  ja: {
    critical: {
      label: '大規模・厳重警戒（震度6弱以上 / M7.0+ 相当）',
      summary: '直ちに命を守る行動と二次災害（火災・建物倒壊・余震）への厳重警戒が必要です。',
    },
    strong: {
      label: '強い揺れ・警戒（震度5弱〜5強 / M5.5+ 相当）',
      summary: '落下物・ガラス飛散・ガス遮断の確認を行い、同程度の余震に警戒してください。',
    },
    moderate: {
      label: '中規模・安全点検（震度3〜4 / M4.0+ 相当）',
      summary: '落ち着いて周囲の安全と避難経路・家具固定・備蓄品の点検を行う機会です。',
    },
    routine: {
      label: '日常の備え・確認（震度1〜2 / 感知・通常確認）',
      summary: '小さな揺れのうちに、家族との連絡手段や非常持ち出し袋の期限を確認しましょう。',
    },
  },
  en: {
    critical: {
      label: 'Major / Critical Alert (Intensity 6L+ / M7.0+)',
      summary: 'Immediate life-safety action and vigilance against fire, structural collapse, and strong aftershocks.',
    },
    strong: {
      label: 'Strong Shaking Alert (Intensity 5L–5U / M5.5+)',
      summary: 'Watch for falling objects and shattered glass; check gas shutoff and prepare for aftershocks.',
    },
    moderate: {
      label: 'Moderate Quake Check (Intensity 3–4 / M4.0+)',
      summary: 'Stay calm, verify safe exit paths, inspect furniture anchors, and review emergency supplies.',
    },
    routine: {
      label: 'Routine Preparedness (Intensity 1–2 / Sensor Info)',
      summary: 'Use minor seismic activity as a prompt to verify family contacts and emergency kit expiry dates.',
    },
  },
  zh: {
    critical: {
      label: '强震重度警戒（震度6弱以上 / M7.0+）',
      summary: '请立即采取保全生命的避险行动，并严防火灾、建筑倒塌与强余震。',
    },
    strong: {
      label: '强摇晃警戒（震度5弱–5强 / M5.5+）',
      summary: '注意高空坠物与碎玻璃，检查燃气切断情况，警惕同级别余震。',
    },
    moderate: {
      label: '中规模安全排查（震度3–4 / M4.0+）',
      summary: '保持冷静，确认疏散通道畅通，检查家具固定与应急物资库存。',
    },
    routine: {
      label: '日常防灾确认（震度1–2 / 体感信息）',
      summary: '趁摇晃较小时核对家人联络方式及应急包中饮用水与食品的有效期。',
    },
  },
  ko: {
    critical: {
      label: '대규모 엄중 경계 (진도 6약 이상 / M7.0+)',
      summary: '즉시 생명을 지키는 대피 행동을 취하고 화재・건물 붕괴・강한 여진에 대비하세요.',
    },
    strong: {
      label: '강한 흔들림 경계 (진도 5약–5강 / M5.5+)',
      summary: '낙하물과 유리 파손에 주의하고 가스 차단 여부 확인 및 여진에 대비하세요.',
    },
    moderate: {
      label: '중규모 안전 점검 (진도 3–4 / M4.0+)',
    summary: '침착하게 주변 안전과 대피 경로, 가구 고정 및 비축 물품을 점검하세요.',
    },
    routine: {
      label: '일상 방재 점검 (진도 1–2 / 체감・일반)',
      summary: '작은 흔들림이 있을 때 가족 연락 방법과 비상 배낭 유통기한을 미리 확인하세요.',
    },
  },
};

const TSUNAMI_CHIP: Record<AppLanguage, AdviceChip> = {
  ja: {
    id: 'tsunami-high-ground',
    title: '高台・津波避難ビルへ即時避難',
    detail: '海岸・河川から直ちに離れ、警報解除まで戻らないでください（第2波・第3波に警戒）。',
    priority: 'urgent',
  },
  en: {
    id: 'tsunami-high-ground',
    title: 'Evacuate to High Ground Immediately',
    detail: 'Move away from coasts and rivers at once; do not return until official warnings are lifted.',
    priority: 'urgent',
  },
  zh: {
    id: 'tsunami-high-ground',
    title: '立即向高地或海啸避难建筑撤离',
    detail: '立刻远离海岸与河口，在官方解除海啸警报前切勿返回低洼地带。',
    priority: 'urgent',
  },
  ko: {
    id: 'tsunami-high-ground',
    title: '고지대・쓰나미 대피 건물로 즉시 대피',
    detail: '해안・하천에서 즉시 벗어나 공식 경보가 해제될 때까지 절대 돌아가지 마세요.',
    priority: 'urgent',
  },
};

const ADVICE_BANK: Record<
  AppLanguage,
  Record<AdviceSeverityTier, { mindset: AdviceChip[]; stockpile: AdviceChip[] }>
> = {
  ja: {
    critical: {
      mindset: [
        {
          id: 'c-m1',
          title: '落下・倒壊から頭部を保護',
          detail: '頑丈な机の下や柱のそばに身を寄せ、揺れが収まるまで動かないでください。',
          priority: 'urgent',
        },
        {
          id: 'c-m2',
          title: '避難時のブレーカー遮断と履物確保',
          detail: '停電復旧時の通電火災を防ぐため避難前にブレーカーを落とし、ガラス対策で厚底靴を着用。',
          priority: 'urgent',
        },
        {
          id: 'c-m3',
          title: '余震・土砂・倒壊建物に近づかない',
          detail: '損傷した家屋に再入室せず、家族との安否確認は災害用伝言ダイヤル(171)等を活用。',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 'c-s1',
          title: '非常持ち出し袋（3日分の飲料水・食料）',
          detail: '1人1日3Lの水・加熱不要の非常食を最優先で携行。',
          priority: 'urgent',
        },
        {
          id: 'c-s2',
          title: '電源・照明・簡易トイレ・常備薬',
          detail: 'モバイルバッテリー・乾電池式ライト・携帯トイレ・現金・身分証・お薬手帳を確認。',
          priority: 'high',
        },
      ],
    },
    strong: {
      mindset: [
        {
          id: 's-m1',
          title: '避難経路（玄関・窓）の確保',
          detail: '揺れが落ち着いたら扉を開けて脱出口を確保し、足元のガラス片に注意してください。',
          priority: 'high',
        },
        {
          id: 's-m2',
          title: '火気・ガス漏れ確認と1週間の余震警戒',
          detail: 'ガス臭い場合は元栓を閉めて換気し、今後1週間程度は同規模の余震に備えてください。',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 's-s1',
          title: '断水に備えた生活用水の確保',
          detail: '通水しているうちに飲料水を汲み置き、スマホ・バッテリーを満充電にしておきましょう。',
          priority: 'high',
        },
        {
          id: 's-s2',
          title: 'ヘルメット・軍手・ライトを玄関へ配置',
          detail: 'すぐ持ち出せる場所に懐中電灯・作業手袋・最低3〜7日分の備蓄をまとめておくと安心です。',
          priority: 'normal',
        },
      ],
    },
    moderate: {
      mindset: [
        {
          id: 'm-m1',
          title: '棚・窓際から離れ状況を確認',
          detail: '本棚や照明の下から離れ、公式の震源・津波情報を落ち着いて確認しましょう。',
          priority: 'normal',
        },
        {
          id: 'm-m2',
          title: 'ハザードマップと避難ルート再確認',
          detail: '自宅・職場周辺の指定緊急避難場所と安全な徒歩経路を改めて見直してください。',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'm-s1',
          title: '家具の転倒防止・飛散防止の点検',
          detail: '突っ張り棒やL字金具の緩み、高い棚の重い荷物の配置を見直しましょう。',
          priority: 'normal',
        },
        {
          id: 'm-s2',
          title: 'ローリングストック（水・食料・電池）確認',
          detail: '飲料水・レトルト食品・乾電池・簡易トイレの備蓄量が3〜7日分あるか確認してください。',
          priority: 'normal',
        },
      ],
    },
    routine: {
      mindset: [
        {
          id: 'r-m1',
          title: '屋内の安全ゾーン・避難場所を把握',
          detail: '家族で「どこに隠れるか」「どこへ集まるか」と171伝言サービスの使い方を共有しましょう。',
          priority: 'normal',
        },
        {
          id: 'r-m2',
          title: '夜間用の枕元対策',
          detail: '就寝中の地震に備え、枕元にスリッパ（厚底）と懐中電灯を常備しておくと安全です。',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'r-s1',
          title: '備蓄水・非常食の消費期限チェック',
          detail: '1人1日3L×3日分以上の水・非常食・常備薬の期限切れがないか点検しましょう。',
          priority: 'normal',
        },
        {
          id: 'r-s2',
          title: '予備電源・モバイルバッテリーの充電維持',
          detail: '停電時に備え、モバイルバッテリーの残量と乾電池の予備を定期的に確認してください。',
          priority: 'normal',
        },
      ],
    },
  },
  en: {
    critical: {
      mindset: [
        {
          id: 'c-m1',
          title: 'Drop, Cover, and Hold On',
          detail: 'Protect your head under a sturdy table away from windows until shaking stops completely.',
          priority: 'urgent',
        },
        {
          id: 'c-m2',
          title: 'Shut Off Main Breaker & Wear Sturdy Shoes',
          detail: 'Turn off main breakers before evacuating to prevent electrical fires; wear shoes against broken glass.',
          priority: 'urgent',
        },
        {
          id: 'c-m3',
          title: 'Avoid Damaged Buildings & Watch Aftershocks',
          detail: 'Do not re-enter cracked structures; confirm family safety via emergency message services (171/SNS).',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 'c-s1',
          title: 'Go-Bag: 3 Days of Water & Ready Food',
          detail: 'Carry at least 3L/person/day of drinking water and no-cook rations immediately.',
          priority: 'urgent',
        },
        {
          id: 'c-s2',
          title: 'Power Bank, Radio, Portable Toilets & Meds',
          detail: 'Pack mobile battery, crank flashlight/radio, sanitation kits, cash, ID, and prescriptions.',
          priority: 'high',
        },
      ],
    },
    strong: {
      mindset: [
        {
          id: 's-m1',
          title: 'Secure Exit Doorways & Watch Glass',
          detail: 'Once shaking subsides, open a door to secure an escape route and watch for debris.',
          priority: 'high',
        },
        {
          id: 's-m2',
          title: 'Check Gas Leaks & Expect Aftershocks',
          detail: 'If you smell gas, shut the main valve and ventilate. Stay alert for strong aftershocks this week.',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 's-s1',
          title: 'Store Water & Top Up Device Batteries',
          detail: 'Fill clean containers with water while taps still run and charge phones/power banks to 100%.',
          priority: 'high',
        },
        {
          id: 's-s2',
          title: 'Stage Helmet, Gloves & Flashlight by Exit',
          detail: 'Keep work gloves, sturdy footwear, and a 3–7 day emergency kit accessible near your door.',
          priority: 'normal',
        },
      ],
    },
    moderate: {
      mindset: [
        {
          id: 'm-m1',
          title: 'Step Away from Shelves & Windows',
          detail: 'Keep clear of tall furniture and monitor official tremor/tsunami updates calmly.',
          priority: 'normal',
        },
        {
          id: 'm-m2',
          title: 'Review Hazard Map & Evacuation Route',
          detail: 'Verify your nearest designated evacuation shelter and safe walking paths.',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'm-s1',
          title: 'Inspect Furniture Anchors & Glass Film',
          detail: 'Tighten anti-tip brackets/tension rods and move heavy items down from high shelves.',
          priority: 'normal',
        },
        {
          id: 'm-s2',
          title: 'Rotate 3–7 Days of Emergency Supplies',
          detail: 'Check drinking water, canned/dry food, spare batteries, and portable toilet stock.',
          priority: 'normal',
        },
      ],
    },
    routine: {
      mindset: [
        {
          id: 'r-m1',
          title: 'Confirm Safe Zones & Family Contact Plan',
          detail: 'Agree on indoor safe spots and an out-of-area contact method with household members.',
          priority: 'normal',
        },
        {
          id: 'r-m2',
          title: 'Bedside Slippers & Flashlight',
          detail: 'Keep thick-soled slippers and a flashlight beside your bed in case a night tremor strikes.',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'r-s1',
          title: 'Audit Water & Food Expiration Dates',
          detail: 'Verify at least 3 days (ideally 7) of stored water (3L/day/person) and emergency rations.',
          priority: 'normal',
        },
        {
          id: 'r-s2',
          title: 'Keep Power Banks Charged',
          detail: 'Test spare batteries and top up portable chargers regularly for blackout readiness.',
          priority: 'normal',
        },
      ],
    },
  },
  zh: {
    critical: {
      mindset: [
        {
          id: 'c-m1',
          title: '蹲下掩护，护住头部',
          detail: '立即躲到坚固桌下或承重墙旁，远离玻璃窗，待摇晃完全停止后再移动。',
          priority: 'urgent',
        },
        {
          id: 'c-m2',
          title: '撤离前切断电源总闸并穿好厚底鞋',
          detail: '防止复电引发电气火灾，穿好鞋子避免被碎玻璃划伤。',
          priority: 'urgent',
        },
        {
          id: 'c-m3',
          title: '远离受损建筑并警惕强余震',
          detail: '切勿轻易返回受损房屋，使用灾害留言服务（171）或网络与家人确认安全。',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 'c-s1',
          title: '应急逃生包（至少3天饮用水与口粮）',
          detail: '按每人每天3L准备饮用水及免加热即食应急食品。',
          priority: 'urgent',
        },
        {
          id: 'c-s2',
          title: '充电宝、手电收音机、便携厕所与药品',
          detail: '携带移动电源、备用电池、简易厕所、现金、证件及常用处方药。',
          priority: 'high',
        },
      ],
    },
    strong: {
      mindset: [
        {
          id: 's-m1',
          title: '打开房门确保逃生通道',
          detail: '摇晃稍缓后立即打开大门防止门框变形被困，留意地面碎玻璃。',
          priority: 'high',
        },
        {
          id: 's-m2',
          title: '排查燃气泄漏并防范未来一周余震',
          detail: '若闻到燃气味立即关闭总阀并开窗通风，未来一周内需警惕同等规模余震。',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 's-s1',
          title: '趁未停水储水并充满手机电源',
          detail: '立即接满生活与饮用备用清水，将手机与充电宝保持满电。',
          priority: 'high',
        },
        {
          id: 's-s2',
          title: '将头盔、手套与手电放置在玄关处',
          detail: '整理3–7天应急物资包置于门口，以便随时快速撤离。',
          priority: 'normal',
        },
      ],
    },
    moderate: {
      mindset: [
        {
          id: 'm-m1',
          title: '远离书架与窗户保持冷静',
          detail: '避开高处置物架，及时关注官方震源与海啸信息通报。',
          priority: 'normal',
        },
        {
          id: 'm-m2',
          title: '核对避难地图与步行撤离路线',
          detail: '重新确认住宅或办公地附近的指定紧急避难场所及安全路线。',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'm-s1',
          title: '检查家具防倾倒与玻璃防飞溅贴膜',
          detail: '加固支撑杆或L型固定件，避免高处摆放重物。',
          priority: 'normal',
        },
        {
          id: 'm-s2',
          title: '滚动更新3–7天饮水与干粮储备',
          detail: '核查饮用水、干粮、干电池和便携卫生用品是否充足。',
          priority: 'normal',
        },
      ],
    },
    routine: {
      mindset: [
        {
          id: 'r-m1',
          title: '与家人约定安全躲避点与联络方式',
          detail: '明确家中相对安全区域及灾后集合地点、应急联络号码。',
          priority: 'normal',
        },
        {
          id: 'r-m2',
          title: '床边常备拖鞋与手电筒',
          detail: '防备夜间突发地震导致停电或地面玻璃碎裂。',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'r-s1',
          title: '检查应急水粮保质期',
          detail: '确保每人每天3L（至少3天）饮用水及应急食品处于有效期内。',
          priority: 'normal',
        },
        {
          id: 'r-s2',
          title: '定期检查备用电源与充电宝电量',
          detail: '防止停电时通讯中断，定期补充检查电池电量。',
          priority: 'normal',
        },
      ],
    },
  },
  ko: {
    critical: {
      mindset: [
        {
          id: 'c-m1',
          title: '낙하・붕괴로부터 머리 보호',
          detail: '튼튼한 책상 아래로 몸을 숨기고 흔들림이 완전히 멈출 때까지 움직이지 마세요.',
          priority: 'urgent',
        },
        {
          id: 'c-m2',
          title: '대피 전 차단기 내리기・튼튼한 신발 착용',
          detail: '복전 시 통전 화재를 막기 위해 차단기를 내리고 유리 파편에 대비해 신발을 신으세요.',
          priority: 'urgent',
        },
        {
          id: 'c-m3',
          title: '파손 건물 접근 금지 및 여진 경계',
          detail: '손상된 건물에 다시 들어가지 말고 재해 전언 서비스(171) 등으로 안부를 확인하세요.',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 'c-s1',
          title: '비상 배낭 (최소 3일분 식수・비상식)',
          detail: '1인 1일 3L 식수와 가열 없이 먹을 수 있는 비상식량을 최우선으로 챙기세요.',
          priority: 'urgent',
        },
        {
          id: 'c-s2',
          title: '보조배터리・라디오・간이화장실・상비약',
          detail: '모바일 배터리, 손전등/라디오, 위생용품, 현금, 신분증, 처방약을 확인하세요.',
          priority: 'high',
        },
      ],
    },
    strong: {
      mindset: [
        {
          id: 's-m1',
          title: '현관문 개방으로 탈출로 확보',
          detail: '흔들림이 잦아들면 문을 열어 대피로를 확보하고 바닥 유리 파편을 조심하세요.',
          priority: 'high',
        },
        {
          id: 's-m2',
          title: '가스 누출 점검 및 1주간 여진 주의',
          detail: '가스 냄새가 나면 밸브를 잠그고 환기하세요. 향후 1주일 정도 동급 여진에 대비하세요.',
          priority: 'high',
        },
      ],
      stockpile: [
        {
          id: 's-s1',
          title: '단수 대비 생활용수 확보・배터리 완충',
          detail: '수도가 나올 때 식수를 받아 두고 휴대전화와 보조배터리를 즉시 충전하세요.',
          priority: 'high',
        },
        {
          id: 's-s2',
          title: '헬멧・장갑・손전등 현관 배치',
          detail: '3~7일분 비상 키트와 보호 장비를 출입구 근처에 두어 즉시 대피할 수 있게 하세요.',
          priority: 'normal',
        },
      ],
    },
    moderate: {
      mindset: [
        {
          id: 'm-m1',
          title: '선반・창가에서 떨어져 상황 확인',
          detail: '높은 가구와 유리창에서 떨어져 기상청 공식 진원・쓰나미 정보를 확인하세요.',
          priority: 'normal',
        },
        {
          id: 'm-m2',
          title: '해저드맵・지정 대피 경로 재확인',
          detail: '주거지 및 직장 주변의 지정 긴급 대피 장소와 안전한 도보 경로를 다시 점검하세요.',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'm-s1',
          title: '가구 전도 방지・비산 방지 점검',
          detail: '고정 브래킷과 지지대 풀림 여부를 확인하고 무거운 물건은 아래 칸으로 옮기세요.',
          priority: 'normal',
        },
        {
          id: 'm-s2',
          title: '롤링 스톡 (식수・식량・건전지) 점검',
          detail: '3~7일분의 식수, 비상식, 건전지, 간이 화장실 비축량을 확인하세요.',
          priority: 'normal',
        },
      ],
    },
    routine: {
      mindset: [
        {
          id: 'r-m1',
          title: '실내 안전 구역 및 가족 연락 계획 확인',
          detail: '가족 간 대피 장소와 171 등 비상 연락 수단을 미리 공유해 두세요.',
          priority: 'normal',
        },
        {
          id: 'r-m2',
          title: '침대 옆 슬리퍼・손전등 상비',
          detail: '야간 지진 시 정전과 유리 파편에 대비해 침대 옆에 튼튼한 슬리퍼와 손전등을 두세요.',
          priority: 'normal',
        },
      ],
      stockpile: [
        {
          id: 'r-s1',
          title: '비축 식수・비상식 유통기한 점검',
          detail: '1인 1일 3L 기준 최소 3일분 이상의 식수와 비상식 유효기간을 확인하세요.',
          priority: 'normal',
        },
        {
          id: 'r-s2',
          title: '예비 전원・보조배터리 충전 유지',
          detail: '정전에 대비해 보조배터리 잔량과 예비 건전지를 정기적으로 점검하세요.',
          priority: 'normal',
        },
      ],
    },
  },
};

export function buildEarthquakePreparednessAdvice(
  record: P2PQuakeRecord,
  lang: AppLanguage = 'ja'
): EarthquakePreparednessAdvice {
  const { tier, hasTsunamiRisk } = getEarthquakeSeverityTier(record);
  const tierMeta = TIER_LABELS[lang][tier];
  const bank = ADVICE_BANK[lang][tier];

  const mindset = hasTsunamiRisk
    ? [TSUNAMI_CHIP[lang], ...bank.mindset]
    : [...bank.mindset];

  return {
    tier,
    tierLabel: tierMeta.label,
    summary: tierMeta.summary,
    hasTsunamiRisk,
    evacuationMindset: mindset,
    stockpileAdvice: [...bank.stockpile],
  };
}

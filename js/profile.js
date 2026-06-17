/** User profile persisted in localStorage — province, category, rank. */

const STORAGE_KEY = "junxian_profile_v1";

/** @typedef {{ province: string; category: string; rank: number|null; savedAt: string }} UserProfile */

/** @type {UserProfile} */
const DEFAULTS = {
  province: "四川",
  category: "物理",
  rank: null,
  savedAt: "",
};

/** @type {Set<(p: UserProfile) => void>} */
const listeners = new Set();

/** @returns {UserProfile} */
export function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/** @param {Partial<UserProfile>} patch */
export function saveProfile(patch) {
  const next = { ...getProfile(), ...patch, savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn(next));
  return next;
}

/** @param {(p: UserProfile) => void} fn */
export function onProfileChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Map sim category to scores filter category for a province */
export function scoreCategoryFor(province, simCategory) {
  const modes = {
    北京: "新高考", 天津: "新高考", 河北: "新高考", 山西: "老高考", 内蒙古: "老高考",
    辽宁: "新高考", 吉林: "新高考", 黑龙江: "新高考", 上海: "新高考", 江苏: "新高考",
    浙江: "新高考", 安徽: "新高考", 福建: "新高考", 江西: "新高考", 山东: "新高考",
    河南: "老高考", 湖北: "新高考", 湖南: "新高考", 广东: "新高考", 广西: "新高考",
    海南: "新高考", 重庆: "新高考", 四川: "老高考", 贵州: "新高考", 云南: "老高考",
    西藏: "老高考", 陕西: "老高考", 甘肃: "新高考", 青海: "老高考", 宁夏: "老高考", 新疆: "老高考",
  };
  const mode = modes[province] || "老高考";
  if (mode === "老高考") {
    return simCategory === "历史" ? "文史" : "理工";
  }
  return simCategory === "历史" ? "历史" : "物理";
}

export function buildConsultText(profile = getProfile()) {
  const rank = profile.rank != null ? `位次${profile.rank}` : "位次待填";
  return `${profile.province} · ${profile.category} · ${rank} · 咨询川大报考`;
}

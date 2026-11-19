/** 占位文字判定（纯函数，无依赖；卡面内容守卫、计划检查、片头节拍共用）。 */
/** 占位文字：整条文字（去掉标点空白后）等于这些词，或含「强占位片段」，一律不许出现在卡面。 */
const WHOLE = /^(示意|示意图|示例|样例|范例|占位|占位符|占位文字|占位文本|标题|副标题|小标题|文字|文本|内容|说明|描述|待补充|待填|待定|待写|某某|某某某|请输入.*|点击输入.*|在此输入.*|此处填写.*|text|title|label|subtitle|caption|content|desc|description|sample|demo|test|placeholder|tbd|todo|n\/a|na|null|undefined|x{2,}|a{3,}|测试|测试文字|测试文本|文字文字|标题标题|1{3,}|0{3,}|\.{2,}|…+|-{2,}|\?+|？+)$/i;
const STRONG = /lorem|ipsum|todo|待补充|占位|此处填写|请输入|xxx{1,}|示意文字|样例文字|文字内容|标题文字|[·・—\-\s](示意|示例|占位)$|^(示意|示例)[·・:：]/i;
const norm = (s: string) => s.replace(/[\s\u3000·•・,，.。:：;；!！|｜/\\()（）【】\[\]<>《》"'“”‘’_-]+/g, '');
export const isPlaceholderText = (raw: string): boolean => {
  const t = String(raw ?? '').trim();
  if (!t) return false;
  const n = norm(t);
  return WHOLE.test(t) || (n.length > 0 && WHOLE.test(n)) || STRONG.test(t);
};


import type { HistoryDay, MealRecord } from "./types";

/** mock 识别结果:一份烤鸡胸肉餐 */
export const mockMeal: MealRecord = {
  id: "meal_mock_001",
  date: new Date().toISOString().slice(0, 10),
  photoUrl: null,
  items: [
    {
      id: "f1",
      name: "烤鸡胸肉",
      portionGrams: 150,
      kcal: { low: 210, mid: 248, high: 285 },
    },
    {
      id: "f2",
      name: "糙米饭",
      portionGrams: 120,
      kcal: { low: 130, mid: 150, high: 172 },
    },
    {
      id: "f3",
      name: "牛油果(半颗)",
      portionGrams: 70,
      kcal: { low: 105, mid: 120, high: 138 },
    },
    {
      id: "f4",
      name: "小番茄",
      portionGrams: 60,
      kcal: { low: 10, mid: 12, high: 14 },
    },
  ],
};

/** mock 历史记录:近两天 */
export const mockHistory: HistoryDay[] = [
  {
    label: "07.23 THU",
    entries: [
      {
        id: "h1",
        name: "牛油果吐司",
        time: "08:30",
        kcal: { low: 320, high: 450 },
        photoUrl: null,
      },
      {
        id: "h2",
        name: "黑咖啡",
        time: "09:15",
        kcal: { low: 5, high: 10 },
        photoUrl: null,
      },
    ],
  },
  {
    label: "07.22 WED",
    entries: [
      {
        id: "h3",
        name: "芝士汉堡",
        time: "13:45",
        kcal: { low: 550, high: 700 },
        photoUrl: null,
      },
    ],
  },
];

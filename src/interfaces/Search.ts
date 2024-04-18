export enum Order {
  ASC = 1,
  DESC = 0,
}
interface OrderItem {
  value: Order;
  description: string;
}
export const orders: OrderItem[] = [
  { value: Order.ASC, description: "正序" },
  { value: Order.DESC, description: "倒序" },
];

export enum SortBy {
  CREATION_DATE = 0,
  MEMBER_COUNT = 1,
  LIKES = 2,
}
interface SortByItem {
  value: SortBy;
  description: string;
}
export const sortBys: SortByItem[] = [
  { value: SortBy.CREATION_DATE, description: "创建时间" },
  { value: SortBy.MEMBER_COUNT, description: "成员数量" },
  { value: SortBy.LIKES, description: "点赞数量" },
];

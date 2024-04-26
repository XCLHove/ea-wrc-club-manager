export enum Order {
  ASC = 1,
  DESC = 0,
}
export const orders: { [key: number]: string } = {
  [Order.ASC]: "asc",
  [Order.DESC]: "desc",
};

export enum SortBy {
  CREATION_DATE = 0,
  MEMBER_COUNT = 1,
  LIKES = 2,
}
export const sortBys: { [key: number]: string } = {
  [SortBy.CREATION_DATE]: "creationDate",
  [SortBy.MEMBER_COUNT]: "memberCount",
  [SortBy.LIKES]: "likes",
};

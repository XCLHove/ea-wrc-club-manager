export interface MenuItem {
  path: string;
  title: string;
  order: number;
  children?: MenuItem[];
}

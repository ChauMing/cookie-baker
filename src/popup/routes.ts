// 路由配置
import type { ComponentType } from 'react';
import Edit from './Edit';
import List from './List';
import Index from './Index';

export interface RouteConfig {
  name: string;
  path: string;
  exact?: boolean;
  component: ComponentType<any>;
  routes?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'index',
    path: '/',
    exact: false,
    component: Index,
    routes: [
      {
        name: 'edit',
        path: '/edit/:id?',
        exact: true,
        component: Edit,
      },
      {
        name: 'list',
        path: '/list',
        exact: true,
        component: List,
      },
    ],
  },
];

export default routes;

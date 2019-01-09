import Edit from './Edit';
import List from './List';
import Index from './popup/Index';

const routes = [
  {
    name: 'index',
    path: '/',
    exact: false,
    component: Index,
    routes: [
      {
        name: 'edit',
        path: '/edit/?id',
        exact: true,
        component: Edit,
      },
      {
        name: 'list',
        path: '/list',
        exact: true,
        component: List
      }
    ]
  },
];

export default routes;
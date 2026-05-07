// popup 入口：挂载根路由到 #app
// 预先引入 antd 3 运行期条件 require 的依赖，避免扩展环境下 `require is not defined`
import "mutationobserver-shim";
import "classnames";
import type React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, RouteComponentProps } from "react-router-dom";
import routes, { RouteConfig } from "./popup/routes";
import "./index.less";

interface AppProps {
  routes: RouteConfig[];
}

const App: React.FC<AppProps> = (props) => (
  <div>
    {props.routes.map((route) => (
      <Route
        exact={route.exact || false}
        path={route.path}
        key={route.path}
        render={(routeProps: RouteComponentProps) => (
          <route.component {...routeProps} routes={route.routes} />
        )}
      />
    ))}
  </div>
);

const mountNode = document.getElementById("app");
if (mountNode) {
  ReactDOM.render(
    <HashRouter>
      <App routes={routes} />
    </HashRouter>,
    mountNode,
  );
}

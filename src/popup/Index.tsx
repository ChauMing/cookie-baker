// Index：根路由容器，负责渲染子路由并在命中父路径时重定向到列表页
import { Component } from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import type { RouteConfig } from './routes';

interface IndexProps extends RouteComponentProps {
  routes: RouteConfig[];
}

export default class App extends Component<IndexProps> {
  render() {
    const props = this.props;
    return (
      <div>
        <Route
          exact
          path={props.match.url}
          render={() => <Redirect to="/list" />}
        />
        {props.routes.map((route) => (
          <Route
            exact={route.exact || false}
            path={route.path}
            key={route.path}
            render={(routeProps) => (
              <route.component {...routeProps} routes={route.routes} />
            )}
          />
        ))}
      </div>
    );
  }
}

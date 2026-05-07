// 简单的 Header 容器组件：承载 popup 顶部操作按钮
import React from 'react';

type HeaderProps = React.HTMLAttributes<HTMLElement>;

const Header: React.FC<HeaderProps> = (props) => (
  <header className="header" {...props} />
);

export default Header;

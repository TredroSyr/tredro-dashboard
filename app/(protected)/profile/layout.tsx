"use client";

import { Container } from "@/components/container";

type LayoutProps = {
  children: React.ReactNode;
};

const LayoutPage = ({ children }: LayoutProps) => {
  return <Container>{children}</Container>;
};

export default LayoutPage;

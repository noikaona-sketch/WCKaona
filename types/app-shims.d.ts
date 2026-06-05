declare namespace React {
  type ReactNode = any;
}

declare namespace JSX {
  interface ElementChildrenAttribute {
    children: {};
  }

  interface IntrinsicAttributes {
    key?: any;
  }

  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module "*.css";

declare module "react" {
  export type ReactNode = any;
}

declare module "next" {
  export type Metadata = Record<string, unknown>;
  export type NextConfig = Record<string, unknown>;
}

declare module "next/link" {
  const Link: (props: any) => any;
  export default Link;
}

declare module "tailwindcss" {
  export type Config = Record<string, unknown>;
}

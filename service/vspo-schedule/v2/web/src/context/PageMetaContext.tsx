"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";

type PageMeta = {
  title: string;
  lastUpdateTimestamp?: number;
  footerMessage?: string;
};

type PageMetaContextValue = {
  pageMeta: PageMeta;
  setPageMeta: (meta: PageMeta) => void;
};

const defaultPageMeta: PageMeta = { title: "" };

const PageMetaContext = createContext<PageMetaContextValue | null>(null);

const shallowEqual = (a: PageMeta, b: PageMeta): boolean =>
  a.title === b.title &&
  a.lastUpdateTimestamp === b.lastUpdateTimestamp &&
  a.footerMessage === b.footerMessage;

export const PageMetaProvider = ({ children }: { children: ReactNode }) => {
  const [pageMeta, setPageMetaState] = useState<PageMeta>(defaultPageMeta);
  const metaRef = useRef(pageMeta);

  const setPageMeta = (meta: PageMeta) => {
    if (shallowEqual(metaRef.current, meta)) return;
    metaRef.current = meta;
    setPageMetaState(meta);
  };

  return (
    <PageMetaContext.Provider value={{ pageMeta, setPageMeta }}>
      {children}
    </PageMetaContext.Provider>
  );
};

export const usePageMeta = (): PageMetaContextValue => {
  const ctx = useContext(PageMetaContext);
  if (!ctx) {
    throw new Error("usePageMeta must be used within PageMetaProvider");
  }
  return ctx;
};

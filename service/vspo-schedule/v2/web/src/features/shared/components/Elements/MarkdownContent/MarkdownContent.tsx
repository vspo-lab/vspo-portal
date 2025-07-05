import { Box } from "@mui/material";
import type React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  components?: Partial<Components>;
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  components,
}) => {
  const defaultComponents: Partial<Components> = {
    h1: ({ children }) => (
      <Box component="h1" sx={{ fontSize: "2rem", fontWeight: "bold", mb: 2 }}>
        {children}
      </Box>
    ),
    h2: ({ children }) => (
      <Box
        component="h2"
        sx={{ fontSize: "1.5rem", fontWeight: "bold", mt: 3, mb: 2 }}
      >
        {children}
      </Box>
    ),
    h3: ({ children }) => (
      <Box
        component="h3"
        sx={{ fontSize: "1.25rem", fontWeight: "bold", mt: 2, mb: 1 }}
      >
        {children}
      </Box>
    ),
    p: ({ children }) => (
      <Box component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
        {children}
      </Box>
    ),
    ul: ({ children }) => (
      <Box component="ul" sx={{ mb: 2, pl: 3 }}>
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box component="ol" sx={{ mb: 2, pl: 3 }}>
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Box component="li" sx={{ mb: 0.5 }}>
        {children}
      </Box>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "inherit", textDecoration: "underline" }}
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => (
      <Box sx={{ maxWidth: "500px", margin: "20px 0" }}>
        <img src={src} alt={alt} style={{ width: "100%", height: "auto" }} />
      </Box>
    ),
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ ...defaultComponents, ...components }}
    >
      {content}
    </ReactMarkdown>
  );
};

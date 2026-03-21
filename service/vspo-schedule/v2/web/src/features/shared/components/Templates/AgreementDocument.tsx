"use client";

import { styled } from "@mui/material/styles";

export const AgreementDocument = styled("div")(`
  h1 {
    font-size: 2.5rem;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 2rem;
    margin: 1.5rem 0;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  ol,
  ul {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    padding-left: 2rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  a {
    color: #0066cc;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`);

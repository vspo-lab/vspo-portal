import { experimental_AstroContainer as AstroContainer } from "astro/container";

/**
 * Creates a reusable Astro Container for component testing.
 * Reuse per `describe` block to minimize overhead.
 */
export const createContainer = async () => {
  return await AstroContainer.create();
};

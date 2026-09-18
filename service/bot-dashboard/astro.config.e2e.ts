import base from "./astro.config";

// The dev toolbar overlays the bottom of the viewport and would swallow clicks in E2E.
export default { ...base, devToolbar: { enabled: false } };

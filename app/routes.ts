import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/account", "routes/account.tsx"),
  route("/api/portfolio/:userId", "routes/api.portfolio.$userId.ts"),
  route("/api/resume/convert", "routes/api.resume.convert.ts"),
  route("/api/validate-slug", "routes/api.validate-slug.ts"),
  route("/onboarding", "routes/onboarding.tsx"),
  route("/onboarding/complete", "routes/onboarding.complete.tsx"),
  route("/demo", "routes/demo.tsx"),
  route("/upload-resume", "routes/upload-resume.tsx"),
  route("/p/:slug", "routes/p.$slug.tsx"),
  layout("routes/editor.tsx", [
    route("/editor", "routes/editor.basic.tsx"),
    route("/editor/work", "routes/editor.work.tsx"),
    route("/editor/skills", "routes/editor.skills.tsx"),
    route("/editor/social", "routes/editor.social.tsx"),
    route("/editor/stats", "routes/editor.stats.tsx"),
    route("/editor/projects", "routes/editor.projects.tsx"),
    route("/editor/testimonials", "routes/editor.testimonials.tsx"),
  ]),
] satisfies RouteConfig;

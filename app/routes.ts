import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/account", "routes/account.tsx"),
  route("/api/portfolio/:userId", "routes/api.portfolio.$userId.ts"),
  route("/onboarding", "routes/onboarding.tsx"),
  route("/onboarding/complete", "routes/onboarding.complete.tsx"),
  route("/onboarding/review", "routes/onboarding.review.tsx"),
  route("/demo", "routes/demo.tsx"),
  route("/upload-resume", "routes/upload-resume.tsx"),
  route("/p/:slug", "routes/p.$slug.tsx"),
  route("/editor", "routes/editor.tsx", [
    route("basic", "routes/editor.basic.tsx"),
    route("work", "routes/editor.work.tsx"),
    route("skills", "routes/editor.skills.tsx"),
  ]),
] satisfies RouteConfig;

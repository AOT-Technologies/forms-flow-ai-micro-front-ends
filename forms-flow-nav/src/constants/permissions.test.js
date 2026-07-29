import { PERMISSIONS } from "./permissions";

describe("PERMISSIONS constants", () => {
  it("keeps every permission string byte-identical to the API contract", () => {
    expect(PERMISSIONS).toEqual({
      CREATE_SUBMISSIONS: "create_submissions",
      VIEW_SUBMISSIONS: "view_submissions",
      CREATE_DESIGNS: "create_designs",
      VIEW_DESIGNS: "view_designs",
      MANAGE_ADVANCE_WORKFLOWS: "manage_advance_workflows",
      MANAGE_BUNDLES: "manage_bundles",
      MANAGE_INTEGRATIONS: "manage_integrations",
      MANAGE_TEMPLATES: "manage_templates",
      VIEW_TASKS: "view_tasks",
      MANAGE_TASKS: "manage_tasks",
      VIEW_DASHBOARDS: "view_dashboards",
      MANAGE_DASHBOARD_AUTHORIZATIONS: "manage_dashboard_authorizations",
      ANALYZE_SUBMISSIONS_VIEW: "analyze_submissions_view",
      ANALYZE_METRICS_VIEW: "analyze_metrics_view",
      MANAGE_ROLES: "manage_roles",
      MANAGE_USERS: "manage_users",
    });
  });
});

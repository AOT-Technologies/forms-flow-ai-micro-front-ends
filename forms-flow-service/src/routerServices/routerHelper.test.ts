// MULTITENANCY_ENABLED is captured at module load from window._env_, so each
// scenario loads a fresh copy of the router modules via isolateModules.
const loadRouter = (env?: object) => {
  let mod: any;
  jest.isolateModules(() => {
    (global as any).window._env_ = env;
    mod = {
      helper: require("./routerHelper"),
      constants: require("./routerConstants"),
    };
  });
  return mod;
};

const navSpy = () => {
  const calls: string[] = [];
  const navigate = (path: string) => calls.push(path);
  return { navigate, calls };
};

describe("routerHelper (S.27/S.28/S.29 refactor equivalence)", () => {
  describe("single-tenant (multitenancy off)", () => {
    const { helper, constants } = loadRouter(undefined);

    test("process helpers strip /formflow from the base path", () => {
      const { navigate, calls } = navSpy();
      helper.navigateToProcessCreate(navigate, "t1", "/subflow");
      helper.navigateToProcessRoute(navigate, "t1", "/subflow");
      helper.navigateToProcessEditWithParams(navigate, "t1", "/subflow", "k1", {
        a: "b",
      });
      helper.navigateToImportedProcess(navigate, "t1", "/subflow/edit/", "k1");
      expect(calls).toEqual([
        "/subflow/create",
        "/subflow",
        "/subflow/edit/k1?a=b",
        "/subflow/edit/k1",
      ]);
    });

    test("navigateToTaskListingFromReview matches navigateToTaskListing", () => {
      const a = navSpy();
      const b = navSpy();
      helper.navigateToTaskListing(a.navigate, "t1");
      helper.navigateToTaskListingFromReview(b.navigate, "t1");
      expect(b.calls).toEqual(a.calls);
      expect(a.calls).toEqual(["/task"]);
    });

    test("navigateWithHistory and syncRouterPath pass the url through", () => {
      const { navigate, calls } = navSpy();
      helper.navigateWithHistory(navigate, "/somewhere");
      helper.syncRouterPath(navigate, "/elsewhere");
      expect(calls).toEqual(["/somewhere", "/elsewhere"]);
    });

    test("getRoute is memoized per tenantId and stays correct across tenants", () => {
      expect(constants.getRoute("t1")).toBe(constants.getRoute("t1"));
      expect(constants.getRoute("t1").TASK).toBe("/task");
      expect(constants.getRoute("t2").TASK).toBe("/task");
    });
  });

  describe("multitenant", () => {
    const { helper, constants } = loadRouter({
      REACT_APP_MULTI_TENANCY_ENABLED: "true",
    });

    test("process helpers keep the tenant base without trailing slash", () => {
      const { navigate, calls } = navSpy();
      helper.navigateToProcessCreate(navigate, "t1", "/subflow");
      expect(calls).toEqual(["/tenant/t1/subflow/create"]);
    });

    test("getRedirectUrl keeps its trailing slash", () => {
      expect(constants.getRedirectUrl("t1")).toBe("/tenant/t1/");
    });

    test("route map switches correctly between tenants despite the memo", () => {
      expect(constants.getRoute("a").TASK).toBe("/tenant/a/task");
      expect(constants.getRoute("b").TASK).toBe("/tenant/b/task");
      expect(constants.getRoute("a").TASK).toBe("/tenant/a/task");
    });

    test("task/admin navigation uses the tenant base", () => {
      const { navigate, calls } = navSpy();
      helper.navigateToTaskListing(navigate, "t1");
      helper.navigateToAdminRoles(navigate, "t1");
      expect(calls).toEqual(["/tenant/t1/task", "/tenant/t1/admin/roles"]);
    });
  });
});

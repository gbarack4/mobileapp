const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const HOUR = 60 * 60 * 1000;
const START = 1791375000000;
const tokens = {
  AccessToken: "access-test",
  IdToken: "identity-test",
  RefreshToken: "refresh-test",
  ExpiresIn: 3600,
};
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup(options = {}) {
  let now = START;
  const storage = options.storage ?? { credential: null, notice: null };
  const calls = {
    refresh: 0,
    oauthRefresh: 0,
    revoke: [],
    logout: 0,
    writes: 0,
    sync: 0,
  };
  const modules = new Map();
  class Clock extends Date {
    static now() {
      return now;
    }
  }
  const mocks = {
    "./token-storage": {
      readRefreshToken: async () => storage.credential,
      writeRefreshToken: async (value) => {
        calls.writes++;
        await options.beforeWrite?.();
        storage.credential = value;
      },
      removeRefreshToken: async () => {
        storage.credential = null;
      },
      readExpiryNotice: async () => storage.notice,
      writeExpiryNotice: async (value) => {
        storage.notice = value;
      },
    },
    "./cognito.client": {
      refreshCognitoSession: async () => {
        calls.refresh++;
        return options.refresh
          ? options.refresh()
          : {
              accessToken: "access-fresh",
              idToken: "id-fresh",
              expiresIn: 3600,
            };
      },
      revokeCognitoRefreshToken: async (token) => {
        calls.revoke.push(token);
        await options.revoke?.();
      },
    },
    "./oauth-client": {
      refreshOAuthSession: async () => {
        calls.oauthRefresh++;
        return {
          accessToken: "oauth-access",
          idToken: "oauth-id",
          expiresIn: 3600,
          refreshToken: options.rotatedToken ?? "refresh-test",
        };
      },
    },
    "./oauth-logout": {
      logoutOAuthBrowserSession: async () => {
        calls.logout++;
        await options.logout?.();
      },
    },
    "./oauth-transaction": { clearOAuthTransaction: async () => {} },
    "./auth-api": {
      syncCognitoUser: async () => {
        calls.sync++;
        return { userId: "user-test", email: "user@example.com" };
      },
      updateRegistrationProfile: async () => {},
    },
  };
  function load(name) {
    if (mocks[name]) return mocks[name];
    if (modules.has(name)) return modules.get(name);
    const file = path.join(__dirname, "../src/lib/auth", name + ".ts");
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const exports = {};
    vm.runInNewContext(source, {
      exports,
      require: load,
      Date: Clock,
      Error,
      JSON,
      Promise,
    });
    modules.set(name, exports);
    return exports;
  }
  const manager = load("./session-manager");
  return {
    manager,
    storage,
    calls,
    advance: (ms) => {
      now += ms;
    },
    login: (method = "password") =>
      manager.setCognitoSession(tokens, undefined, undefined, method),
  };
}

test("activity extends the deadline; expiry uses a three-hour boundary", async () => {
  const h = setup();
  await h.login();
  h.advance(2 * HOUR);
  await h.manager.recordSessionActivity();
  h.advance(3 * HOUR - 1);
  assert.equal(h.manager.getSessionIdleRemaining(), 1);
  assert.ok(await h.manager.getValidCognitoSession());
  h.advance(1);
  assert.equal(await h.manager.getValidCognitoSession(), null);
  assert.equal(h.manager.getSessionExpiredSnapshot(), true);
  assert.equal(h.storage.credential, null);
});

test("background token refresh does not count as activity", async () => {
  const h = setup();
  await h.login();
  for (let i = 0; i < 2; i++) {
    h.advance(HOUR);
    await h.manager.getValidCognitoSession();
  }
  assert.equal(h.manager.getSessionIdleRemaining(), HOUR);
  h.advance(HOUR);
  await h.manager.getValidCognitoSession();
  assert.equal(h.calls.refresh, 2);
  assert.equal(h.storage.notice, "password");
});

test("reload preserves last activity and an expired notice survives another reload", async () => {
  const h = setup();
  await h.login();
  const restored = setup({ storage: h.storage });
  restored.advance(2 * HOUR);
  assert.ok(await restored.manager.getValidCognitoSession());
  assert.equal(restored.manager.getSessionIdleRemaining(), HOUR);
  restored.advance(HOUR);
  await restored.manager.getValidCognitoSession();
  const again = setup({ storage: h.storage });
  assert.equal(await again.manager.getValidCognitoSession(), null);
  assert.equal(again.manager.getSessionExpiredSnapshot(), true);
  assert.equal(again.calls.refresh, 0);
});

test("an expired stored session is never refreshed, including after background suspension", async () => {
  const h = setup();
  await h.login();
  const restored = setup({ storage: h.storage });
  restored.advance(4 * HOUR);
  assert.equal(await restored.manager.getValidCognitoSession(), null);
  assert.equal(restored.calls.refresh, 0);
  assert.equal(restored.calls.sync, 0);
  assert.deepEqual(restored.calls.revoke, ["refresh-test"]);
});

test("the first click after expiry cannot revive the session", async () => {
  const h = setup();
  await h.login();
  h.advance(3 * HOUR);
  await h.manager.recordSessionActivity();
  assert.equal(h.manager.getSessionSnapshot(), null);
  assert.equal(h.manager.getSessionExpiredSnapshot(), true);
});

test("OAuth idle expiry keeps the popup visible until Sign in performs hosted logout", async () => {
  const h = setup();
  await h.login("oauth");
  h.advance(3 * HOUR);
  await h.manager.expireInactiveSession();
  assert.equal(h.calls.logout, 0);
  assert.equal(h.storage.notice, "oauth");
  const reloaded = setup({ storage: h.storage });
  await reloaded.manager.getValidCognitoSession();
  await reloaded.manager.signOutCognitoSession();
  assert.equal(reloaded.calls.logout, 1);
  assert.equal(reloaded.storage.notice, null);
  assert.equal(reloaded.manager.getSessionExpiredSnapshot(), false);
});

test("manual logout does not show an inactivity popup", async () => {
  const h = setup();
  await h.login();
  await h.manager.signOutCognitoSession();
  assert.equal(h.manager.getSessionExpiredSnapshot(), false);
  assert.equal(h.storage.notice, null);
  assert.equal(h.storage.credential, null);
});

test("a late refresh cannot restore a logged-out session", async () => {
  const refresh = deferred();
  const h = setup({ refresh: () => refresh.promise });
  await h.login();
  h.advance(HOUR);
  const pending = h.manager.getValidCognitoSession();
  await new Promise(setImmediate);
  h.advance(2 * HOUR);
  await h.manager.expireInactiveSession();
  refresh.resolve({ accessToken: "late", idToken: "late-id", expiresIn: 3600 });
  assert.equal(await pending, null);
  assert.equal(h.manager.getSessionSnapshot(), null);
  assert.equal(h.storage.credential, null);
});

test("a transient network failure preserves credentials for retry", async () => {
  const h = setup({
    refresh: () => {
      throw new Error("Network unavailable");
    },
  });
  await h.login();
  const saved = h.storage.credential;
  h.advance(HOUR);
  await assert.rejects(
    h.manager.getValidCognitoSession(),
    /Network unavailable/,
  );
  assert.equal(h.storage.credential, saved);
  assert.ok(h.manager.getSessionSnapshot());
  assert.equal(h.manager.getSessionExpiredSnapshot(), false);
});

test("concurrent idle checks only revoke once", async () => {
  const gate = deferred();
  const h = setup({ revoke: () => gate.promise });
  await h.login();
  h.advance(3 * HOUR);
  const first = h.manager.expireInactiveSession();
  const second = h.manager.expireInactiveSession();
  assert.equal(first, second);
  gate.resolve();
  await first;
  assert.equal(h.calls.revoke.length, 1);
});

test("old credentials get one persisted baseline, not a new timeout on every reload", async () => {
  const h = setup({ storage: { credential: "legacy-refresh", notice: null } });
  await h.manager.getValidCognitoSession();
  assert.equal(JSON.parse(h.storage.credential).lastActivityAt, START);
  const next = setup({ storage: h.storage });
  next.advance(HOUR);
  await next.manager.getValidCognitoSession();
  assert.equal(next.manager.getSessionIdleRemaining(), 2 * HOUR);
});

test("rapid activity is coalesced and cannot rewrite credentials after logout", async () => {
  let blocked = false;
  const gate = deferred();
  const h = setup({ beforeWrite: () => (blocked ? gate.promise : undefined) });
  await h.login();
  blocked = true;
  h.advance(1000);
  const writes = [h.manager.recordSessionActivity()];
  await new Promise(setImmediate);
  for (let i = 0; i < 25; i++) {
    h.advance(10);
    writes.push(h.manager.recordSessionActivity());
  }
  const logout = h.manager.signOutCognitoSession();
  gate.resolve();
  await Promise.all([...writes, logout]);
  assert.equal(h.storage.credential, null);
  assert.ok(h.calls.writes <= 3);
});

test("rotated OAuth refresh tokens retain activity and survive later activity writes", async () => {
  const h = setup({ rotatedToken: "rotated-test" });
  await h.login("oauth");
  h.advance(HOUR);
  await h.manager.getValidCognitoSession();
  assert.equal(JSON.parse(h.storage.credential).lastActivityAt, START);
  h.advance(1000);
  await h.manager.recordSessionActivity();
  assert.equal(JSON.parse(h.storage.credential).refreshToken, "rotated-test");
});

test("failed revocation still removes local access and Sign in can retry cleanup", async () => {
  let fail = true;
  const h = setup({
    revoke: () => {
      if (fail) throw new Error("offline");
    },
  });
  await h.login();
  h.advance(3 * HOUR);
  await assert.rejects(h.manager.expireInactiveSession(), /offline/);
  assert.equal(h.manager.getSessionSnapshot(), null);
  assert.equal(h.storage.credential, null);
  assert.equal(h.manager.getSessionExpiredSnapshot(), true);
  fail = false;
  await h.manager.signOutCognitoSession();
  assert.equal(h.manager.getSessionExpiredSnapshot(), false);
});

test("cancelled native hosted logout preserves the expiry popup for retry", async () => {
  const h = setup({
    logout: () => {
      throw new Error("cancelled");
    },
  });
  await h.login("oauth");
  h.advance(3 * HOUR);
  await h.manager.expireInactiveSession();
  await assert.rejects(h.manager.signOutCognitoSession(), /cancelled/);
  assert.equal(h.storage.notice, "oauth");
  assert.equal(h.manager.getSessionExpiredSnapshot(), true);
});

function activityGuardHarness(platform = "web") {
  let cleanup;
  let remaining = 3 * HOUR;
  let timer;
  let activity = 0;
  let expired = 0;
  let appStateHandler;
  const events = new Map();
  const windowMock = {
    addEventListener: (name, handler) => events.set(name, handler),
    removeEventListener: (name) => events.delete(name),
  };
  const documentMock = { ...windowMock, visibilityState: "visible" };
  const mocks = {
    react: {
      useEffect: (effect) => {
        cleanup = effect();
      },
      useCallback: (callback) => callback,
    },
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      Fragment: "fragment",
    },
    "react-native": {
      Platform: { OS: platform },
      View: "view",
      AppState: {
        addEventListener: (_, handler) => {
          appStateHandler = handler;
          return {
            remove: () => {
              appStateHandler = null;
            },
          };
        },
      },
    },
    "./session-manager": {
      getSessionIdleRemaining: () => remaining,
      recordSessionActivity: async () => {
        activity++;
        remaining = 3 * HOUR;
      },
      expireInactiveSession: async () => {
        expired++;
      },
    },
  };
  const source = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../src/lib/auth/session-activity-guard.tsx"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (name) => mocks[name],
    window: windowMock,
    document: documentMock,
    setTimeout: (callback) => {
      timer = callback;
      return 1;
    },
    clearTimeout: () => {
      timer = null;
    },
  });
  const rendered = exports.SessionActivityGuard({
    enabled: true,
    onError: (error) => {
      throw error;
    },
    children: null,
  });
  return {
    emit: (name, event = {}) => events.get(name)?.(event),
    elapsed: () => {
      remaining = 0;
    },
    background: () => {
      documentMock.visibilityState = "hidden";
    },
    foreground: () => {
      documentMock.visibilityState = "visible";
    },
    state: (value) => appStateHandler?.(value),
    fireTimer: () => timer?.(),
    touch: () => rendered.props.onStartShouldSetResponderCapture(),
    counts: () => ({ activity, expired }),
    cleanup: () => cleanup(),
    events,
  };
}

test("web focus and synthetic events do not reset activity; background return checks expiry", async () => {
  const h = activityGuardHarness();
  h.emit("pageshow");
  h.emit("visibilitychange");
  h.emit("pointerdown", { isTrusted: false });
  assert.equal(h.counts().activity, 0);
  h.background();
  h.emit("keydown", { isTrusted: true });
  assert.equal(h.counts().activity, 0);
  h.foreground();
  h.emit("pointerdown", { isTrusted: true });
  await new Promise(setImmediate);
  assert.equal(h.counts().activity, 1);
  h.elapsed();
  h.emit("visibilitychange");
  assert.equal(h.counts().expired, 1);
  h.cleanup();
  assert.equal(h.events.size, 0);
});

test("native touches preserve responders and foreground return detects inactivity", async () => {
  const h = activityGuardHarness("ios");
  assert.equal(h.touch(), false);
  await new Promise(setImmediate);
  assert.equal(h.counts().activity, 1);
  h.state("background");
  h.elapsed();
  h.state("active");
  assert.equal(h.counts().expired, 1);
  h.cleanup();
});

test("the idle timer expires a session without another click or network request", () => {
  const h = activityGuardHarness();
  h.elapsed();
  h.fireTimer();
  assert.equal(h.counts().expired, 1);
  assert.equal(h.counts().activity, 0);
  h.cleanup();
});

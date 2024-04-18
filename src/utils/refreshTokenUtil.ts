export const refreshTokenUtil = (() => {
  const key = "refresh_token";
  let afterSetDoSomeThings: Function[] = [];
  let afterRemoveDoSomeThings: Function[] = [];
  return {
    get: () => {
      return localStorage.getItem(key);
    },
    set: (refreshToken: string) => {
      localStorage.setItem(key, refreshToken);
      const timeout = setTimeout(() => {
        afterSetDoSomeThings.forEach((doSomeThing) => doSomeThing());
        clearTimeout(timeout);
      });
    },
    remove: () => {
      localStorage.removeItem(key);
      const timeout = setTimeout(() => {
        afterRemoveDoSomeThings.forEach((doSomeThing) => doSomeThing());
        clearTimeout(timeout);
      });
    },
    afterSet: (doSomeThing: Function) => {
      afterSetDoSomeThings.push(doSomeThing);
      return () => {
        afterSetDoSomeThings = afterSetDoSomeThings.filter(
          (doSomeThing) => doSomeThing !== doSomeThing,
        );
      };
    },
    afterRemove: (doSomeThing: Function) => {
      afterRemoveDoSomeThings.push(doSomeThing);
      return () => {
        afterRemoveDoSomeThings = afterRemoveDoSomeThings.filter(
          (doSomeThing) => doSomeThing !== doSomeThing,
        );
      };
    },
  };
})();

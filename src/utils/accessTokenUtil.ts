export const accessTokenUtil = (() => {
  const key = "access_token";
  let afterSetDoSomeThings: Function[] = [];
  let afterRemoveDoSomeThings: Function[] = [];

  return {
    get: () => {
      return localStorage.getItem(key);
    },
    set: (accessToken: string) => {
      localStorage.setItem(key, accessToken);
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

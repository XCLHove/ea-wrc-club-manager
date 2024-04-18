export const setCookie = ({
  name,
  value,
  expireHours,
  path,
}: {
  name: string;
  value: string;
  expireHours?: number;
  path?: string;
}) => {
  let cookie = `${name}=${value};`;

  if (expireHours) {
    const date = new Date();
    date.setTime(date.getTime() + expireHours * 60 * 60 * 1000);
    cookie += `expires=${date.toUTCString()};`;
  }
  if (path) {
    cookie += `path=${path};`;
  }

  document.cookie = cookie;
};

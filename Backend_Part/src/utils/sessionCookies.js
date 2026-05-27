const USER_AUTH_COOKIE = "sql_studio_token";
const ADMIN_AUTH_COOKIE = "sql_studio_admin_token";

const isProduction = () => process.env.NODE_ENV === "production";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "none" : "lax",
  path: "/"
});

const setUserAuthCookie = (res, token) => {
  res.cookie(USER_AUTH_COOKIE, token, {
    ...getCookieOptions(),
    maxAge: 24 * 60 * 60 * 1000
  });
};

const setAdminAuthCookie = (res, token) => {
  res.cookie(ADMIN_AUTH_COOKIE, token, {
    ...getCookieOptions(),
    maxAge: 12 * 60 * 60 * 1000
  });
};

const clearUserAuthCookie = (res) => {
  res.clearCookie(USER_AUTH_COOKIE, getCookieOptions());
};

const clearAdminAuthCookie = (res) => {
  res.clearCookie(ADMIN_AUTH_COOKIE, getCookieOptions());
};

const getCookieValue = (req, name) => {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return "";
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
};

module.exports = {
  USER_AUTH_COOKIE,
  ADMIN_AUTH_COOKIE,
  setUserAuthCookie,
  setAdminAuthCookie,
  clearUserAuthCookie,
  clearAdminAuthCookie,
  getCookieValue
};

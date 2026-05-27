const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

const validatePassword = (password) => {
  const value = String(password || "");

  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[@$!%*?&]/.test(value)
  );
};

module.exports = {
  PASSWORD_POLICY_MESSAGE,
  validatePassword
};

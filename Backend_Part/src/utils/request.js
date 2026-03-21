const getRequestMeta = (req) => {
  return {
    ipAddress: req.ip || "",
    userAgent: req.get("user-agent") || ""
  };
};

module.exports = {
  getRequestMeta
};

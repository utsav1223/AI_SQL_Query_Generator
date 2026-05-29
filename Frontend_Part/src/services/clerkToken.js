let clerkTokenGetter = null;

export const setClerkTokenGetter = (getter) => {
  clerkTokenGetter = typeof getter === "function" ? getter : null;
};

export const getClerkToken = async () => {
  if (!clerkTokenGetter) {
    return null;
  }

  return clerkTokenGetter();
};

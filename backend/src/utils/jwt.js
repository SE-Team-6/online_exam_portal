import jwt from "jsonwebtoken";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be set in the environment");
  return secret;
}

export function signToken(user, { expiresIn } = {}) {
  const id = String(user?._id ?? user?.id ?? "").trim();
  const role = user?.role;
  if (!id || typeof role !== "string" || !role.trim()) {
    throw new TypeError("A user id and role are required to sign a token");
  }

  return jwt.sign(
    { id, role },
    getSecret(),
    {
      algorithm: "HS256",
      subject: id,
      expiresIn: expiresIn ?? process.env.JWT_EXPIRES_IN ?? "1h",
    },
  );
}

export function verifyToken(token) {
  const payload = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.id !== "string" ||
    typeof payload.role !== "string" ||
    !payload.id.trim() ||
    !payload.role.trim()
  ) {
    throw new Error("Invalid token claims");
  }
  return payload;
}

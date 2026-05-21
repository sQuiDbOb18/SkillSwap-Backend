import crypto from "crypto";

const hashValue = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const generateEmailCode = () => {
  const rawCode = crypto.randomInt(100000, 1000000).toString();
  const hashedCode = hashValue(rawCode);

  return { rawCode, hashedCode };
};

export const generateVerificationCode = () => {
  const rawCode = crypto.randomInt(1000, 10000).toString();
  const hashedCode = hashValue(rawCode);

  return { rawCode, hashedCode };
};

export const hashCode = (code: string) => hashValue(code.trim());

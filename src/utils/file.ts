import { randomUUID } from "crypto";

export function generateRandomFileName(extension = "csv") {
  return `${randomUUID()}.${extension}`;
}

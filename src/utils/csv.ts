import { createObjectCsvStringifier } from "csv-writer";

export function generateCsv(data: Array<any>) {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: "originalUrl", title: "URL Original" },
      { id: "shortUrl", title: "URL Encurtada" },
      { id: "accessCount", title: "Acessos" },
      { id: "createdAt", title: "Data de Criação" },
    ],
  });
  return (
    csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data)
  );
}

interface DepositData {
  doi: string;
  title: string;
  abstract: string;
  authorName: string;
  authorAffiliation: string;
  coAuthors: { name: string; affiliation: string }[];
  publishedDate: string;
  journalName: string;
}

export function buildCrossrefXml(data: DepositData): string {
  const date = new Date(data.publishedDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const contributors = [
    `<person_name sequence="first" contributor_role="author">
      <given_name>${escapeXml(data.authorName.split(" ").slice(0, -1).join(" ") || data.authorName)}</given_name>
      <surname>${escapeXml(data.authorName.split(" ").pop() || data.authorName)}</surname>
      ${data.authorAffiliation ? `<affiliation>${escapeXml(data.authorAffiliation)}</affiliation>` : ""}
    </person_name>`,
    ...data.coAuthors.map(
      (ca) =>
        `<person_name sequence="additional" contributor_role="author">
          <given_name>${escapeXml(ca.name.split(" ").slice(0, -1).join(" ") || ca.name)}</given_name>
          <surname>${escapeXml(ca.name.split(" ").pop() || ca.name)}</surname>
          ${ca.affiliation ? `<affiliation>${escapeXml(ca.affiliation)}</affiliation>` : ""}
        </person_name>`
    ),
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/5.3.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  version="5.3.1"
  xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 https://www.crossref.org/schemas/crossref5.3.1.xsd">
  <head>
    <doi_batch_id>${data.doi.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}</doi_batch_id>
    <timestamp>${Date.now()}</timestamp>
    <depositor>
      <depositor_name>${escapeXml(data.journalName)}</depositor_name>
      <email_address>admin@journal.example</email_address>
    </depositor>
    <registrant>${escapeXml(data.journalName)}</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata>
        <full_title>${escapeXml(data.journalName)}</full_title>
      </journal_metadata>
      <journal_article publication_type="full_text">
        <titles>
          <title>${escapeXml(data.title)}</title>
        </titles>
        <contributors>
          ${contributors}
        </contributors>
        <publication_date media_type="online">
          <month>${month}</month>
          <day>${day}</day>
          <year>${year}</year>
        </publication_date>
        <doi_data>
          <doi>${escapeXml(data.doi)}</doi>
          <resource>https://journal.example/archive/${data.doi}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

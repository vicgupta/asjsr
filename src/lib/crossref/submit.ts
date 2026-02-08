import { buildCrossrefXml } from "./deposit";

interface SubmitParams {
  doi: string;
  title: string;
  abstract: string;
  authorName: string;
  authorAffiliation: string;
  coAuthors: { name: string; affiliation: string }[];
  publishedDate: string;
  journalName: string;
  crossrefUsername: string;
  crossrefPassword: string;
}

export async function submitToCrossref(
  params: SubmitParams
): Promise<{ success: boolean; error?: string }> {
  const xml = buildCrossrefXml(params);

  try {
    const formData = new FormData();
    formData.append("operation", "doMDUpload");
    formData.append("login_id", params.crossrefUsername);
    formData.append("login_passwd", params.crossrefPassword);
    formData.append(
      "fname",
      new Blob([xml], { type: "application/xml" }),
      "deposit.xml"
    );

    const response = await fetch(
      "https://doi.crossref.org/servlet/deposit",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Crossref responded with ${response.status}: ${await response.text()}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromFile(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  try {
    // =========================
    // PDF
    // =========================
    if (fileType === "application/pdf") {
      console.log(" Processing PDF...");

      const parser = new PDFParse({
        data: new Uint8Array(buffer),
      });

      try {
        const result = await parser.getText();

        const text = result.text?.trim() || "";

        console.log(
          ` PDF extracted successfully: ${text.length} characters`
        );

        if (!text) {
          throw new Error(
            "PDF was uploaded successfully, but no text could be extracted. The PDF may be scanned/image-based."
          );
        }

        return text;
      } finally {
        await parser.destroy();
      }
    }

    // =========================
    // DOCX
    // =========================
    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      console.log(" Processing DOCX...");

      const result = await mammoth.extractRawText({
        buffer,
      });

      const text = result.value?.trim() || "";

      console.log(
        ` DOCX extracted successfully: ${text.length} characters`
      );

      return text;
    }

    // =========================
    // TXT
    // =========================
    if (fileType === "text/plain") {
      console.log(" Processing TXT...");

      return buffer.toString("utf-8").trim();
    }

    // =========================
    // CSV
    // =========================
    if (fileType === "text/csv") {
      console.log(" Processing CSV...");

      return buffer.toString("utf-8").trim();
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error) {
    console.error(" File extraction error:", error);

    throw new Error(
      `Failed to extract text from ${fileType} file. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
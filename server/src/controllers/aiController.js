import {
  AIClassificationError,
  classifyLegalSituation,
} from "../services/aiClassificationService.js";
import { inspectAIInput } from "../services/aiInputGuardService.js";

export const classifySituation = async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const inspection = inspectAIInput(req.body?.description);

    if (!inspection.ok) {
      return res.status(inspection.statusCode).json({
        message: inspection.message,
      });
    }

    const analysis = await classifyLegalSituation(inspection.description);

    return res.json({
      analysis,
      notice:
        "Advanced Search only suggests search categories. It does not provide legal advice.",
    });
  } catch (error) {
    if (error instanceof AIClassificationError) {
      console.error(
        "AI classification error:",
        error.statusCode,
        error.message
      );

      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("AI classification error: unexpected server error");

    return res.status(500).json({
      message: "Failed to analyze the legal situation.",
    });
  }
};

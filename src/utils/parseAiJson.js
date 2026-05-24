export const parseAiJsonArray = (responseText, label) => {
  const trimmed = responseText.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const arrayMatch = withoutFence.match(/\[[\s\S]*\]/);
  const jsonText = arrayMatch ? arrayMatch[0] : withoutFence;

  try {
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      throw new Error(`${label} response was not an array`);
    }

    return parsed;
  } catch (error) {
    console.error(`${label} JSON parse error:`, error);
    console.error(`${label} raw AI response:`, responseText);
    throw new Error(`${label} generation returned invalid JSON`);
  }
};

export const parseAiJsonObject = (responseText, label) => {
  const trimmed = responseText.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const objectMatch = withoutFence.match(/\{[\s\S]*\}/);
  const jsonText = objectMatch ? objectMatch[0] : withoutFence;

  try {
    const parsed = JSON.parse(jsonText);

    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error(`${label} response was not an object`);
    }

    return parsed;
  } catch (error) {
    console.error(`${label} JSON parse error:`, error);
    console.error(`${label} raw AI response:`, responseText);
    throw new Error(`${label} generation returned invalid JSON`);
  }
};

import test from "node:test";
import assert from "node:assert/strict";

import {
  fallbackAnswer,
  fallbackFlashcards,
  fallbackProfile,
  fallbackQuiz,
  fallbackSummary,
} from "../src/services/ai/fallbackStudyService.js";
import { parseAiJsonArray, parseAiJsonObject } from "../src/utils/parseAiJson.js";

const sampleText = [
  "Photosynthesis converts light energy into chemical energy inside plant chloroplasts.",
  "Chlorophyll absorbs sunlight while carbon dioxide and water are used to produce glucose.",
  "Oxygen is released as a byproduct of the photosynthesis process.",
  "The light-dependent reactions generate energy carriers used by the Calvin cycle.",
].join(" ");

test("AI JSON parsers accept fenced model output", () => {
  assert.deepEqual(parseAiJsonArray("```json\n[{\"question\":\"Q\"}]\n```", "Quiz"), [{ question: "Q" }]);
  assert.deepEqual(parseAiJsonObject("```json\n{\"subject\":\"Biology\"}\n```", "Profile"), { subject: "Biology" });
});

test("fallback study services always return usable content", () => {
  assert.match(fallbackSummary(sampleText), /Photosynthesis/);
  assert.ok(fallbackFlashcards(sampleText).length > 0);

  const quiz = fallbackQuiz(sampleText);
  assert.ok(quiz.length > 0);
  assert.ok(quiz.every((item) => item.options.includes(item.correctAnswer)));

  const profile = fallbackProfile(sampleText, "biology.pdf");
  assert.equal(profile.detectedTitle, "biology.pdf");
  assert.ok(profile.keyTopics.length > 0);
});

test("fallback chat answer selects relevant PDF sentences", () => {
  assert.match(fallbackAnswer(sampleText, "What does chlorophyll absorb?"), /Chlorophyll absorbs sunlight/);
});

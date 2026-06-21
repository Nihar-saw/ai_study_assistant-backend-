import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonObject } from "../../utils/parseAiJson.js";

export const generateStudyPlan = async (examDate, subjects, dailyStudyHours) => {
  try {
    const model = getGeminiModel();

    const subjectList = subjects.join(", ");
    const daysRemaining = Math.max(
      1,
      Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))
    );

    const prompt = `
    You are an AI Study Planner. Create a optimized daily, weekly, and revision study plan.
    
    Inputs:
    - Target Exam Date: ${new Date(examDate).toDateString()} (in ${daysRemaining} days)
    - Subjects: ${subjectList}
    - Daily Study Hours: ${dailyStudyHours} hours per day
    
    Return ONLY valid JSON with this exact structure:
    {
      "dailyPlan": [
        {
          "day": 1,
          "subject": "Name of Subject",
          "topic": "Specific Topic to Study",
          "task": "Specific task, e.g. Read SQL normal forms, complete a practice quiz"
        }
      ],
      "weeklyPlan": [
        {
          "week": 1,
          "focus": "High level weekly objective, e.g. Finish core fundamentals of DBMS and begin OS scheduling"
        }
      ],
      "revisionSchedule": [
        {
          "day": 5, // Day index when this revision should occur
          "subject": "Name of Subject",
          "topic": "Topic to revise",
          "type": "Revision method, e.g. Review Flashcards or Re-take practice quiz"
        }
      ]
    }

    Generate a plan covering the next 7 to 10 days of study leading up to the exam.
    Avoid generating plan entries beyond the days remaining.
    `;

    console.log("[Planner] Requesting study plan calendar...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonObject(responseText, "Study Plan");
  } catch (error) {
    console.error("Study plan generation error, using fallback:", error);
    // Create a simple fallback study plan
    const dailyPlan = subjects.flatMap((sub, i) => [
      { day: i * 2 + 1, subject: sub, topic: `${sub} Introduction`, task: "Read foundations and set up revision notes" },
      { day: i * 2 + 2, subject: sub, topic: `${sub} Intermediate Concepts`, task: "Review practice questions and flashcards" }
    ]);
    const weeklyPlan = [
      { week: 1, focus: `Complete baseline studies for ${subjects.join(" and ")}` }
    ];
    const revisionSchedule = subjects.map((sub, i) => ({
      day: i * 2 + 2,
      subject: sub,
      topic: `${sub} Foundations`,
      type: "Re-take practice quiz"
    }));

    return { dailyPlan, weeklyPlan, revisionSchedule };
  }
};

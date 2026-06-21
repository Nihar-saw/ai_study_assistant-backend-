import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

// List of all achievements in system
export const SYSTEM_ACHIEVEMENTS = [
  { id: "first_pdf", title: "Document Explorer", description: "Uploaded your first study material PDF" },
  { id: "first_quiz", title: "First Quiz", description: "Completed your first conceptual practice quiz" },
  { id: "quiz_master", title: "Quiz Master", description: "Scored 100% on a practice quiz" },
  { id: "level_5", title: "Scholar", description: "Reached Level 5 in study experience" },
  { id: "level_10", title: "Guru", description: "Reached Level 10 in study experience" },
  { id: "streak_3", title: "Persistent Learner", description: "Maintained a 3-day study streak" },
  { id: "streak_7", title: "Dedicated Scholar", description: "Maintained a 7-day study streak" },
  { id: "mock_interview", title: "Ready for Work", description: "Completed a mock interviewer session" },
];

export const awardXP = async (userId, amount, actionType, extraDetails = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // 1. Log Activity
    await ActivityLog.create({
      userId,
      actionType,
      pdfId: extraDetails.pdfId || null,
      score: extraDetails.score !== undefined ? extraDetails.score : null,
      maxScore: extraDetails.maxScore !== undefined ? extraDetails.maxScore : null,
      studyDuration: extraDetails.studyDuration || null,
      topics: extraDetails.topics || [],
    });

    const oldXP = user.xp;
    const oldLevel = user.level;

    // Add XP
    user.xp = (user.xp || 0) + amount;
    
    // Level calculation: 100 XP per level
    user.level = Math.floor(user.xp / 100) + 1;

    // 2. Streak tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak = (user.streak || 0) + 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
      // If diffDays is 0 (same day), streak remains unchanged
    } else {
      user.streak = 1;
    }
    user.lastActiveDate = new Date();

    // 3. Evaluate Achievements
    const newAchievements = [];
    const unlockedIds = new Set(user.achievements.map((a) => a.id));

    // Helper to award achievement
    const triggerAchievement = (id) => {
      if (!unlockedIds.has(id)) {
        const ach = SYSTEM_ACHIEVEMENTS.find((a) => a.id === id);
        if (ach) {
          user.achievements.push({
            id: ach.id,
            title: ach.title,
            description: ach.description,
            unlockedAt: new Date(),
          });
          newAchievements.push(ach);
          
          // Add to badges list if not present
          if (!user.badges.includes(ach.title)) {
            user.badges.push(ach.title);
          }
        }
      }
    };

    // First PDF upload
    if (actionType === "pdf_uploaded") {
      triggerAchievement("first_pdf");
    }

    // First quiz & Quiz Master
    if (actionType === "quiz_completed") {
      triggerAchievement("first_quiz");
      if (extraDetails.score === extraDetails.maxScore && extraDetails.maxScore > 0) {
        triggerAchievement("quiz_master");
      }
    }

    // Mock Interview
    if (actionType === "interview_completed") {
      triggerAchievement("mock_interview");
    }

    // Levels
    if (user.level >= 5) triggerAchievement("level_5");
    if (user.level >= 10) triggerAchievement("level_10");

    // Streaks
    if (user.streak >= 3) triggerAchievement("streak_3");
    if (user.streak >= 7) triggerAchievement("streak_7");

    await user.save();

    return {
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      levelUp: user.level > oldLevel,
      newAchievements,
    };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return null;
  }
};

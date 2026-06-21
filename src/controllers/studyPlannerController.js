import StudyPlan from "../models/StudyPlan.js";
import { generateStudyPlan } from "../services/ai/plannerService.js";
import { awardXP } from "../services/gamificationService.js";

export const getStudyPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await StudyPlan.findOne({ userId });
    res.json(plan || null);
  } catch (error) {
    console.error("Get StudyPlan Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createStudyPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { examDate, subjects, dailyStudyHours } = req.body;

    if (!examDate || !subjects || !dailyStudyHours) {
      return res.status(400).json({ message: "Exam date, subjects, and study hours are required" });
    }

    console.log(`[Planner] Generating plan for user: ${userId}, examDate: ${examDate}`);
    const planData = await generateStudyPlan(examDate, subjects, dailyStudyHours);

    // Delete existing plan if any
    await StudyPlan.findOneAndDelete({ userId });

    const newPlan = await StudyPlan.create({
      userId,
      examDate: new Date(examDate),
      subjects,
      dailyStudyHours,
      planData,
      completedTasks: [],
    });

    // Award 50 XP for planning
    const gamification = await awardXP(userId, 50, "study_plan_created");

    res.status(201).json({ plan: newPlan, gamification });
  } catch (error) {
    console.error("Create StudyPlan Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleTaskComplete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskKey } = req.body;

    const plan = await StudyPlan.findOne({ userId });
    if (!plan) {
      return res.status(404).json({ message: "Study plan not found" });
    }

    const taskIndex = plan.completedTasks.indexOf(taskKey);
    let isCompleted = false;

    if (taskIndex > -1) {
      plan.completedTasks.splice(taskIndex, 1);
    } else {
      plan.completedTasks.push(taskKey);
      isCompleted = true;
    }

    await plan.save();

    let gamification = null;
    if (isCompleted) {
      // Award 20 XP for finishing a scheduled study task
      gamification = await awardXP(userId, 20, "study_task_completed");
    }

    res.json({ plan, gamification });
  } catch (error) {
    console.error("Toggle Task Complete Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

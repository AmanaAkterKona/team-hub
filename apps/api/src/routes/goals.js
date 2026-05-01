const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/goals/workspace/{workspaceId}:
 *   get:
 *     summary: Get all goals for a workspace
 *     tags: [Goals]
 */
router.get("/workspace/:workspaceId", authenticate, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
        _count: { select: { actionItems: true, updates: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, description, workspaceId, dueDate, status } = req.body;
    if (!title || !workspaceId) return res.status(400).json({ error: "Title and workspaceId required." });

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        workspaceId,
        ownerId: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "NOT_STARTED",
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: "CREATE",
        entity: "Goal",
        entityId: goal.id,
        metadata: { title },
      },
    });

    res.status(201).json({ goal });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   get:
 *     summary: Get a goal by ID
 *     tags: [Goals]
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
        updates: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
        actionItems: {
          include: { assignee: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });
    if (!goal) return res.status(404).json({ error: "Goal not found." });
    res.json({ goal });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   patch:
 *     summary: Update a goal
 *     tags: [Goals]
 */
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        milestones: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: goal.workspaceId,
        userId: req.user.id,
        action: "UPDATE",
        entity: "Goal",
        entityId: goal.id,
        metadata: { title, status },
      },
    });

    res.json({ goal });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     tags: [Goals]
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: "Goal not found." });

    await prisma.goal.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        workspaceId: goal.workspaceId,
        userId: req.user.id,
        action: "DELETE",
        entity: "Goal",
        entityId: req.params.id,
        metadata: { title: goal.title },
      },
    });

    res.json({ message: "Goal deleted." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// --- Milestones ---

/**
 * @swagger
 * /api/goals/{id}/milestones:
 *   post:
 *     summary: Add a milestone to a goal
 *     tags: [Goals]
 */
router.post("/:id/milestones", authenticate, async (req, res) => {
  try {
    const { title, progress } = req.body;
    const milestone = await prisma.milestone.create({
      data: { goalId: req.params.id, title, progress: progress || 0 },
    });
    res.status(201).json({ milestone });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/goals/{id}/milestones/{milestoneId}:
 *   patch:
 *     summary: Update a milestone
 *     tags: [Goals]
 */
router.patch("/:id/milestones/:milestoneId", authenticate, async (req, res) => {
  try {
    const { title, progress } = req.body;
    const milestone = await prisma.milestone.update({
      where: { id: req.params.milestoneId },
      data: { title, progress },
    });
    res.json({ milestone });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// --- Goal Updates (Activity Feed) ---

/**
 * @swagger
 * /api/goals/{id}/updates:
 *   post:
 *     summary: Post a progress update on a goal
 *     tags: [Goals]
 */
router.post("/:id/updates", authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const update = await prisma.goalUpdate.create({
      data: { goalId: req.params.id, authorId: req.user.id, content },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json({ update });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
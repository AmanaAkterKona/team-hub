const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/action-items/workspace/{workspaceId}:
 *   get:
 *     summary: Get all action items for a workspace
 *     tags: [ActionItems]
 */
router.get("/workspace/:workspaceId", authenticate, async (req, res) => {
  try {
    const { goalId, assigneeId, priority, status } = req.query;
    const where = { workspaceId: req.params.workspaceId };
    if (goalId) where.goalId = goalId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const items = await prisma.actionItem.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        goal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/action-items:
 *   post:
 *     summary: Create a new action item
 *     tags: [ActionItems]
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, workspaceId, assigneeId, priority, dueDate, goalId, status } = req.body;
    if (!title || !workspaceId) return res.status(400).json({ error: "Title and workspaceId required." });

    const item = await prisma.actionItem.create({
      data: {
        title,
        workspaceId,
        assigneeId: assigneeId || null,
        priority: priority || "MEDIUM",
        status: status || "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        goalId: goalId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: "CREATE",
        entity: "ActionItem",
        entityId: item.id,
        metadata: { title, priority },
      },
    });

    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/action-items/{id}:
 *   patch:
 *     summary: Update an action item (Optimistic UI supported)
 *     tags: [ActionItems]
 */
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { title, assigneeId, priority, status, dueDate, goalId } = req.body;

    const item = await prisma.actionItem.update({
      where: { id: req.params.id },
      data: {
        title,
        assigneeId,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        goalId,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: item.workspaceId,
        userId: req.user.id,
        action: "UPDATE",
        entity: "ActionItem",
        entityId: item.id,
        metadata: { status, priority },
      },
    });

    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/action-items/{id}:
 *   delete:
 *     summary: Delete an action item
 *     tags: [ActionItems]
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const item = await prisma.actionItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: "Not found." });

    await prisma.actionItem.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        workspaceId: item.workspaceId,
        userId: req.user.id,
        action: "DELETE",
        entity: "ActionItem",
        entityId: req.params.id,
        metadata: { title: item.title },
      },
    });

    res.json({ message: "Action item deleted." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/action-items/export/{workspaceId}:
 *   get:
 *     summary: Export workspace action items as CSV
 *     tags: [ActionItems]
 */
router.get("/export/:workspaceId", authenticate, async (req, res) => {
  try {
    const items = await prisma.actionItem.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        assignee: { select: { name: true, email: true } },
        goal: { select: { title: true } },
      },
    });

    const csv = [
      "Title,Status,Priority,Assignee,Goal,Due Date,Created At",
      ...items.map((i) =>
        [
          `"${i.title}"`,
          i.status,
          i.priority,
          i.assignee ? i.assignee.name : "Unassigned",
          i.goal ? i.goal.title : "None",
          i.dueDate ? i.dueDate.toISOString().split("T")[0] : "None",
          i.createdAt.toISOString().split("T")[0],
        ].join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=workspace-${req.params.workspaceId}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/action-items/notifications/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     tags: [ActionItems]
 */
router.get("/notifications/:userId", authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/action-items/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [ActionItems]
 */
router.patch("/notifications/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
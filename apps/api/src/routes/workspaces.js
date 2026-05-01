const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: Get all workspaces for current user
 *     tags: [Workspaces]
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { goals: true, actionItems: true } },
      },
    });
    res.json({ workspaces });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, description, accentColor } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        accentColor: accentColor || "#6366f1",
        members: { create: { userId: req.user.id, role: "ADMIN" } },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: req.user.id,
        action: "CREATE",
        entity: "Workspace",
        entityId: workspace.id,
        metadata: { name },
      },
    });

    res.status(201).json({ workspace });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   get:
 *     summary: Get a workspace by ID
 *     tags: [Workspaces]
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: req.params.id,
        members: { some: { userId: req.user.id } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { goals: true, actionItems: true, announcements: true } },
      },
    });

    if (!workspace) return res.status(404).json({ error: "Workspace not found." });
    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}:
 *   patch:
 *     summary: Update a workspace
 *     tags: [Workspaces]
 */
router.patch("/:id", authenticate, checkPermission("ADMIN"), async (req, res) => {
  try {
    const { name, description, accentColor } = req.body;
    const workspace = await prisma.workspace.update({
      where: { id: req.params.id },
      data: { name, description, accentColor },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: req.user.id,
        action: "UPDATE",
        entity: "Workspace",
        entityId: workspace.id,
        metadata: { name, description, accentColor },
      },
    });

    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}/invite:
 *   post:
 *     summary: Invite a member to workspace
 *     tags: [Workspaces]
 */
router.post("/:id/invite", authenticate, checkPermission("ADMIN"), async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspaceId = req.params.id;

    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) return res.status(404).json({ error: "User not found." });

    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: invitedUser.id, workspaceId } },
    });
    if (existing) return res.status(400).json({ error: "User is already a member." });

    const member = await prisma.workspaceMember.create({
      data: { userId: invitedUser.id, workspaceId, role: role || "MEMBER" },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: "INVITE",
        entity: "WorkspaceMember",
        entityId: member.id,
        metadata: { email, role },
      },
    });

    res.status(201).json({ member });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from workspace
 *     tags: [Workspaces]
 */
router.delete("/:id/members/:memberId", authenticate, checkPermission("ADMIN"), async (req, res) => {
  try {
    await prisma.workspaceMember.delete({ where: { id: req.params.memberId } });

    await prisma.auditLog.create({
      data: {
        workspaceId: req.params.id,
        userId: req.user.id,
        action: "REMOVE",
        entity: "WorkspaceMember",
        entityId: req.params.memberId,
        metadata: {},
      },
    });

    res.json({ message: "Member removed." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}/analytics:
 *   get:
 *     summary: Get workspace analytics
 *     tags: [Workspaces]
 */
router.get("/:id/analytics", authenticate, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [totalGoals, completedThisWeek, overdueItems, totalMembers] = await Promise.all([
      prisma.goal.count({ where: { workspaceId } }),
      prisma.actionItem.count({
        where: { workspaceId, status: "DONE", updatedAt: { gte: weekAgo } },
      }),
      prisma.actionItem.count({
        where: { workspaceId, status: { not: "DONE" }, dueDate: { lt: now } },
      }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
    ]);

    const goalsByStatus = await prisma.goal.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: true,
    });

    res.json({ totalGoals, completedThisWeek, overdueItems, totalMembers, goalsByStatus });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/workspaces/{id}/audit:
 *   get:
 *     summary: Get workspace audit log
 *     tags: [Workspaces]
 */
router.get("/:id/audit", authenticate, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { workspaceId: req.params.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
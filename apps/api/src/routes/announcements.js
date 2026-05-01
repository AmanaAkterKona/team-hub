const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");
const nodemailer = require("nodemailer");

const router = express.Router();
const prisma = new PrismaClient();

const sendMentionEmail = async (email, mentionedBy, content) => {
  if (!process.env.NODEMAILER_EMAIL) return;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.NODEMAILER_EMAIL, pass: process.env.NODEMAILER_PASS },
  });
  await transporter.sendMail({
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: `You were mentioned by ${mentionedBy}`,
    text: content,
  });
};

/**
 * @swagger
 * /api/announcements/workspace/{workspaceId}:
 *   get:
 *     summary: Get all announcements for a workspace
 *     tags: [Announcements]
 */
router.get("/workspace/:workspaceId", authenticate, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        comments: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Create an announcement (Admin only)
 *     tags: [Announcements]
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { content, workspaceId } = req.body;
    if (!content || !workspaceId) return res.status(400).json({ error: "Content and workspaceId required." });

    // Check if user is admin
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.id, workspaceId } },
    });
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can post announcements." });
    }

    const announcement = await prisma.announcement.create({
      data: { content, workspaceId, authorId: req.user.id },
      include: { comments: true },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: "CREATE",
        entity: "Announcement",
        entityId: announcement.id,
        metadata: {},
      },
    });

    res.status(201).json({ announcement });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/announcements/{id}/pin:
 *   patch:
 *     summary: Pin or unpin an announcement
 *     tags: [Announcements]
 */
router.patch("/:id/pin", authenticate, async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!announcement) return res.status(404).json({ error: "Not found." });

    const updated = await prisma.announcement.update({
      where: { id: req.params.id },
      data: { isPinned: !announcement.isPinned },
    });
    res.json({ announcement: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/announcements/{id}/react:
 *   post:
 *     summary: React to an announcement
 *     tags: [Announcements]
 */
router.post("/:id/react", authenticate, async (req, res) => {
  try {
    const { emoji } = req.body;
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!announcement) return res.status(404).json({ error: "Not found." });

    const reactions = announcement.reactions || {};
    if (!reactions[emoji]) reactions[emoji] = [];

    const userIndex = reactions[emoji].indexOf(req.user.id);
    if (userIndex > -1) {
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(req.user.id);
    }

    const updated = await prisma.announcement.update({
      where: { id: req.params.id },
      data: { reactions },
    });
    res.json({ announcement: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/announcements/{id}/comments:
 *   post:
 *     summary: Add a comment to an announcement
 *     tags: [Announcements]
 */
router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await prisma.comment.create({
      data: { announcementId: req.params.id, authorId: req.user.id, content },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    // Handle @mentions
    const mentions = content.match(/@(\w+)/g) || [];
    for (const mention of mentions) {
      const username = mention.slice(1);
      const mentionedUser = await prisma.user.findFirst({ where: { name: { contains: username } } });
      if (mentionedUser) {
        await prisma.notification.create({
          data: {
            userId: mentionedUser.id,
            type: "MENTION",
            message: `You were mentioned in a comment by ${req.user.name || "someone"}`,
          },
        });
        await sendMentionEmail(mentionedUser.email, req.user.name || "someone", content).catch(() => {});
      }
    }

    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
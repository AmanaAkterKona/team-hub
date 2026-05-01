const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Permission matrix
const PERMISSIONS = {
  ADMIN: [
    "create:goal",
    "delete:goal",
    "create:announcement",
    "delete:announcement",
    "invite:member",
    "remove:member",
    "export:data",
    "update:workspace",
  ],
  MEMBER: [
    "create:actionItem",
    "update:actionItem",
    "post:comment",
    "react:announcement",
    "create:goalUpdate",
  ],
};

// Check if user has specific permission
const checkPermission = (requiredRole) => async (req, res, next) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId || req.body.workspaceId;
    if (!workspaceId) return res.status(400).json({ error: "Workspace ID required." });

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.id, workspaceId } },
    });

    if (!member) return res.status(403).json({ error: "Not a member of this workspace." });

    // ADMIN can do everything MEMBER can
    if (requiredRole === "ADMIN" && member.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required." });
    }

    req.memberRole = member.role;
    req.memberId = member.id;
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
};

// Check specific action permission
const can = (action) => async (req, res, next) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId || req.body.workspaceId;
    if (!workspaceId) return res.status(400).json({ error: "Workspace ID required." });

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.id, workspaceId } },
    });

    if (!member) return res.status(403).json({ error: "Not a member of this workspace." });

    const allowedActions = PERMISSIONS[member.role] || [];
    if (!allowedActions.includes(action) && member.role !== "ADMIN") {
      return res.status(403).json({ error: `Permission denied: ${action}` });
    }

    req.memberRole = member.role;
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { checkPermission, can, PERMISSIONS };
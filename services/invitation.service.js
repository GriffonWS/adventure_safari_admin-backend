import Invitation from "../models/Invitation.js";
import User from "../models/User.js";

export const RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const recentlySentError = (invitation) => {
  const lastResend = [...(invitation.resends || [])].reverse().find((r) => r.emailSent !== false);
  const error = new Error("This invitation was sent recently");
  error.code = "RECENTLY_SENT";
  error.details = {
    email: invitation.email,
    lastSentAt: invitation.lastSentAt || invitation.createdAt,
    lastSentBy: lastResend?.sentBy?.email || null,
    resendCount: (invitation.resends || []).filter((r) => r.emailSent !== false).length,
  };
  return error;
};

class InvitationService {
  // Create invitation for a single email
  async createInvitation(email, tripId, tripName, invitedBy) {
    // Check if user is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // No invitation needed — the caller assigns them to the trip directly.
      return { alreadyRegistered: true, email: existingUser.email, userId: existingUser._id };
    }

    // Check if invitation already exists and is still pending
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      tripId,
      status: "pending",
    });

    if (existingInvitation && !existingInvitation.isExpired()) {
      // Already invited and still valid: don't email them again. Resending is
      // a deliberate action from the trip page.
      return { alreadyInvited: true, email: existingInvitation.email };
    }

    // Create new invitation
    const token = Invitation.generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const invitation = new Invitation({
      email: email.toLowerCase(),
      tripId,
      tripName,
      invitedBy,
      invitationToken: token,
      expiresAt,
    });

    await invitation.save();
    return invitation;
  }

  // Create invitations for multiple emails
  async createInvitations(emails, tripId, tripName, invitedBy) {
    const results = {
      invitedEmails: [],
      registeredEmails: [],
      existingInvitations: [],
    };

    for (const email of emails) {
      const invitation = await this.createInvitation(
        email,
        tripId,
        tripName,
        invitedBy
      );

      if (invitation?.alreadyRegistered) {
        results.registeredEmails.push({
          email: invitation.email,
          userId: invitation.userId,
        });
      } else if (invitation?.alreadyInvited) {
        results.existingInvitations.push({ email: invitation.email });
      } else if (invitation?._id) {
        // New invitation created
        results.invitedEmails.push({
          email: invitation.email,
          token: invitation.invitationToken,
          expiresAt: invitation.expiresAt,
        });
      }
    }

    return results;
  }

  // Get invitation by token
  async getInvitationByToken(token) {
    const invitation = await Invitation.findOne({
      invitationToken: token,
      status: "pending",
    });

    if (!invitation) {
      throw new Error("Invitation not found or has been used");
    }

    if (invitation.isExpired()) {
      throw new Error("Invitation has expired");
    }

    return invitation;
  }

  // Accept invitation when user registers
  async acceptInvitation(token, userId) {
    const invitation = await this.getInvitationByToken(token);

    invitation.status = "accepted";
    invitation.userId = userId;
    invitation.acceptedAt = new Date();
    await invitation.save();

    return invitation;
  }

  // Get pending invitations for a user email
  async getPendingInvitationsForEmail(email) {
    return await Invitation.find({
      email: email.toLowerCase(),
      status: "pending",
    })
      .populate("tripId", "name destination wetuLink")
      .sort({ createdAt: -1 });
  }

  // Get all invitations for a trip (admin view)
  async getInvitationsForTrip(tripId) {
    return await Invitation.find({ tripId })
      .populate("invitedBy", "email")
      .populate("resends.sentBy", "email")
      .sort({ createdAt: -1 });
  }

  // Claims the resend before the email goes out, so two admins clicking at
  // once can't both send. Within the cooldown the caller must pass force.
  async claimResend(invitationId, adminId, { force = false } = {}) {
    const invitation = await Invitation.findById(invitationId).populate("resends.sentBy", "email");

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Only pending invitations can be resent");
    }

    const lastSentAt = invitation.lastSentAt || invitation.createdAt;
    if (!force && Date.now() - lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw recentlySentError(invitation);
    }

    const sentAt = new Date();
    const update = {
      $set: { lastSentAt: sentAt },
      $push: { resends: { sentAt, sentBy: adminId } },
    };
    if (invitation.isExpired()) {
      update.$set.invitationToken = Invitation.generateToken();
      update.$set.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Matches only if nobody else resent since we read it.
    const claimed = await Invitation.findOneAndUpdate(
      { _id: invitationId, status: "pending", lastSentAt: invitation.lastSentAt || null },
      update,
      { new: true }
    );

    if (!claimed) {
      const latest = await Invitation.findById(invitationId).populate("resends.sentBy", "email");
      throw recentlySentError(latest || invitation);
    }

    return { invitation: claimed, sentAt, previousLastSentAt: invitation.lastSentAt || null };
  }

  // The email didn't go out: keep the attempt in the history but don't let it
  // count as a send.
  async markResendFailed(invitationId, sentAt, previousLastSentAt) {
    await Invitation.updateOne(
      { _id: invitationId, "resends.sentAt": sentAt },
      { $set: { "resends.$.emailSent": false } }
    );
    await Invitation.updateOne(
      { _id: invitationId, lastSentAt: sentAt },
      { $set: { lastSentAt: previousLastSentAt } }
    );
  }

  // Delete invitation (admin action - in case of mistake)
  async deleteInvitation(invitationId) {
    const result = await Invitation.deleteOne({ _id: invitationId });
    return result.deletedCount > 0;
  }

  // Clean up expired invitations
  async cleanupExpiredInvitations() {
    const result = await Invitation.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
  }
}

export default new InvitationService();

import Invitation from "../models/Invitation.js";
import User from "../models/User.js";

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
      // Invitation still valid, return existing one
      return existingInvitation;
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
      .sort({ createdAt: -1 });
  }

  // Resend invitation email (admin action)
  async resendInvitation(invitationId) {
    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Only pending invitations can be resent");
    }

    if (invitation.isExpired()) {
      // Generate new token and extend expiry
      invitation.invitationToken = Invitation.generateToken();
      invitation.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await invitation.save();
    }

    return invitation;
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

import invitationService from "../services/invitation.service.js";
import { sendTripInvitationEmail, sendBulkTripInvitations } from "../nodemailer/email.js";

// Get invitations for a trip (admin view)
export const getInvitationsForTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const invitations = await invitationService.getInvitationsForTrip(tripId);
    res.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ message: error.message || "Error fetching invitations" });
  }
};

// Resend invitation email
export const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await invitationService.resendInvitation(invitationId);

    // Send email
    const emailResult = await sendTripInvitationEmail(
      invitation.email,
      invitation.tripName,
      invitation.invitationToken,
      "" // wetuLink not stored in invitation
    );

    res.json({
      message: "Invitation resent successfully",
      invitation,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    res.status(400).json({ message: error.message || "Error resending invitation" });
  }
};

// Delete invitation
export const deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const deleted = await invitationService.deleteInvitation(invitationId);

    if (!deleted) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    res.json({ message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    res.status(500).json({ message: error.message || "Error deleting invitation" });
  }
};

// Send invitations for a trip (used when emails collected after trip creation)
export const sendTripInvitations = async (req, res) => {
  try {
    const { invitations, tripName, wetuLink } = req.body;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({ message: "No invitations to send" });
    }

    const emailResults = await sendBulkTripInvitations(invitations, tripName, wetuLink);

    res.json({
      message: "Invitations sent",
      results: emailResults
    });
  } catch (error) {
    console.error("Error sending invitations:", error);
    res.status(500).json({ message: error.message || "Error sending invitations" });
  }
};

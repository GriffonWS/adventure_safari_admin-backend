import dashboardService from "../services/dashboard.service.js";

// Get all dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
};

// Get user growth data only
export const getUserGrowthData = async (req, res) => {
  try {
    const data = await dashboardService.getUserGrowthData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    res.status(500).json({
      message: "Error fetching user growth data",
      error: error.message
    });
  }
};

// Get weekly bookings data only
export const getWeeklyBookingsData = async (req, res) => {
  try {
    const data = await dashboardService.getWeeklyBookingsData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching weekly bookings data:", error);
    res.status(500).json({
      message: "Error fetching weekly bookings data",
      error: error.message
    });
  }
};

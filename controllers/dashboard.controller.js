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

// Get users registered in last 30 days
export const getUsersLast30Days = async (req, res) => {
  try {
    const users = await dashboardService.getUsersLast30Days();
    res.status(200).json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("Error fetching users last 30 days:", error);
    res.status(500).json({
      message: "Error fetching users data",
      error: error.message
    });
  }
};

// Get bookings from last 30 days
export const getBookingsLast30Days = async (req, res) => {
  try {
    const bookings = await dashboardService.getBookingsLast30Days();
    res.status(200).json({
      count: bookings.length,
      bookings: bookings
    });
  } catch (error) {
    console.error("Error fetching bookings last 30 days:", error);
    res.status(500).json({
      message: "Error fetching bookings data",
      error: error.message
    });
  }
};

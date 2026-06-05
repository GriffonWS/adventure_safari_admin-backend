import User from "../models/User.js";
import Booking from "../models/Booking.js";

class DashboardService {
  // Get total users count
  async getTotalUsers() {
    return await User.countDocuments();
  }

  // Get users registered today
  async getUsersRegisteredToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await User.countDocuments({
      createdAt: { $gte: today }
    });
  }

  // Get users registered this month
  async getUsersRegisteredThisMonth() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return await User.countDocuments({
      createdAt: { $gte: monthStart }
    });
  }

  // Get users registered in last 30 days with details
  async getUsersLast30Days() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await User.find(
      { createdAt: { $gte: thirtyDaysAgo } },
      { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0, twoFactorSecret: 0, twoFactorTempSecret: 0 }
    ).sort({ createdAt: -1 });
  }

  // Get bookings from last 30 days with details
  async getBookingsLast30Days() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await Booking.find(
      { createdAt: { $gte: thirtyDaysAgo } }
    )
      .populate('userId', 'name email')
      .populate('tripId', 'title destination')
      .sort({ createdAt: -1 });
  }

  // Get total bookings count
  async getTotalBookings() {
    return await Booking.countDocuments();
  }

  // Get today's bookings count
  async getTodaysBookings() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await Booking.countDocuments({
      createdAt: { $gte: today }
    });
  }

  // Get user growth data for last 7 months
  async getUserGrowthData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const currentDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);

      const count = await User.countDocuments({
        createdAt: {
          $gte: date,
          $lt: nextMonth
        }
      });

      result.push({
        month: months[date.getMonth()],
        users: count
      });
    }

    return result;
  }

  // Get weekly bookings data for last 7 days
  async getWeeklyBookingsData() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const currentDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await Booking.countDocuments({
        createdAt: {
          $gte: date,
          $lt: nextDay
        }
      });

      result.push({
        day: days[date.getDay()],
        bookings: count
      });
    }

    return result;
  }

  // Get all dashboard stats
  async getDashboardStats() {
    const [
      totalUsers,
      usersRegisteredToday,
      usersRegisteredThisMonth,
      totalBookings,
      todaysBookings,
      userGrowthData,
      weeklyBookingsData
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getUsersRegisteredToday(),
      this.getUsersRegisteredThisMonth(),
      this.getTotalBookings(),
      this.getTodaysBookings(),
      this.getUserGrowthData(),
      this.getWeeklyBookingsData()
    ]);

    return {
      cardData: [
        {
          title: "User Registrations",
          icon: "👥",
          today: usersRegisteredToday,
          thisMonth: usersRegisteredThisMonth,
          type: "users"
        },
        {
          title: "Bookings",
          icon: "📅",
          today: todaysBookings,
          thisMonth: totalBookings,
          type: "bookings"
        }
      ],
      userGrowthData,
      weeklyBookingsData
    };
  }
}

export default new DashboardService();

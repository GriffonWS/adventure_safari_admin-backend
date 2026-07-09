import ColorSettings from "../models/ColorSettings.js";

// Default bag colors from frontend
const DEFAULT_COLORS = [
  { name: "Black", hexCode: "#000000", isActive: true },
  { name: "Navy Blue", hexCode: "#001f3f", isActive: true },
  { name: "Olive Green", hexCode: "#556B2F", isActive: true },
  { name: "Chocolate Brown", hexCode: "#8B4513", isActive: true },
  { name: "Forest Green", hexCode: "#228B22", isActive: true },
  { name: "Burgundy", hexCode: "#800020", isActive: true },
  { name: "Tan", hexCode: "#D2B48C", isActive: true },
  { name: "Charcoal Gray", hexCode: "#36454F", isActive: true },
  { name: "Slate Blue", hexCode: "#6A5ACD", isActive: true },
  { name: "Teal", hexCode: "#008080", isActive: true },
  { name: "Rust Orange", hexCode: "#B7410E", isActive: true },
  { name: "Deep Red", hexCode: "#9B111E", isActive: true },
];

// Get all color settings
export const getColorSettings = async (req, res) => {
  try {
    let settings = await ColorSettings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new ColorSettings({
        colors: DEFAULT_COLORS,
      });

      await settings.save();
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching color settings:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch color settings.",
    });
  }
};

// Update color availability
export const updateColorSettings = async (req, res) => {
  try {
    const { colors } = req.body;

    if (!Array.isArray(colors)) {
      return res.status(400).json({
        success: false,
        message: "Colors must be an array",
      });
    }

    let settings = await ColorSettings.findOne();

    if (!settings) {
      settings = new ColorSettings({ colors });
    } else {
      settings.colors = colors;
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Color settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating color settings:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update color settings.",
    });
  }
};

// Toggle single color availability
export const toggleColorAvailability = async (req, res) => {
  try {
    const { colorName } = req.params;

    let settings = await ColorSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Color settings not found",
      });
    }

    const color = settings.colors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );

    if (!color) {
      return res.status(404).json({
        success: false,
        message: "Color not found",
      });
    }

    color.isActive = !color.isActive;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: `${colorName} availability toggled successfully`,
      data: settings,
    });
  } catch (error) {
    console.error("Error toggling color availability:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle color availability.",
    });
  }
};

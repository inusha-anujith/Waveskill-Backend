const Attendance = require('../models/attendanceModel');

// Helper function to format date as YYYY-MM-DD for your local timezone
const getTodayDateString = () => {
    const today = new Date();
    // Adjusting for local time (Sri Lanka is UTC+5:30, but keeping it simple for server time)
    return today.toISOString().split('T')[0]; 
};

// @desc    Check In
// @route   POST /api/attendance/checkin
const checkIn = async (req, res) => {
    try {
        const userId = req.user._id; // Gotten from your auth middleware!
        const dateString = getTodayDateString();
        const now = new Date();

        // 1. Check if they already checked in today
        const existingAttendance = await Attendance.findOne({ user: userId, dateString });
        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'You have already checked in today!' });
        }

        // 2. Determine if they are Late (Assuming 9:00 AM is the cutoff)
        // We extract the hours and minutes of the current time
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        let status = 'Present';
        if (currentHour > 9 || (currentHour === 9 && currentMinute > 0)) {
            status = 'Late';
        }

        // 3. Save the Check In record
        const attendance = await Attendance.create({
            user: userId,
            dateString,
            checkIn: now,
            status
        });

        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Check Out
// @route   PUT /api/attendance/checkout
const checkOut = async (req, res) => {
    try {
        const userId = req.user._id;
        const dateString = getTodayDateString();
        const now = new Date();

        // 1. Find today's check-in record
        const attendance = await Attendance.findOne({ user: userId, dateString });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'You have not checked in today!' });
        }
        if (attendance.checkOut) {
            return res.status(400).json({ success: false, message: 'You have already checked out today!' });
        }

        // 2. Calculate total work hours
        const checkInTime = new Date(attendance.checkIn);
        const diffInMilliseconds = now - checkInTime;
        
        // Convert milliseconds into Hours and Minutes
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        const hours = Math.floor(diffInMinutes / 60);
        const minutes = diffInMinutes % 60;

        // Format to match your UI (e.g., "9h 0m")
        attendance.workHours = `${hours}h ${minutes}m`;
        attendance.checkOut = now;

        await attendance.save();

        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged-in user's attendance history and stats
// @route   GET /api/attendance/me
const getMyAttendance = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all records for this user, sorted by newest first
        const history = await Attendance.find({ user: userId }).sort({ createdAt: -1 });

        // Calculate the summary stats for your UI boxes!
        const totalDays = history.length;
        const presentCount = history.filter(record => record.status === 'Present').length;
        const lateCount = history.filter(record => record.status === 'Late').length;
        // Absent logic usually requires a separate cron job or admin entry, 
        // so we default to 0 here to fit the UI design for now.
        const absentCount = history.filter(record => record.status === 'Absent').length;

        res.status(200).json({
            success: true,
            stats: {
                totalDays,
                present: presentCount,
                late: lateCount,
                absent: absentCount
            },
            history // This array feeds exactly into your UI table!
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { checkIn, checkOut, getMyAttendance };
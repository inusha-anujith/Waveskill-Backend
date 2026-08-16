const Attendance = require('../models/attendanceModel');

const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; 
};

// @desc    Check In
// @route   POST /api/attendance/checkin
const checkIn = async (req, res) => {
    try {
        const userId = req.user._id; 
        const dateString = getTodayDateString();
        const now = new Date();

        const existingAttendance = await Attendance.findOne({ user: userId, dateString });
        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'You have already checked in today!' });
        }

        // Determine if Late (After 09:30)
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        let status = 'Present';
        if (currentHour > 9 || (currentHour === 9 && currentMinute > 30)) {
            status = 'Late';
        }

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

        const attendance = await Attendance.findOne({ user: userId, dateString });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'You have not checked in today!' });
        }
        if (attendance.checkOut) {
            return res.status(400).json({ success: false, message: 'You have already checked out today!' });
        }

        const checkInTime = new Date(attendance.checkIn);
        
        // Calculate total work hours
        const diffInMilliseconds = now - checkInTime;
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        const hours = Math.floor(diffInMinutes / 60);
        const minutes = diffInMinutes % 60;
        attendance.workHours = `${hours}h ${minutes}m`;

        // Calculate OT Hours (Time past 17:30)
        const otThreshold = new Date(now);
        otThreshold.setHours(17, 30, 0, 0);

        if (now > otThreshold) {
            const otStart = checkInTime > otThreshold ? checkInTime : otThreshold;
            const otDiffMins = Math.floor((now - otStart) / (1000 * 60));
            const otHours = Math.floor(otDiffMins / 60);
            const otMins = otDiffMins % 60;
            attendance.otHours = `${otHours}h ${otMins}m`;
        } else {
            attendance.otHours = '0h 0m';
        }

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
        const history = await Attendance.find({ user: userId }).sort({ createdAt: -1 });

        const totalDays = history.length;
        const presentCount = history.filter(record => record.status === 'Present').length;
        const lateCount = history.filter(record => record.status === 'Late').length;
        const absentCount = history.filter(record => record.status === 'Absent').length;

        res.status(200).json({
            success: true,
            stats: {
                totalDays,
                present: presentCount,
                late: lateCount,
                absent: absentCount
            },
            history 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { checkIn, checkOut, getMyAttendance };
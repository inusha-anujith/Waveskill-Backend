const Attendance = require('../models/attendanceModel');
const OTRequest = require('../models/otRequestModel');
const Leave = require('../models/leaveModel');

const getTodayDateString = () => {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"}));
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ==========================================
// @desc    Check In
// @route   POST /api/attendance/checkin
// ==========================================
const checkIn = async (req, res) => {
    try {
        const userId = req.user._id; 
        const dateString = getTodayDateString();
        const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"}));
        
        // Convert today's dateString into a comparable Date object for the Leave query
        const todayDateObj = new Date(dateString);

        // 1. Duplicate Check
        const existingAttendance = await Attendance.findOne({ user: userId, dateString });
        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'You have already checked in today!' });
        }

        // 2. [UPDATED] Leave Validation: Check if today falls between an approved startDate and endDate
        const approvedLeave = await Leave.findOne({ 
            user: userId, 
            status: 'Approved',
            startDate: { $lte: todayDateObj },
            endDate: { $gte: todayDateObj }
        });

        if (approvedLeave) {
            return res.status(400).json({ 
                success: false, 
                // Dynamically injects "Casual Leave", "Sick Leave", or "Annual Leave" into the Next.js toast notification
                message: `Check-in blocked: You have an approved ${approvedLeave.leaveType} scheduled for today.` 
            });
        }

        // 3. Weekend Validation
        const dayOfWeek = now.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        if (isWeekend) {
            const approvedOT = await OTRequest.findOne({ user: userId, date: new Date(dateString), status: 'Approved' });
            if (!approvedOT) {
                const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
                return res.status(400).json({ 
                    success: false, 
                    message: `You haven't requested OT for this ${dayName}. You must apply for an OT request and have it approved before checking in.` 
                });
            }
        }

        // 4. Time Calculation
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        let status = 'Present';
        if (currentHour > 9 || (currentHour === 9 && currentMinute > 30)) {
            status = 'Late';
        }

        // 5. Database Entry
        const attendance = await Attendance.create({ user: userId, dateString, checkIn: now, status });
        res.status(201).json({ success: true, data: attendance });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};

// ==========================================
// @desc    Check Out
// @route   PUT /api/attendance/checkout
// ==========================================
const checkOut = async (req, res) => {
    try {
        const userId = req.user._id;
        const dateString = getTodayDateString();
        const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"}));

        const attendance = await Attendance.findOne({ user: userId, dateString });
        if (!attendance) return res.status(400).json({ success: false, message: 'You have not checked in today!' });
        if (attendance.checkOut) return res.status(400).json({ success: false, message: 'You have already checked out today!' });

        const approvedOT = await OTRequest.findOne({ user: userId, date: new Date(dateString), status: 'Approved' });
        
        let maxAllowedTime = new Date(attendance.checkIn);
        maxAllowedTime.setHours(17, 30, 0, 0);

        if (approvedOT) {
            maxAllowedTime = new Date(maxAllowedTime.getTime() + (approvedOT.otHours * 60 * 60 * 1000));
        }

        const actualCheckOut = now > maxAllowedTime ? maxAllowedTime : now;
        attendance.checkOut = actualCheckOut;

        const checkInTime = new Date(attendance.checkIn);
        const standardEnd = actualCheckOut > maxAllowedTime && !approvedOT ? maxAllowedTime : actualCheckOut; 
        
        const diffMins = Math.floor((standardEnd - checkInTime) / (1000 * 60));
        attendance.workHours = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
        
        if (approvedOT && actualCheckOut > new Date(attendance.checkIn).setHours(17,30,0,0)) {
            const otStart = new Date(attendance.checkIn).setHours(17,30,0,0);
            const otDiff = Math.floor((actualCheckOut - otStart) / (1000 * 60));
            attendance.otHours = `${Math.floor(otDiff / 60)}h ${otDiff % 60}m`;
        } else {
            attendance.otHours = '0h 0m';
        }
        
        await attendance.save();
        res.status(200).json({ success: true, data: attendance });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};

// ==========================================
// @desc    Submit an Overtime (OT) Request
// @route   POST /api/attendance/ot-request
// ==========================================
const requestOT = async (req, res) => {
    try {
        const userId = req.user._id;
        const { dateString, otHours, reason } = req.body;

        if (!otHours || !reason) return res.status(400).json({ success: false, message: 'Please provide hours and a reason.' });

        const targetDate = new Date(dateString);
        
        const existingReq = await OTRequest.findOne({ user: userId, date: targetDate });
        if (existingReq) return res.status(400).json({ success: false, message: 'You have already submitted an OT request for this date.' });

        const newOTRequest = await OTRequest.create({
            user: userId, date: targetDate, otHours: Number(otHours), reason, status: 'Pending'
        });

        res.status(201).json({ success: true, data: newOTRequest });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};

// ==========================================
// @desc    Cancel a Pending OT Request
// @route   DELETE /api/attendance/ot-request/:id
// ==========================================
const cancelOTRequest = async (req, res) => {
    try {
        const request = await OTRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'OT Request not found' });
        
        if (request.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized action' });
        }
        
        if (request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'You cannot cancel an OT request that has already been processed.' });
        }

        await request.deleteOne();
        res.status(200).json({ success: true, message: 'OT Request cancelled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// @desc    Get attendance history and stitch with OT Requests
// @route   GET /api/attendance/me
// ==========================================
const getMyAttendance = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const history = await Attendance.find({ user: userId }).sort({ createdAt: -1 });
        const otRequests = await OTRequest.find({ user: userId });

        const historyWithOT = history.map(record => {
            const recordObj = record.toObject();
            const matchedOT = otRequests.find(ot => ot.date.toISOString().split('T')[0] === recordObj.dateString);
            recordObj.otRequest = matchedOT || null;
            return recordObj;
        });

        const todayStr = getTodayDateString();
        const todayOT = otRequests.find(ot => ot.date.toISOString().split('T')[0] === todayStr) || null;

        const totalDays = history.length;
        const presentCount = history.filter(record => record.status === 'Present').length;
        const lateCount = history.filter(record => record.status === 'Late').length;
        const absentCount = history.filter(record => record.status === 'Absent').length;

        res.status(200).json({
            success: true,
            stats: { totalDays, present: presentCount, late: lateCount, absent: absentCount },
            history: historyWithOT,
            todayOT: todayOT 
        });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};

module.exports = { checkIn, checkOut, requestOT, cancelOTRequest, getMyAttendance };
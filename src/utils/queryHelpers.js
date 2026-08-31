const User = require('../models/userModel');

// A raw search term goes straight into a $regex, so metacharacters must be
// escaped. Without this, input like "a+b", "(" or ".*" either throws a
// PCRE error or silently matches far more than the user intended.
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds a case-insensitive "contains" matcher for a trimmed search term.
const buildSearchRegex = (search) => ({ $regex: escapeRegex(search.trim()), $options: 'i' });

// Attendance and OT records reference the user by id, so their name/email
// search cannot be a plain field regex. Resolve the matching user ids first and
// let the caller constrain on them. Two small queries keep .populate(), the
// pagination and the counts correct, and stay far simpler than an aggregation
// $lookup at this data size.
//
// Returns an array of ObjectIds — empty means "nobody matched", which callers
// must translate into zero rows rather than an unfiltered list.
const findUserIdsMatching = async (search) => {
    const regex = buildSearchRegex(search);
    const users = await User.find({
        $or: [
            { name: regex },
            { email: regex },
            { employeeId: regex }
        ]
    }).select('_id');

    return users.map((u) => u._id);
};

module.exports = { escapeRegex, buildSearchRegex, findUserIdsMatching };

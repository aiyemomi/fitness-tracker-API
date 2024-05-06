const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Workout = require("../models/workout");

const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user_exists = await User.findOne({ email });
    if (user_exists) {
      return res.status(400).json("email is already in use ");
    }
    const salt = bcrypt.genSaltSync(10);
    const hashed_password = bcrypt.hashSync(password, salt);

    const new_user = await User.create({
      ...req.body,
      password: hashed_password,
    });
    return res.status(201).json({ user: new_user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Input email and password" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json("User not found");
    }

    const password_match = await bcrypt.compareSync(password, user.password);

    if (!password_match) {
      return res
        .status(400)
        .json({ error: "wrong username and password combination" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.status(200).json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
const getUserData = async (req, res, next) => {
  try {
    const user_id = req.user?.id;
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ msg: "user not found" });
    }

    const current_date = new Date();
    const start_date = new Date(
      current_date.getFullYear(),
      current_date.getMonth(),
      current_date.getDate()
    );
    const end_date = new Date(
      current_date.getFullYear(),
      current_date.getMonth(),
      current_date.getDate() + 1
    );

    // total calories burnt
    const total_calories_burnt = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: start_date, $lt: end_date } } },
      {
        $group: {
          _id: null,
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    // total no of active workouts
    const total_active_workouts = await Workout.countDocuments({
      user: user_id,
      date: { $gte: start_date, $lt: end_date },
    });

    //average calories burnt per workout
    const avg_calories_per_workout =
      total_calories_burnt.length > 0
        ? total_calories_burnt[0].totalCaloriesBurnt / total_workouts
        : 0;

    // Fetch category of workouts
    const calories_burnt_by_category = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: start_date, $lt: end_date } } },
      {
        $group: {
          category: "$category",
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    const piechart_data = calories_burnt_by_category.map((category, index) => ({
      id: index,
      value: category.totalCaloriesBurnt,
      label: category.category,
    }));

    const weeks = [];
    const calories_burnt = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(current_date.getTime() - i * 24 * 60 * 60 * 1000);
      weeks.push(`${date.getDate()}th`);

      const start_of_day = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const end_of_day = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      const week_data = await Workout.aggregate([
        {
          $match: {
            user: user._id,
            date: { $gte: start_of_day, $lt: end_of_day },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalCaloriesBurnt: { $sum: "$caloriesBurned" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      calories_burnt.push(
        week_data[0]?.totalCaloriesBurnt ? week_data[0]?.totalCaloriesBurnt : 0
      );
    }

    return res.status(200).json({
      totalCaloriesBurnt:
        total_calories_burnt.length > 0
          ? total_calories_burnt[0].totalCaloriesBurnt
          : 0,
      totalActiveWorkouts: total_active_workouts,
      avgCaloriesBurntPerWorkout: avg_calories_per_workout,
      totalWeeksCaloriesBurnt: {
        weeks: weeks,
        caloriesBurned: calories_burnt,
      },
      pieChartData: piechart_data,
    });
  } catch (err) {
    next(err);
  }
};
module.exports = { registerUser, loginUser, getUserData };

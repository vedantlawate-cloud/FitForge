const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const authController = require('../controllers/authController');
const caloriesController = require('../controllers/caloriesController');
const workoutController = require('../controllers/workoutController');
const liftsController = require('../controllers/liftsController');
const profileController = require('../controllers/profileController');

// ---- AUTH ----
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.getMe);

// ---- DASHBOARD ----
router.get('/dashboard', auth, profileController.getDashboardStats);

// ---- CALORIES ----
router.get('/calories', auth, caloriesController.getLogs);
router.post('/calories', auth, caloriesController.addLog);
router.delete('/calories/:id', auth, caloriesController.deleteLog);
router.get('/calories/summary', auth, caloriesController.getSummary);
router.get('/calories/foods', auth, caloriesController.searchFoods);
router.get('/calories/water', auth, caloriesController.getWaterLogs);
router.post('/calories/water', auth, caloriesController.logWater);

// ---- WORKOUTS ----
router.get('/workouts/routines', auth, workoutController.getRoutines);
router.post('/workouts/routines', auth, workoutController.createRoutine);
router.get('/workouts/routines/:id', auth, workoutController.getRoutineDetails);
router.delete('/workouts/routines/:id', auth, workoutController.deleteRoutine);
router.get('/workouts/sessions', auth, workoutController.getSessions);
router.post('/workouts/sessions', auth, workoutController.startSession);
router.put('/workouts/sessions/:id/end', auth, workoutController.endSession);
router.post('/workouts/sessions/:sessionId/sets', auth, workoutController.logSet);
router.get('/workouts/exercises', auth, workoutController.getExercises);

// ---- LIFTS ----
router.get('/lifts/prs', auth, liftsController.getPRs);
router.post('/lifts/prs', auth, liftsController.addPR);
router.get('/lifts/history/:exerciseId', auth, liftsController.getExerciseHistory);
router.get('/lifts/stats', auth, liftsController.getStats);

// ---- PROFILE ----
router.put('/profile', auth, profileController.updateProfile);
router.put('/profile/settings', auth, profileController.updateSettings);
router.put('/profile/password', auth, profileController.changePassword);
router.get('/profile/measurements', auth, profileController.getBodyMeasurements);
router.post('/profile/measurements', auth, profileController.addBodyMeasurement);

module.exports = router;

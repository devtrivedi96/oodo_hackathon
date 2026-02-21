/*
 * COMPONENT MIGRATION TEMPLATE
 *
 * This file shows examples of how to convert Supabase calls to the new API format
 * Apply these patterns to all remaining component files
 */

// ============================================================================
// PATTERN 1: Loading Data
// ============================================================================

// BEFORE (Supabase):
// async function loadVehicles() {
//   try {
//     const { data, error } = await supabase
//       .from('vehicles')
//       .select('*')
//       .eq('id', vehicleId);
//     if (error) throw error;
//     setVehicles(data || []);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// AFTER (MySQL API):
// async function loadVehicles() {
//   try {
//     const data = await vehicleAPI.getById(vehicleId);
//     setVehicles([data]);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// ============================================================================
// PATTERN 2: Creating Records
// ============================================================================

// BEFORE (Supabase):
// const { data, error } = await supabase
//   .from('vehicles')
//   .insert([{ name: 'Vehicle1', license_plate: 'ABC-123' }]);
// if (error) throw error;

// AFTER (MySQL API):
// const data = await vehicleAPI.create({
//   name: 'Vehicle1',
//   license_plate: 'ABC-123'
// });

// ============================================================================
// PATTERN 3: Updating Records
// ============================================================================

// BEFORE (Supabase):
// const { error } = await supabase
//   .from('vehicles')
//   .update({ status: 'Available' })
//   .eq('id', vehicleId);
// if (error) throw error;

// AFTER (MySQL API):
// await vehicleAPI.update(vehicleId, { status: 'Available' });

// ============================================================================
// PATTERN 4: Deleting Records
// ============================================================================

// BEFORE (Supabase):
// const { error } = await supabase
//   .from('vehicles')
//   .delete()
//   .eq('id', vehicleId);
// if (error) throw error;

// AFTER (MySQL API):
// await vehicleAPI.delete(vehicleId);

// ============================================================================
// PATTERN 5: Filtering with Multiple Conditions
// ============================================================================

// BEFORE (Supabase):
// const { data } = await supabase
//   .from('trips')
//   .select('*')
//   .eq('vehicle_id', vehicleId)
//   .eq('status', 'Completed')
//   .order('created_at', { ascending: false });

// AFTER (MySQL API):
// Note: The API returns all data and you filter client-side if needed
// const allTrips = await tripAPI.getAll();
// const filteredTrips = allTrips.filter(
//   t => t.vehicle_id === vehicleId && t.status === 'Completed'
// );

// Or add query parameter support to the backend API:
// GET /api/trips?vehicle_id=xxx&status=Completed

// ============================================================================
// PATTERN 6: Batch Operations
// ============================================================================

// BEFORE (Supabase):
// const { error } = await supabase
//   .from('trips')
//   .update({
//     status: 'Completed',
//     completed_at: new Date().toISOString()
//   })
//   .eq('id', tripId);

// AFTER (MySQL API):
// await tripAPI.update(tripId, {
//   status: 'Completed',
//   completed_at: new Date().toISOString()
// });

// ============================================================================
// PATTERN 7: Related Table Data (JOINs)
// ============================================================================

// BEFORE (Supabase):
// const { data } = await supabase
//   .from('trips')
//   .select(`
//     *,
//     vehicle:vehicles(*),
//     driver:drivers(*)
//   `);

// AFTER (MySQL API):
// Option 1: Backend returns joined data
// const trips = await tripAPI.getAll(); // Backend performs JOINs
//
// Option 2: Client-side joining
// const trips = await tripAPI.getAll();
// const vehicles = await vehicleAPI.getAll();
// const drivers = await driverAPI.getAll();
//
// const tripsWithDetails = trips.map(trip => ({
//   ...trip,
//   vehicle: vehicles.find(v => v.id === trip.vehicle_id),
//   driver: drivers.find(d => d.id === trip.driver_id)
// }));

// ============================================================================
// KEY IMPORTS TO UPDATE
// ============================================================================

// Change from:
// import { supabase, Vehicle, Trip } from '../../lib/supabase';

// To:
// import {
//   vehicleAPI, tripAPI,
//   Vehicle, Trip
// } from '../../lib/db';

// ============================================================================
// ERROR HANDLING
// ============================================================================

// BEFORE (Supabase):
// try {
//   const { data, error } = await supabase.from('vehicles').select('*');
//   if (error) throw error;
// } catch (error) {
//   console.error('Error:', error);
// }

// AFTER (MySQL API):
// try {
//   const data = await vehicleAPI.getAll();
// } catch (error) {
//   console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
// }

export {};

import pool from "../config/db.js";

// Create reservation (simple customer system)
export const createReservationService = async (reservationData, createdBy) => {
  const {
    table_id,
    party_size,
    reservation_date,
    reservation_time,
    customer_id = null,
    duration_hours = 2,
    notes = null,
  } = reservationData;

  // Check if table exists
  const tableResult = await pool.query(
    `
    SELECT is_occupied FROM tables WHERE table_id = $1
  `,
    [table_id]
  );

  if (tableResult.rows.length === 0) {
    throw new Error("Table not found");
  }

  const table = tableResult.rows[0];
  if (table.is_occupied) {
    throw new Error("Table is currently occupied");
  }

  // Check for conflicting reservations (same time only)
  // A table cannot have reservations at the exact same time
  // Use parameterized query for safe date handling
  const conflictResult = await pool.query(
    `
    SELECT reservation_id FROM reservations 
    WHERE table_id = $1 
    AND reservation_date = $2::date
    AND status = 'confirmed'
    AND reservation_time = $3::time
  `,
    [table_id, reservation_date, reservation_time]
  );

  if (conflictResult.rows.length > 0) {
    throw new Error("Table is already reserved for this time");
  }

  // Create reservation with parameterized query for safe date handling
  const result = await pool.query(
    `
        INSERT INTO reservations (
      customer_id,
      table_id,
      party_size,
      reservation_date,
      reservation_time,
      duration_hours,
      notes,
      status,
      created_by,
      created_at
    ) VALUES ($1, $2, $3, $4::date, $5::time, $6, $7, 'confirmed', $8, NOW())
    RETURNING reservation_id
  `,
    [
      customer_id,
      table_id,
      party_size,
      reservation_date,
      reservation_time,
      duration_hours,
      notes,
      createdBy,
    ]
  );

  // Get the created reservation with proper formatting
  const reservationId = result.rows[0].reservation_id;
  return await getReservationByIdService(reservationId);
};

// Get all reservations
export const getAllReservationsService = async (
  page = 1,
  limit = 20,
  date = null
) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      r.reservation_id,
      r.customer_id,
      r.table_id,
      r.party_size,
      r.status,
      r.created_by,
      r.created_at,
      r.updated_at,
      c.name as customer_name,
      c.phone_number as customer_phone,
      c.email as customer_email,
      u.user_name as created_by_name,
      r.reservation_date,
      r.reservation_time,
      -- Formatted date/time (simple)
      TO_CHAR(r.reservation_date, 'DD/MM/YYYY') as formatted_date,
      TO_CHAR(r.reservation_time, 'HH24:MI') as formatted_time
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.customer_id
    LEFT JOIN users u ON r.created_by = u.user_id
  `;

  const queryParams = [];

  if (date) {
    query += ` WHERE r.reservation_date = $1`;
    queryParams.push(date);
  }

  query += ` ORDER BY r.reservation_date DESC, r.reservation_time DESC LIMIT $${
    queryParams.length + 1
  } OFFSET $${queryParams.length + 2}`;
  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);
  return result.rows;
};

export const getReservationByIdService = async (reservationId) => {
  const result = await pool.query(
    `
    SELECT
      r.reservation_id,
      r.customer_id,
      r.table_id,
      r.party_size,
      r.status,
      r.duration_hours,
      r.notes,
      r.reservation_date,
      r.reservation_time,
      r.created_by,
      r.created_at,
      r.updated_at,
      c.name as customer_name,
      c.phone_number as customer_phone,
      c.email as customer_email,
      u.user_name as created_by_name,
      -- Formatted date/time (simple)
      TO_CHAR(r.reservation_date, 'DD/MM/YYYY') as formatted_date,
      TO_CHAR(r.reservation_time, 'HH24:MI') as formatted_time
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.customer_id
    LEFT JOIN users u ON r.created_by = u.user_id
    WHERE r.reservation_id = $1
  `,
    [reservationId]
  );

  const reservation = result.rows[0];
  if (!reservation) return null;

  return reservation;
};

// Update reservation
export const updateReservationService = async (
  reservationId,
  updateData,
  updatedBy
) => {
  const { party_size, reservation_date, reservation_time, status, notes } =
    updateData;

  // Check if reservation exists
  const existingReservation = await getReservationByIdService(reservationId);
  if (!existingReservation) {
    throw new Error("Reservation not found");
  }

  if (
    (reservation_date &&
      reservation_date !== existingReservation.reservation_date) ||
    (reservation_time &&
      reservation_time !== existingReservation.reservation_time)
  ) {
    const conflictResult = await pool.query(
      `
      SELECT reservation_id FROM reservations 
      WHERE table_id = $1 
      AND reservation_date = $2 
      AND reservation_time = $3 
      AND status = 'confirmed'
      AND reservation_id != $4
    `,
      [
        existingReservation.table_id,
        reservation_date || existingReservation.reservation_date,
        reservation_time || existingReservation.reservation_time,
        reservationId,
      ]
    );

    if (conflictResult.rows.length > 0) {
      throw new Error("Table is already reserved for this time");
    }
  }

  const result = await pool.query(
    `
    UPDATE reservations 
    SET 
      party_size = COALESCE($1, party_size),
      reservation_date = COALESCE($2::date, reservation_date),
      reservation_time = COALESCE($3, reservation_time),
      status = COALESCE($4, status),
      notes = COALESCE($5, notes),
      updated_at = NOW()
    WHERE reservation_id = $6
    RETURNING *
  `,
    [
      party_size,
      reservation_date,
      reservation_time,
      status,
      notes,
      reservationId,
    ]
  );

  return result.rows[0];
};

// Delete reservation
export const deleteReservationService = async (reservationId) => {
  const reservation = await getReservationByIdService(reservationId);
  if (!reservation) {
    throw new Error("Reservation not found");
  }

  const result = await pool.query(
    `
    DELETE FROM reservations WHERE reservation_id = $1 RETURNING *
  `,
    [reservationId]
  );

  return result.rows[0];
};

// Get reservations by table
export const getReservationsByTableService = async (tableId, date = null) => {
  let query = `
    SELECT 
      r.*,
      c.name as customer_name,
      c.phone_number as customer_phone,
      c.email as customer_email,
      u.user_name as created_by_name
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.customer_id
    LEFT JOIN users u ON r.created_by = u.user_id
    WHERE r.table_id = $1
  `;

  const queryParams = [tableId];

  if (date) {
    query += ` AND r.reservation_date = $2`;
    queryParams.push(date);
  }

  query += ` ORDER BY r.reservation_date, r.reservation_time`;

  const result = await pool.query(query, queryParams);
  return result.rows;
};

// Get table availability with reservations
export const getTableAvailabilityService = async (
  date,
  startTime = null,
  endTime = null,
  sectionCode = null
) => {
  let query = `
    SELECT 
      t.table_id,
      t.section_code,
      t.capacity,
      t.is_occupied,
      t.assigned_server,
      t.occupied_since,
      COALESCE(r.reservation_id, NULL) as has_reservation,
      r.reservation_time,
      c.name as customer_name,
      r.party_size,
      r.status as reservation_status
    FROM tables t
    LEFT JOIN (
      SELECT 
        table_id,
        reservation_id,
        reservation_time,
        party_size,
        status
      FROM reservations 
      WHERE reservation_date = $1 
      AND status = 'confirmed'
      ${startTime ? "AND reservation_time >= $2::time" : ""}
      ${
        endTime
          ? `AND reservation_time <= ${startTime ? "$3" : "$2"}::time`
          : ""
      }
    ) r ON t.table_id = r.table_id
    WHERE 1=1
  `;

  const queryParams = [date];

  if (startTime) {
    queryParams.push(startTime);
  }

  if (endTime) {
    queryParams.push(endTime);
  }

  if (sectionCode) {
    queryParams.push(sectionCode);
    query += ` AND t.section_code = $${queryParams.length}`;
  }

  query += ` ORDER BY t.section_code, t.table_id`;

  const result = await pool.query(query, queryParams);

  // Process results to show availability status
  const availability = result.rows.map((row) => ({
    table_id: row.table_id,
    section_code: row.section_code,
    capacity: row.capacity,
    is_occupied: row.is_occupied,
    assigned_server: row.assigned_server,
    occupied_since: row.occupied_since,
    availability_status: row.has_reservation
      ? "reserved"
      : row.is_occupied
      ? "occupied"
      : "available",
    availability_code: row.has_reservation ? 2 : row.is_occupied ? 1 : 0, // 0: available, 1: occupied, 2: reserved
    reservation: row.has_reservation
      ? {
          time: row.reservation_time,
          party_size: row.party_size,
          status: row.reservation_status,
        }
      : null,
  }));

  return availability;
};

// Get today's reservations
export const getTodayReservationsService = async () => {
  const result = await pool.query(`
    SELECT * FROM today_reservations
    ORDER BY reservation_time
  `);

  return result.rows;
};

// Get reservation statistics
export const getReservationStatsService = async () => {
  const result = await pool.query(`
    SELECT * FROM reservation_stats
  `);

  return result.rows[0];
};

// Check and update overdue reservations
export const checkOverdueReservationsService = async () => {
  // Get reservations that are past their time but still confirmed
  const result = await pool.query(`
    SELECT 
      r.reservation_id,
      r.table_id,
      r.party_size,
      r.reservation_date,
      r.reservation_time,
      r.status,
      c.name as customer_name,
      c.phone_number as customer_phone,
      TO_CHAR(r.reservation_date, 'DD/MM/YYYY') as formatted_date,
      TO_CHAR(r.reservation_time, 'HH24:MI') as formatted_time
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.customer_id
    WHERE r.status = 'confirmed'
    AND (
      -- Past reservations
      r.reservation_date < CURRENT_DATE
      OR 
      -- Today's reservations (30 minutes past)
      (r.reservation_date = CURRENT_DATE AND r.reservation_time < CURRENT_TIME - INTERVAL '30 minutes')
    )
    ORDER BY r.reservation_date, r.reservation_time
  `);

  const overdueReservations = result.rows;

  if (overdueReservations.length > 0) {
    // Update them to overdue status
    const updateResult = await pool.query(
      `
      UPDATE reservations 
      SET status = 'overdue', updated_at = NOW()
      WHERE reservation_id = ANY($1)
      RETURNING reservation_id
    `,
      [overdueReservations.map((r) => r.reservation_id)]
    );
  } else {
  }

  return overdueReservations;
};

// Get overdue reservations
export const getOverdueReservationsService = async () => {
  const result = await pool.query(`
    SELECT 
      r.reservation_id,
      r.customer_id,
      r.table_id,
      r.party_size,
      r.reservation_date,
      r.reservation_time,
      r.status,
      r.duration_hours,
      r.notes,
      r.created_by,
      r.created_at,
      r.updated_at,
      c.name as customer_name,
      c.phone_number as customer_phone,
      c.email as customer_email,
      u.user_name as created_by_name,
      TO_CHAR(r.reservation_date, 'DD/MM/YYYY') as formatted_date,
      TO_CHAR(r.reservation_time, 'HH24:MI') as formatted_time,
      -- Calculate how late they are
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - (r.reservation_date + r.reservation_time))) / 60 as minutes_late
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.customer_id
    LEFT JOIN users u ON r.created_by = u.user_id
    WHERE r.status = 'overdue'
    ORDER BY r.reservation_date, r.reservation_time
  `);

  return result.rows;
};

// Get advanced filtered reservations with comprehensive filtering
export const getAdvancedFilteredReservationsService = async (
  page = 1,
  limit = 20,
  filters = {},
  sortOptions = {}
) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      v.*
    FROM reservation_customer_summary_view v
    WHERE 1=1
  `;

  const queryParams = [];
  let paramCount = 0;

  // Apply filters using reservation_date and reservation_time as strings
  if (filters.date) {
    paramCount++;
    query += ` AND v.reservation_date = $${paramCount}`;
    queryParams.push(filters.date);
  }

  if (filters.start_date) {
    paramCount++;
    query += ` AND v.reservation_date >= $${paramCount}`;
    queryParams.push(filters.start_date);
  }

  if (filters.end_date) {
    paramCount++;
    query += ` AND v.reservation_date <= $${paramCount}`;
    queryParams.push(filters.end_date);
  }

  if (filters.start_time) {
    paramCount++;
    query += ` AND v.reservation_time >= $${paramCount}`;
    queryParams.push(filters.start_time);
  }

  if (filters.end_time) {
    paramCount++;
    query += ` AND v.reservation_time <= $${paramCount}`;
    queryParams.push(filters.end_time);
  }

  if (filters.table_id) {
    paramCount++;
    query += ` AND v.table_id = $${paramCount}`;
    queryParams.push(filters.table_id);
  }

  if (filters.section_code) {
    paramCount++;
    query += ` AND v.table_section = $${paramCount}`;
    queryParams.push(filters.section_code);
  }

  if (filters.status) {
    paramCount++;
    query += ` AND v.reservation_status = $${paramCount}`;
    queryParams.push(filters.status);
  }

  if (filters.customer_name) {
    paramCount++;
    query += ` AND v.customer_name ILIKE $${paramCount}`;
    queryParams.push(`%${filters.customer_name}%`);
  }

  if (filters.customer_phone) {
    paramCount++;
    query += ` AND v.customer_phone ILIKE $${paramCount}`;
    queryParams.push(`%${filters.customer_phone}%`);
  }

  if (filters.party_size_min) {
    paramCount++;
    query += ` AND v.party_size >= $${paramCount}`;
    queryParams.push(filters.party_size_min);
  }

  if (filters.party_size_max) {
    paramCount++;
    query += ` AND v.party_size <= $${paramCount}`;
    queryParams.push(filters.party_size_max);
  }

  if (filters.created_by) {
    paramCount++;
    query += ` AND v.created_by = $${paramCount}`;
    queryParams.push(filters.created_by);
  }

  // Apply sorting
  const sortField = sortOptions.field || "reservation_date";
  const sortOrder = sortOptions.order || "DESC";
  query += ` ORDER BY v.${sortField} ${sortOrder}`;

  // Apply pagination
  paramCount++;
  query += ` LIMIT $${paramCount}`;
  queryParams.push(limit);

  paramCount++;
  query += ` OFFSET $${paramCount}`;
  queryParams.push(offset);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) as total
    FROM reservation_customer_summary_view v
    WHERE 1=1
  `;

  const countParams = [];
  let countParamCount = 0;

  // Apply same filters to count query
  if (filters.date) {
    countParamCount++;
    countQuery += ` AND v.reservation_date = $${countParamCount}`;
    countParams.push(filters.date);
  }

  if (filters.start_date) {
    countParamCount++;
    countQuery += ` AND v.reservation_date >= $${countParamCount}`;
    countParams.push(filters.start_date);
  }

  if (filters.end_date) {
    countParamCount++;
    countQuery += ` AND v.reservation_date <= $${countParamCount}`;
    countParams.push(filters.end_date);
  }

  if (filters.start_time) {
    countParamCount++;
    countQuery += ` AND v.reservation_time >= $${countParamCount}`;
    countParams.push(filters.start_time);
  }

  if (filters.end_time) {
    countParamCount++;
    countQuery += ` AND v.reservation_time <= $${countParamCount}`;
    countParams.push(filters.end_time);
  }

  if (filters.table_id) {
    countParamCount++;
    countQuery += ` AND v.table_id = $${countParamCount}`;
    countParams.push(filters.table_id);
  }

  if (filters.section_code) {
    countParamCount++;
    countQuery += ` AND v.table_section = $${countParamCount}`;
    countParams.push(filters.section_code);
  }

  if (filters.status) {
    countParamCount++;
    countQuery += ` AND v.reservation_status = $${countParamCount}`;
    countParams.push(filters.status);
  }

  if (filters.customer_name) {
    countParamCount++;
    countQuery += ` AND v.customer_name ILIKE $${countParamCount}`;
    countParams.push(`%${filters.customer_name}%`);
  }

  if (filters.customer_phone) {
    countParamCount++;
    countQuery += ` AND v.customer_phone ILIKE $${countParamCount}`;
    countParams.push(`%${filters.customer_phone}%`);
  }

  if (filters.party_size_min) {
    countParamCount++;
    countQuery += ` AND v.party_size >= $${countParamCount}`;
    countParams.push(filters.party_size_min);
  }

  if (filters.party_size_max) {
    countParamCount++;
    countQuery += ` AND v.party_size <= $${countParamCount}`;
    countParams.push(filters.party_size_max);
  }

  if (filters.created_by) {
    countParamCount++;
    countQuery += ` AND v.created_by = $${countParamCount}`;
    countParams.push(filters.created_by);
  }

  const [result, countResult] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, countParams),
  ]);

  // Check and update overdue status in real-time for confirmed reservations
  const reservations = result.rows.map(reservation => {
    // If status is 'confirmed', check if it's overdue
    if (reservation.reservation_status === 'confirmed') {
      const now = new Date();
      const reservationDate = new Date(reservation.reservation_date);
      const [hours, minutes] = reservation.reservation_time.split(':');
      reservationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If reservation time has passed, mark as overdue
      if (reservationDate < now) {
        reservation.reservation_status = 'overdue';
        // Optionally update in database (fire and forget)
        pool.query(
          'UPDATE reservations SET status = $1, updated_at = NOW() WHERE reservation_id = $2',
          ['overdue', reservation.reservation_id]
        ).catch(() => {}); // Silent fail, just log in real scenario
      }
    }
    return reservation;
  });

  return {
    data: reservations,
    total: parseInt(countResult.rows[0].total),
  };
};

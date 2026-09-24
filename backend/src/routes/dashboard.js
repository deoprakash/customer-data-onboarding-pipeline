const express = require("express");
const pool = require("../services/database");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 1. KPI Queries
    const customersResult = await pool.query(`SELECT COUNT(*) as total_customers FROM customers`);
    const activeJobsResult = await pool.query(`SELECT COUNT(*) as active_jobs FROM onboarding_jobs WHERE status IN ('processing', 'queued')`);
    const recordsResult = await pool.query(`SELECT SUM(records_received) as records_received, SUM(records_valid) as records_valid, SUM(records_rejected) as records_rejected FROM onboarding_jobs`);
    const jobsStatsResult = await pool.query(`SELECT COUNT(*) as total_jobs, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_jobs, SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_jobs FROM onboarding_jobs`);
    
    // 2. Recent Jobs
    const recentJobsResult = await pool.query(`
      SELECT job_id as id, customer, 'CSV' as source, records_received as records, status, 
             CASE WHEN records_received > 0 THEN ROUND((records_valid::numeric / records_received) * 100, 1) ELSE 0 END as quality,
             created_at as started 
      FROM onboarding_jobs 
      ORDER BY created_at DESC LIMIT 10
    `);

    // 3. Chart Data (Group by day for the last 7 days)
    const chartResult = await pool.query(`
      WITH dates AS (
        SELECT generate_series(
          current_date - interval '6 days',
          current_date,
          '1 day'::interval
        )::date AS date
      )
      SELECT 
        to_char(d.date, 'Dy') as name,
        COALESCE(COUNT(j.job_id), 0)::int as jobs,
        COALESCE(SUM(j.records_received), 0)::int as records,
        COALESCE(SUM(CASE WHEN j.status = 'failed' THEN 1 ELSE 0 END), 0)::int as failed
      FROM dates d
      LEFT JOIN onboarding_jobs j ON j.created_at::date = d.date
      GROUP BY d.date
      ORDER BY d.date
    `);

    // Aggregations
    const recordsReceived = recordsResult.rows[0].records_received || 0;
    const recordsValid = recordsResult.rows[0].records_valid || 0;
    const recordsRejected = recordsResult.rows[0].records_rejected || 0;
    
    const dataQuality = recordsReceived > 0 
      ? ((recordsValid / recordsReceived) * 100).toFixed(1) 
      : 0;

    res.json({
      kpis: {
        totalCustomers: parseInt(customersResult.rows[0].total_customers, 10),
        activeJobs: parseInt(activeJobsResult.rows[0].active_jobs, 10),
        recordsProcessed: parseInt(recordsReceived, 10),
        dataQuality: parseFloat(dataQuality),
      },
      additionalKpis: {
        jobsToday: parseInt(jobsStatsResult.rows[0].total_jobs, 10), // Simplification for demo
        successfulJobs: parseInt(jobsStatsResult.rows[0].successful_jobs, 10),
        failedJobs: parseInt(jobsStatsResult.rows[0].failed_jobs, 10),
        recordsRejected: parseInt(recordsRejected, 10)
      },
      chartData: chartResult.rows,
      recentJobs: recentJobsResult.rows.map(job => ({
        ...job,
        status: job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Unknown',
        quality: job.quality ? `${job.quality}%` : '—',
        records: job.records ? parseInt(job.records, 10).toLocaleString() : '0'
      })),
      alerts: [
        { id: 1, icon: '⚠️', text: `${recordsRejected} records rejected recently`, type: 'warning' },
      ]
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

module.exports = router;

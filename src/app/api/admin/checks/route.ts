import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  verifyAdmin,
  adminUnauthorizedResponse,
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  logSecurityEvent,
} from '@/lib/security';

// Rate limit config: 30 requests per minute for admin routes
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyPrefix: 'admin',
};

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Check rate limit first
    const rateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIG);
    if (!rateLimit.success) {
      logSecurityEvent('rate_limit', { 
        ip: clientIP, 
        route: '/api/admin/checks',
        resetIn: rateLimit.resetIn 
      });
      return rateLimitResponse(rateLimit.resetIn);
    }

    // Verify admin access
    const adminCheck = await verifyAdmin();
    if (!adminCheck.isAdmin) {
      logSecurityEvent('unauthorized', { 
        ip: clientIP, 
        route: '/api/admin/checks',
        userId: adminCheck.userId,
        error: adminCheck.error
      });
      return adminUnauthorizedResponse(adminCheck.error || 'Access denied');
    }

    logSecurityEvent('admin_access', { 
      ip: clientIP, 
      route: '/api/admin/checks',
      userId: adminCheck.userId
    });

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const riskLevel = searchParams.get('riskLevel');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = supabaseAdmin();
    
    if (!supabase) {
      // Return demo data if Supabase not configured
      const dailyStats: Array<{ date: string; total: number; high: number; medium: number; low: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyStats.push({
          date: date.toISOString().split('T')[0],
          total: Math.floor(Math.random() * 20) + 5,
          high: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 10),
          low: Math.floor(Math.random() * 10)
        });
      }
      
      // Demo symptom trends
      const symptomTrends = [
        { symptom: 'Headache', count: 45, trend: 12 },
        { symptom: 'Fever', count: 38, trend: -5 },
        { symptom: 'Cough', count: 32, trend: 8 },
        { symptom: 'Fatigue', count: 28, trend: 3 },
        { symptom: 'Nausea', count: 22, trend: -2 },
      ];

      // Demo recent activity
      const recentActivity = [
        { id: '1', type: 'check', message: 'New high-risk check detected', time: '2 mins ago', severity: 'high' },
        { id: '2', type: 'check', message: 'User completed symptom assessment', time: '5 mins ago', severity: 'low' },
        { id: '3', type: 'user', message: 'New user registered', time: '12 mins ago', severity: 'info' },
        { id: '4', type: 'check', message: 'Medium risk assessment completed', time: '18 mins ago', severity: 'medium' },
        { id: '5', type: 'system', message: 'Daily backup completed', time: '1 hour ago', severity: 'info' },
      ];

      return NextResponse.json({
        data: [],
        stats: { 
          totalChecks: 156, 
          highRiskCount: 23,
          uniqueUsers: 89,
          avgSeverity: 5.2,
          checksToday: dailyStats[6].total,
          checksThisWeek: dailyStats.reduce((sum, d) => sum + d.total, 0),
          dailyStats,
          symptomTrends,
          recentActivity,
        },
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }
    
    // Build query
    let query = supabase
      .from('symptom_checks')
      .select('*', { count: 'exact' });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    // Get total count for stats
    const { count: totalCount } = await supabase
      .from('symptom_checks')
      .select('*', { count: 'exact', head: true });

    // Get high risk count
    const { data: allChecks } = await supabase
      .from('symptom_checks')
      .select('user_id, severity, risk_level, ai_response, created_at, symptoms');

    let highRiskCount = 0;
    let totalSeverity = 0;
    const uniqueUsers = new Set<string>();
    const symptomCounts: Record<string, number> = {};

    allChecks?.forEach((check) => {
      // Count high risk
      if (check.risk_level === 'High') highRiskCount++;
      
      // Sum severity
      totalSeverity += check.severity || 5;
      
      // Track unique users
      if (check.user_id) uniqueUsers.add(check.user_id);
      
      // Count symptoms
      const symptoms = check.symptoms?.toLowerCase() || '';
      const commonSymptoms = ['headache', 'fever', 'cough', 'fatigue', 'nausea', 'pain', 'dizziness', 'chest', 'breathing'];
      commonSymptoms.forEach(s => {
        if (symptoms.includes(s)) {
          symptomCounts[s] = (symptomCounts[s] || 0) + 1;
        }
      });
    });

    // Get daily stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentChecks } = await supabase
      .from('symptom_checks')
      .select('created_at, risk_level')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Process daily stats
    const dailyStats: Record<string, { total: number; high: number; medium: number; low: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { total: 0, high: 0, medium: 0, low: 0 };
    }

    recentChecks?.forEach((check) => {
      const dateStr = new Date(check.created_at).toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total++;
        if (check.risk_level === 'High') dailyStats[dateStr].high++;
        else if (check.risk_level === 'Medium') dailyStats[dateStr].medium++;
        else dailyStats[dateStr].low++;
      }
    });

    // Build symptom trends
    const symptomTrends = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom, count]) => ({
        symptom: symptom.charAt(0).toUpperCase() + symptom.slice(1),
        count,
        trend: Math.floor(Math.random() * 20) - 10 // Random trend for now
      }));

    // Get paginated data
    const offset = (page - 1) * limit;
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    const dailyStatsArray = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    return NextResponse.json({
      data,
      stats: {
        totalChecks: totalCount || 0,
        highRiskCount,
        uniqueUsers: uniqueUsers.size,
        avgSeverity: allChecks?.length ? (totalSeverity / allChecks.length).toFixed(1) : 0,
        checksToday: dailyStatsArray[6]?.total || 0,
        checksThisWeek: dailyStatsArray.reduce((sum, d) => sum + d.total, 0),
        dailyStats: dailyStatsArray,
        symptomTrends,
        recentActivity: [],
      },
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing checks
export async function DELETE(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIG);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    // Verify admin access
    const adminCheck = await verifyAdmin();
    if (!adminCheck.isAdmin) {
      logSecurityEvent('unauthorized', { 
        ip: clientIP, 
        route: '/api/admin/checks DELETE',
        userId: adminCheck.userId
      });
      return adminUnauthorizedResponse(adminCheck.error || 'Access denied');
    }

    const { searchParams } = new URL(request.url);
    const checkId = searchParams.get('id');

    if (!checkId) {
      return NextResponse.json({ error: 'Check ID required' }, { status: 400 });
    }

    // Validate checkId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(checkId)) {
      logSecurityEvent('invalid_input', { ip: clientIP, field: 'checkId', value: checkId });
      return NextResponse.json({ error: 'Invalid check ID format' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { error } = await supabase
      .from('symptom_checks')
      .delete()
      .eq('id', checkId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    logSecurityEvent('admin_access', { 
      ip: clientIP, 
      action: 'delete_check',
      checkId,
      userId: adminCheck.userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete check' }, { status: 500 });
  }
}
